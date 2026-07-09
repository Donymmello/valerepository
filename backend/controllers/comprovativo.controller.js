const path = require("path");
const { Comprovativo, PedidoCredito, Reembolso, User } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const { generateReferencia } = require("../utils/generateCode");
const { podeRegistrarReembolso, STATUS_PEDIDO } = require("../utils/regrasPedido");

/*
  ==========================================================
  ENVIAR COMPROVATIVO (PORTAL MUTUÁRIO)
  ==========================================================
  O mutuário envia o comprovativo de pagamento ligado ao pedido.
  O ficheiro é guardado em uploads/comprovativos.
*/
async function enviarComprovativo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Nenhum ficheiro foi enviado.",
      });
    }

    const { pedidoId } = req.params;

    // Verifica que o pedido existe e pertence ao mutuário autenticado
    const pedido = await PedidoCredito.findOne({
      where: { id: pedidoId },
      include: [{ association: "mutuario" }],
    });

    if (!pedido) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    // Só pedidos desembolsados aceitam comprovativos
    if (pedido.status !== STATUS_PEDIDO.DESEMBOLSADO) {
      return res.status(400).json({
        message: `Só é possível enviar comprovativos para pedidos com status DESEMBOLSADO. Status actual: ${pedido.status}.`,
      });
    }

    const comprovativo = await Comprovativo.create({
      pedidoId,
      userId: req.user.id,
      nome: req.file.originalname,
      arquivo: req.file.filename,
      mimeType: req.file.mimetype,
      tamanho: req.file.size,
      estado: "PENDENTE",
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ENVIAR_COMPROVATIVO",
      entidade: "Comprovativo",
      entidadeId: comprovativo.id,
      descricao: `Comprovativo ${req.file.originalname} enviado para pedido ${pedido.numeroPedido}.`,
    });

    return res.status(201).json({
      message: "Comprovativo enviado com sucesso.",
      comprovativo,
    });
  } catch (error) {
    console.error("Erro ao enviar comprovativo:", error);
    return res.status(500).json({
      message: "Erro ao enviar comprovativo.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR COMPROVATIVOS DE UM PEDIDO (BACKOFFICE)
  ==========================================================
*/
async function getComprovativos(req, res) {
  try {
    const { pedidoId } = req.params;

    const comprovativos = await Comprovativo.findAll({
      where: { pedidoId },
      include: [
        {
          model: User,
          as: "remetente",
          attributes: ["id", "nome", "email"],
        },
        {
          model: User,
          as: "validador",
          attributes: ["id", "nome", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(comprovativos);
  } catch (error) {
    console.error("Erro ao listar comprovativos:", error);
    return res.status(500).json({
      message: "Erro ao listar comprovativos.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR MEUS COMPROVATIVOS (PORTAL MUTUÁRIO)
  ==========================================================
*/
async function getMeusComprovativos(req, res) {
  try {
    const { pedidoId } = req.params;

    // Confirma que o pedido pertence ao mutuário autenticado
    const pedido = await PedidoCredito.findOne({
      where: { id: pedidoId },
      include: [{ association: "mutuario", where: { userId: req.user.id } }],
    });

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido não encontrado ou sem acesso.",
      });
    }

    const comprovativos = await Comprovativo.findAll({
      where: { pedidoId },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(comprovativos);
  } catch (error) {
    console.error("Erro ao listar comprovativos:", error);
    return res.status(500).json({
      message: "Erro ao listar comprovativos.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  DOWNLOAD DO COMPROVATIVO
  ==========================================================
*/
async function downloadComprovativo(req, res) {
  try {
    const { id } = req.params;

    const comprovativo = await Comprovativo.findByPk(id);

    if (!comprovativo) {
      return res.status(404).json({ message: "Comprovativo não encontrado." });
    }

    return res.download(
      path.resolve("upload/comprovativos", comprovativo.arquivo),
      comprovativo.nome
    );
  } catch (error) {
    console.error("Erro ao baixar comprovativo:", error);
    return res.status(500).json({
      message: "Erro ao baixar comprovativo.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  VALIDAR COMPROVATIVO E REGISTAR REEMBOLSO (BACKOFFICE)
  ==========================================================
  Valida o comprovativo e cria automaticamente o reembolso
  com os dados fornecidos pelo backoffice.
*/
async function validarComprovativo(req, res) {
  try {
    const { id } = req.params;
    const {
      estado,
      observacoes,
      // campos do reembolso (só obrigatórios se estado === "VALIDADO")
      valorReembolsado,
      dataReembolso,
      meioPagamento,
      numeroTransacao,
    } = req.body;

    const estadosPermitidos = ["VALIDADO", "REJEITADO"];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        message: "Estado inválido. Use VALIDADO ou REJEITADO.",
      });
    }

    const comprovativo = await Comprovativo.findByPk(id, {
      include: [{ model: PedidoCredito, as: "pedido" }],
    });

    if (!comprovativo) {
      return res.status(404).json({ message: "Comprovativo não encontrado." });
    }

    if (comprovativo.estado !== "PENDENTE") {
      return res.status(409).json({
        message: `Este comprovativo já foi ${comprovativo.estado.toLowerCase()}.`,
      });
    }

    // Verifica permissão para registar reembolso
    if (!podeRegistrarReembolso(req.user, comprovativo.pedido)) {
      return res.status(403).json({
        message: "Não tens permissão para validar este comprovativo.",
      });
    }

    let reembolso = null;

    // Se validado, cria o reembolso automaticamente
    if (estado === "VALIDADO") {
      if (!valorReembolsado || Number(valorReembolsado) <= 0) {
        return res.status(400).json({
          message: "valorReembolsado é obrigatório ao validar o comprovativo.",
        });
      }

      reembolso = await Reembolso.create({
        pedidoId: comprovativo.pedidoId,
        valorReembolsado,
        dataReembolso: dataReembolso || new Date(),
        meioPagamento: meioPagamento || "TRANSFERENCIA",
        numeroTransacao: numeroTransacao || null,
        referencia: await generateReferencia(),
        observacoes: observacoes || null,
        createdBy: req.user.id,
      });

      await registrarLogAuditoria({
        userId: req.user.id,
        acao: "CRIAR_REEMBOLSO",
        entidade: "Reembolso",
        entidadeId: reembolso.id,
        descricao: `Reembolso de ${valorReembolsado} criado via comprovativo para pedido ${comprovativo.pedido.numeroPedido}.`,
      });
    }

    // Actualiza o comprovativo
    await comprovativo.update({
      estado,
      observacoes: observacoes || null,
      validadoPor: req.user.id,
      dataValidacao: new Date(),
      reembolsoId: reembolso?.id || null,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: `${estado}_COMPROVATIVO`,
      entidade: "Comprovativo",
      entidadeId: comprovativo.id,
      descricao: `Comprovativo ${comprovativo.nome} ${estado.toLowerCase()} para pedido ${comprovativo.pedido.numeroPedido}.`,
    });

    return res.status(200).json({
      message: `Comprovativo ${estado.toLowerCase()} com sucesso.`,
      comprovativo,
      reembolso,
    });
  } catch (error) {
    console.error("Erro ao validar comprovativo:", error);
    return res.status(500).json({
      message: "Erro ao validar comprovativo.",
      error: error.message,
    });
  }
}

module.exports = {
  enviarComprovativo,
  getComprovativos,
  getMeusComprovativos,
  downloadComprovativo,
  validarComprovativo,
};