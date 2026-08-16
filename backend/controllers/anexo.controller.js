const path = require("path");

const {
    Anexo,
    PedidoRequisito,
    PedidoCredito,
} = require("../models");

// Confirma que o pedidoRequisito pertence a um pedido da empresa autenticada
async function obterPedidoRequisitoDaEmpresa(pedidoRequisitoId, empresaId) {
    return PedidoRequisito.findOne({
        where: { id: pedidoRequisitoId },
        include: [{ model: PedidoCredito, as: "pedido", where: { empresaId }, required: true }],
    });
}

async function anexar (req, res) {
    try {
        const pedidoRequisito = await obterPedidoRequisitoDaEmpresa(req.params.id, req.user.empresaId);
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
        const pedidoRequisito = await obterPedidoRequisitoDaEmpresa(req.params.id, req.user.empresaId);
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
        const ehDaMesmaEmpresa = pedido?.empresaId === req.user.empresaId;
        const ehDono = anexo.userId === req.user.id;

        if (!ehDaMesmaEmpresa && !ehDono) {
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
