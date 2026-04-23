const { Reembolso, PedidoCredito, User, Desembolso } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const generateReferencia = require("../utils/generateReferencia");
const {
  podeRegistrarReembolso,
  STATUS_PEDIDO,
} = require("../utils/regrasPedido");

/*
    ==========================================================
    FUNÇÃO AUXILIAR PARA CALCULAR O ESTADO FINANCEIRO DO PEDIDO
    SE O PEDIDO ESTIVER TOTALMENTE PAGO, FECHA AUTOMATICAMENTE
    ==========================================================
*/
async function calcularEstadoFinanceiro(pedidoId, userId) {
  /*
    Buscar todos os desembolsos do pedido
  */
  const desembolsos = await Desembolso.findAll({
    where: { pedidoId },
  });

  /*
    Buscar todos os reembolsos do pedido
  */
  const reembolsos = await Reembolso.findAll({
    where: { pedidoId },
  });

  /*
    Soma o total desembolsado
  */
  const totalDesembolsado = desembolsos.reduce((total, item) => {
    return total + Number(item.valorDesembolsado || 0);
  }, 0);

  /*
    Soma o total reembolsado
  */
  const totalReembolsado = reembolsos.reduce((total, item) => {
    return total + Number(item.valorReembolsado || 0);
  }, 0);

  const pedido = await PedidoCredito.findByPk(pedidoId);

  if (!pedido) return;

  /*
    Se o pedido tiver sido totalmente reembolsado,
    fecha automaticamente
  */
  if (
    totalDesembolsado > 0 &&
    totalReembolsado >= totalDesembolsado &&
    pedido.status !== STATUS_PEDIDO.ENCERRADO
  ) {
    await pedido.update({
      status: STATUS_PEDIDO.ENCERRADO,
    });

    await registrarLogAuditoria({
      userId,
      acao: "ENCERRAR_PEDIDO_AUTOMATICAMENTE",
      entidade: "PedidoCredito",
      entidadeId: pedidoId,
      descricao: `Pedido ${pedido.numeroPedido} encerrado automaticamente após reembolso total.`,
    });
  }
}

/*
    ==========================================================
    CONTROLADOR DE REEMBOLSO
    ==========================================================
*/
async function createReembolso(req, res) {
  try {
    const {
      pedidoId,
      valorReembolsado,
      dataReembolso,
      meioPagamento,
      numeroTransacao,
      observacoes,
    } = req.body;

    if (!pedidoId || !valorReembolsado) {
      return res.status(400).json({
        message: "pedidoId e valorReembolsado são obrigatórios.",
      });
    }

    if (Number(valorReembolsado) <= 0) {
      return res.status(400).json({
        message: "Valor do reembolso deve ser maior que zero.",
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
      valida perfil + status permitido para reembolso
    */
    if (!podeRegistrarReembolso(req.user, pedido)) {
      return res.status(403).json({
        message:
          "Não tens permissão para registar reembolso neste pedido ou o status atual não permite.",
      });
    }

    const referencia = await generateReferencia();

    const reembolso = await Reembolso.create({
      pedidoId,
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
      descricao: `Reembolso de ${valorReembolsado} criado para pedido ${pedido.numeroPedido}.`,
    });

    /*
      Recalcula e encerra o pedido se tiver sido totalmente reembolsado
    */
    await calcularEstadoFinanceiro(pedidoId, req.user.id);

    const pedidoAtualizado = await PedidoCredito.findByPk(pedidoId);

    return res.status(201).json({
      message: "Reembolso criado com sucesso.",
      reembolso,
      pedido: pedidoAtualizado,
    });
  } catch (error) {
    console.error("Erro ao criar reembolso:", error);

    return res.status(500).json({
      message: "Erro interno ao criar reembolso.",
      error: error.message,
    });
  }
}

/*
    ==========================================================
    LISTAR TODOS OS REEMBOLSOS
    ==========================================================
*/
async function getAllReembolsos(req, res) {
  try {
    const reembolsos = await Reembolso.findAll({
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

    return res.status(200).json(reembolsos);
  } catch (error) {
    console.error("Erro ao listar reembolsos:", error);

    return res.status(500).json({
      message: "Erro interno ao listar reembolsos.",
      error: error.message,
    });
  }
}

/*
    ==========================================================
    LISTAR REEMBOLSOS POR PEDIDO
    ==========================================================
*/
async function getReembolsoByPedido(req, res) {
  try {
    const { pedidoId } = req.params;

    const reembolsos = await Reembolso.findAll({
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

    return res.status(200).json(reembolsos);
  } catch (error) {
    console.error("Erro ao listar reembolsos por pedido:", error);

    return res.status(500).json({
      message: "Erro interno ao listar reembolsos por pedido.",
      error: error.message,
    });
  }
}

module.exports = {
  createReembolso,
  getAllReembolsos,
  getReembolsoByPedido,
};