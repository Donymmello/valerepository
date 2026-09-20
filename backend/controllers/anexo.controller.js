const path = require("path");

const {
    Anexo,
    PedidoRequisito,
    PedidoCredito,
    Mutuario,
} = require("../models");

const PERFIS_BACKOFFICE = ["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"];

function ehStaff(user) {
    return PERFIS_BACKOFFICE.includes(user.role);
}

/*
  Confirma que o pedidoRequisito pertence a um pedido da empresa autenticada
  E que este utilizador tem direito a vê-lo.

  Antes só verificava a empresa. Como os mutuários do portal são
  utilizadores normais da mesma empresa (role USER, ver auth.controller.js),
  pertencer à empresa chegava para qualquer um deles ler e escrever nos
  anexos de KYC de todos os outros clientes (bilhete, recibo de
  vencimento, comprovativo de morada) só a adivinhar ids sequenciais.
  Mesmo critério já usado em comprovativo.controller.js: staff da empresa,
  ou o próprio mutuário do pedido.
*/
async function obterPedidoRequisitoAcessivel(pedidoRequisitoId, user) {
    const pedidoRequisito = await PedidoRequisito.findOne({
        where: { id: pedidoRequisitoId },
        include: [{ model: PedidoCredito, as: "pedido", where: { empresaId: user.empresaId }, required: true }],
    });

    if (!pedidoRequisito) return null;
    if (ehStaff(user)) return pedidoRequisito;

    const mutuario = await Mutuario.findOne({ where: { userId: user.id }, attributes: ["id"] });
    if (!mutuario || pedidoRequisito.pedido.mutuarioId !== mutuario.id) return null;

    return pedidoRequisito;
}

async function anexar (req, res) {
    try {
        const pedidoRequisito = await obterPedidoRequisitoAcessivel(req.params.id, req.user);
        if (!pedidoRequisito) {
            return res.status(404).json({ message: "Requisito de pedido não encontrado." });
        }

        const anexo = await Anexo.create({
            pedidoRequisitoId: req.params.id,
            nome: req.file.originalname,
            arquivo: req.file.filename,
            mimeType: req.file.mimetype,
            tamanho: req.file.size,
            userId: req.user.id,
        });

        return res.status(201).json(anexo);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Erro ao enviar documento",
        });
    }
}

async function listar (req, res) {
    try {
        const pedidoRequisito = await obterPedidoRequisitoAcessivel(req.params.id, req.user);
        if (!pedidoRequisito) {
            return res.status(404).json({ message: "Requisito de pedido não encontrado." });
        }

        const anexos = await Anexo.findAll({
            where: {
                pedidoRequisitoId: req.params.id,
            },
            order: [["created_at", "DESC"]],
        });

        return res.json(anexos);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Erro ao listar anexos"
        });
    }
}

async function download (req, res) {
    try {
        const anexo = await Anexo.findByPk(req.params.id, {
            include: [{
                model: PedidoRequisito,
                as: "pedidoRequisito",
                include: [{ model: PedidoCredito, as: "pedido" }],
            }],
        });

        if (!anexo) {
            return res.status(404).json({
                message: "Documento nao encontrado",
            });
        }

        const pedido = anexo.pedidoRequisito?.pedido;
        // Pertencer à empresa não chega: tem de ser staff dessa empresa,
        // ou quem enviou o próprio documento.
        const ehStaffDaMesmaEmpresa = pedido?.empresaId === req.user.empresaId && ehStaff(req.user);
        const ehDono = anexo.userId === req.user.id;

        if (!ehStaffDaMesmaEmpresa && !ehDono) {
            return res.status(404).json({
                message: "Documento nao encontrado",
            });
        }

        return res.download(
            path.resolve(
                "upload/anexos",
                anexo.arquivo
            ),
            anexo.nome
        );
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Erro ao baixar documento",
        });
    }
}

module.exports = {
    anexar,
    listar,
    download,
};
