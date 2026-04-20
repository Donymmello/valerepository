const { PedidoCredito, Mutuario, User, AprovacaoPedido } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const {
  podeCriarPedido,
  podeEditarPedido,
  podeTransitarStatus,
  STATUS_PEDIDO,
} = require("../utils/regrasPedido");

/*
  ==========================================================
  FUNÇÃO AUXILIAR PARA GERAR NÚMERO DO PEDIDO
  ==========================================================
*/
function generateNumeroPedido() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const random = Math.floor(100000 + Math.random() * 900000);

  return `PED-${year}${month}${day}-${random}`;
}

/*
  ==========================================================
  CRIAR PEDIDO DE CRÉDITO
  ==========================================================
*/
async function createPedidoCredito(req, res) {
  try {
    const {
      mutuarioId,
      valorSolicitado,
      finalidade,
      pacoteFinanciamento,
      prazoAvaliacao,
      prazoValidacao,
      observacoes,
    } = req.body;

    /*
      Regra de perfil
    */
    if (!podeCriarPedido(req.user)) {
      return res.status(403).json({
        message: "Não tens permissão para criar pedido de crédito.",
      });
    }

    if (!mutuarioId || !valorSolicitado || !finalidade) {
      return res.status(400).json({
        message: "mutuarioId, valorSolicitado e finalidade são obrigatórios.",
      });
    }

    if (Number(valorSolicitado) <= 0) {
      return res.status(400).json({
        message: "valorSolicitado deve ser maior que zero.",
      });
    }

    const mutuario = await Mutuario.findByPk(mutuarioId);

    if (!mutuario) {
      return res.status(404).json({
        message: "Mutuário não encontrado.",
      });
    }

    const pedido = await PedidoCredito.create({
      numeroPedido: generateNumeroPedido(),
      mutuarioId,
      valorSolicitado,
      finalidade,
      pacoteFinanciamento: pacoteFinanciamento || null,
      status: STATUS_PEDIDO.SUBMETIDO,
      etapaAtual: 1,
      dataSubmissao: new Date(),
      prazoAvaliacao: prazoAvaliacao || null,
      prazoValidacao: prazoValidacao || null,
      observacoes: observacoes || null,
      createdBy: req.user.id,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "CRIAR_PEDIDO_CREDITO",
      entidade: "PedidoCredito",
      entidadeId: pedido.id,
      descricao: `Pedido ${pedido.numeroPedido} criado para o mutuário ID ${pedido.mutuarioId}.`,
    });

    return res.status(201).json({
      message: "Pedido de crédito criado com sucesso.",
      pedido,
    });
  } catch (error) {
    console.error("Erro ao criar pedido de crédito:", error);

    return res.status(500).json({
      message: "Erro interno ao criar pedido de crédito.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR TODOS OS PEDIDOS
  ==========================================================
*/
async function getAllPedidosCredito(req, res) {
  try {
    const pedidos = await PedidoCredito.findAll({
      include: [
        {
          model: Mutuario,
          as: "mutuario",
        },
        {
          model: User,
          as: "criador",
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json(pedidos);
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);

    return res.status(500).json({
      message: "Erro interno ao listar pedidos.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  BUSCAR PEDIDO POR ID
  ==========================================================
*/
async function getPedidoCreditoById(req, res) {
  try {
    const { id } = req.params;

    const pedido = await PedidoCredito.findByPk(id, {
      include: [
        {
          model: Mutuario,
          as: "mutuario",
        },
        {
          model: User,
          as: "criador",
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
        {
          model: AprovacaoPedido,
          as: "aprovacoes",
          required: false,
        },
      ],
    });

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido de crédito não encontrado.",
      });
    }

    return res.status(200).json(pedido);
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);

    return res.status(500).json({
      message: "Erro interno ao buscar pedido.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR PEDIDOS DE UM MUTUÁRIO
  ==========================================================
*/
async function getPedidosByMutuario(req, res) {
  try {
    const { mutuarioId } = req.params;

    const mutuario = await Mutuario.findByPk(mutuarioId);

    if (!mutuario) {
      return res.status(404).json({
        message: "Mutuário não encontrado.",
      });
    }

    const pedidos = await PedidoCredito.findAll({
      where: { mutuarioId },
      include: [
        {
          model: User,
          as: "criador",
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json(pedidos);
  } catch (error) {
    console.error("Erro ao listar pedidos do mutuário:", error);

    return res.status(500).json({
      message: "Erro interno ao listar pedidos do mutuário.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  ATUALIZAR PEDIDO DE CRÉDITO
  ==========================================================
*/
async function updatePedidoCredito(req, res) {
  try {
    const { id } = req.params;

    const pedido = await PedidoCredito.findByPk(id);

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido de crédito não encontrado.",
      });
    }

    /*
      Regra forte:
      só pode editar se o perfil permitir
      e se o status atual do pedido permitir
    */
    if (!podeEditarPedido(req.user, pedido)) {
      return res.status(403).json({
        message: `Não tens permissão para editar este pedido ou o status ${pedido.status} não permite edição.`,
      });
    }

    const {
      valorSolicitado,
      finalidade,
      pacoteFinanciamento,
      prazoAvaliacao,
      prazoValidacao,
      observacoes,
      etapaAtual,
    } = req.body;

    if (valorSolicitado !== undefined && Number(valorSolicitado) <= 0) {
      return res.status(400).json({
        message: "valorSolicitado deve ser maior que zero.",
      });
    }

    await pedido.update({
      valorSolicitado:
        valorSolicitado !== undefined ? valorSolicitado : pedido.valorSolicitado,
      finalidade: finalidade !== undefined ? finalidade : pedido.finalidade,
      pacoteFinanciamento:
        pacoteFinanciamento !== undefined
          ? pacoteFinanciamento
          : pedido.pacoteFinanciamento,
      prazoAvaliacao:
        prazoAvaliacao !== undefined ? prazoAvaliacao : pedido.prazoAvaliacao,
      prazoValidacao:
        prazoValidacao !== undefined ? prazoValidacao : pedido.prazoValidacao,
      observacoes: observacoes !== undefined ? observacoes : pedido.observacoes,

      /*
        Mantemos etapaAtual editável só por enquanto,
        mas idealmente isso devia ser controlado apenas pelo fluxo de aprovação.
      */
      etapaAtual: etapaAtual !== undefined ? etapaAtual : pedido.etapaAtual,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ATUALIZAR_PEDIDO_CREDITO",
      entidade: "PedidoCredito",
      entidadeId: pedido.id,
      descricao: `Pedido ${pedido.numeroPedido} atualizado para o mutuário ID ${pedido.mutuarioId}.`,
    });

    return res.status(200).json({
      message: "Pedido de crédito atualizado com sucesso.",
      pedido,
    });
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);

    return res.status(500).json({
      message: "Erro interno ao atualizar pedido.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  ATUALIZAR STATUS DO PEDIDO
  ==========================================================
  Regra forte:
  - mudança manual de status é sensível
  - só ADMIN e GESTOR devem fazer isso
  - a transição deve ser válida
*/
async function updateStatusPedidoCredito(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = [
      STATUS_PEDIDO.RASCUNHO,
      STATUS_PEDIDO.SUBMETIDO,
      STATUS_PEDIDO.EM_ANALISE,
      STATUS_PEDIDO.EM_VALIDACAO,
      STATUS_PEDIDO.APROVADO,
      STATUS_PEDIDO.REJEITADO,
      STATUS_PEDIDO.DESEMBOLSADO,
      STATUS_PEDIDO.ENCERRADO,
    ];

    if (!status) {
      return res.status(400).json({
        message: "O campo status é obrigatório.",
      });
    }

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Status inválido.",
        allowedStatus,
      });
    }

    if (!["ADMIN", "GESTOR"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Não tens permissão para alterar manualmente o status do pedido.",
      });
    }

    const pedido = await PedidoCredito.findByPk(id);

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido de crédito não encontrado.",
      });
    }

    if (!podeTransitarStatus(pedido.status, status)) {
      return res.status(400).json({
        message: `Transição inválida de status: ${pedido.status} -> ${status}.`,
      });
    }

    await pedido.update({ status });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ATUALIZAR_STATUS_PEDIDO_CREDITO",
      entidade: "PedidoCredito",
      entidadeId: pedido.id,
      descricao: `Status do pedido ${pedido.numeroPedido} alterado de ${pedido.status} para ${status}.`,
    });

    return res.status(200).json({
      message: "Status do pedido atualizado com sucesso.",
      pedido,
    });
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);

    return res.status(500).json({
      message: "Erro interno ao atualizar status do pedido.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  REMOVER PEDIDO DE CRÉDITO
  ==========================================================
  Regra:
  - só ADMIN ou GESTOR
  - idealmente apenas em estados iniciais
*/
async function deletePedidoCredito(req, res) {
  try {
    const { id } = req.params;

    if (!["ADMIN", "GESTOR"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Não tens permissão para remover pedido de crédito.",
      });
    }

    const pedido = await PedidoCredito.findByPk(id);

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido de crédito não encontrado.",
      });
    }

    if (![STATUS_PEDIDO.RASCUNHO, STATUS_PEDIDO.SUBMETIDO].includes(pedido.status)) {
      return res.status(400).json({
        message: `Só é permitido remover pedidos em status ${STATUS_PEDIDO.RASCUNHO} ou ${STATUS_PEDIDO.SUBMETIDO}.`,
      });
    }

    await pedido.destroy();

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "REMOVER_PEDIDO_CREDITO",
      entidade: "PedidoCredito",
      entidadeId: pedido.id,
      descricao: `Pedido ${pedido.numeroPedido} removido para o mutuário ID ${pedido.mutuarioId}.`,
    });

    return res.status(200).json({
      message: "Pedido de crédito removido com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao remover pedido:", error);

    return res.status(500).json({
      message: "Erro interno ao remover pedido.",
      error: error.message,
    });
  }
}

module.exports = {
  createPedidoCredito,
  getAllPedidosCredito,
  getPedidoCreditoById,
  getPedidosByMutuario,
  updatePedidoCredito,
  updateStatusPedidoCredito,
  deletePedidoCredito,
};