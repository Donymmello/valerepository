const { Desembolso, PedidoCredito, User, ParcelaPagamento } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const generateReferencia = require("../utils/generateReferencia");
const creditoService = require("../services/credito.service");
const {
  podeDesembolsarPedido,
  podeTransitarStatus,
  STATUS_PEDIDO,
} = require("../utils/regrasPedido");

/*
    ==========================================================
    CONTROLADOR DE DESEMBOLSO
    ==========================================================
*/
async function createDesembolso(req, res) {
  try {
    const {
      pedidoId,
      valorDesembolsado,
      dataDesembolso,
      meioPagamento,
      numeroTransacao,
      observacoes,
    } = req.body;

    if (!pedidoId || !valorDesembolsado) {
      return res.status(400).json({
        message: "pedidoId e valorDesembolsado são obrigatórios.",
      });
    }

    if (Number(valorDesembolsado) <= 0) {
      return res.status(400).json({
        message: "Valor do desembolso deve ser maior que zero.",
      });
    }

    const pedido = await PedidoCredito.findByPk(pedidoId);

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido de crédito não encontrado.",
      });
    }

    /*
      Regra forte:
      valida perfil + status permitido para desembolso
    */
    if (!podeDesembolsarPedido(req.user, pedido)) {
      return res.status(403).json({
        message:
          "Não tens permissão para desembolsar este pedido ou o status atual não permite.",
      });
    }

    /*
      Garante que a transição para DESEMBOLSADO é válida
    */
    if (!podeTransitarStatus(pedido.status, STATUS_PEDIDO.DESEMBOLSADO)) {
      return res.status(400).json({
        message: `Transição inválida de status: ${pedido.status} -> ${STATUS_PEDIDO.DESEMBOLSADO}.`,
      });
    }

    const referencia = await generateReferencia();

    const desembolso = await Desembolso.create({
      pedidoId,
      valorDesembolsado,
      dataDesembolso: dataDesembolso || new Date(),
      meioPagamento: meioPagamento || "TRANSFERENCIA",
      numeroTransacao: numeroTransacao || null,
      referencia,
      observacoes: observacoes || null,
      createdBy: req.user.id,
    });

    await creditoService.criarCredito(
      pedido,
      desembolso,
      req.user.id
    );


    await pedido.update({
      status: STATUS_PEDIDO.DESEMBOLSADO,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "CRIAR_DESEMBOLSO",
      entidade: "Desembolso",
      entidadeId: desembolso.id,
      descricao: `Desembolso de ${valorDesembolsado} criado para pedido ${pedido.numeroPedido}.`,
    });

    return res.status(201).json({
      message: "Desembolso criado com sucesso.",
      desembolso,
      pedido,
    });
  } catch (error) {
    console.error("Erro ao criar desembolso:", error);

    return res.status(500).json({
      message: "Erro interno ao criar desembolso.",
      error: error.message,
    });
  }
}

/*
    ==========================================================
    LISTAR TODOS OS DESEMBOLSOS
    ==========================================================
*/
async function getAllDesembolsos(req, res) {
  try {
    const desembolsos = await Desembolso.findAll({
      include: [
        {
          model: PedidoCredito,
          as: "pedido",
        },
        {
          model: User,
          as: "criador",
          attributes: ["id", "nome", "email", "role"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(desembolsos);
  } catch (error) {
    console.error("Erro ao buscar desembolsos:", error);

    return res.status(500).json({
      message: "Erro interno ao buscar desembolsos.",
      error: error.message,
    });
  }
}

/*
    ==========================================================
    LISTAR DESEMBOLSOS POR PEDIDO
    ==========================================================
*/
async function getDesembolsoByPedido(req, res) {
  try {
    const { pedidoId } = req.params;

    const desembolsos = await Desembolso.findAll({
      where: { pedidoId },
      include: [
        {
          model: PedidoCredito,
          as: "pedido",
        },
        {
          model: User,
          as: "criador",
          attributes: ["id", "nome", "email", "role"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json(desembolsos);
  } catch (error) {
    console.error("Erro ao buscar desembolso por pedido:", error);

    return res.status(500).json({
      message: "Erro interno ao buscar desembolso por pedido.",
      error: error.message,
    });
  }
}

module.exports = {
  createDesembolso,
  getAllDesembolsos,
  getDesembolsoByPedido,
};