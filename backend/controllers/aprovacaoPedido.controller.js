const {
  AprovacaoPedido,
  PedidoCredito,
  User,
  Mutuario,
  Notificacao,
} = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");

/*
  ==========================================================
  FUNÇÃO AUXILIAR PARA CRIAR NOTIFICAÇÃO
  ==========================================================
*/
async function criarNotificacao({ userId, titulo, mensagem, tipo = "SISTEMA" }) {
  if (!userId) return;

  await Notificacao.create({
    userId,
    titulo,
    mensagem,
    tipo,
  });
}

/*
  ==========================================================
  LISTAR APROVAÇÕES DE UM PEDIDO
  ==========================================================
*/
async function getAprovacoesByPedido(req, res) {
  try {
    const { pedidoId } = req.params;

    const pedido = await PedidoCredito.findByPk(pedidoId, {
      include: [
        {
          model: Mutuario,
          as: "mutuario",
        },
      ],
    });

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido de crédito não encontrado.",
      });
    }

    const aprovacoes = await AprovacaoPedido.findAll({
      where: { pedidoId },
      include: [
        {
          model: User,
          as: "aprovador",
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
      ],
      order: [["nivel", "ASC"]],
    });

    return res.status(200).json({
      pedido,
      aprovacoes,
    });
  } catch (error) {
    console.error("Erro ao listar aprovações do pedido:", error);

    return res.status(500).json({
      message: "Erro interno ao listar aprovações do pedido.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  REGISTAR DECISÃO DE APROVAÇÃO COM NOTIFICAÇÕES E LOGS
  ==========================================================
*/
async function decidirAprovacao(req, res) {
  try {
    const { pedidoId } = req.params;
    const { nivel, decisao, comentario } = req.body;

    if (!nivel || !decisao) {
      return res.status(400).json({
        message: "Os campos nivel e decisao são obrigatórios.",
      });
    }

    const decisoesPermitidas = ["APROVADO", "REJEITADO"];

    if (!decisoesPermitidas.includes(decisao)) {
      return res.status(400).json({
        message: "Decisão inválida.",
        decisoesPermitidas,
      });
    }

    const pedido = await PedidoCredito.findByPk(pedidoId, {
      include: [
        {
          model: Mutuario,
          as: "mutuario",
          required: false,
        },
        {
          model: User,
          as: "criador",
          attributes: ["id", "nome", "email", "role", "ativo"],
          required: false,
        },
      ],
    });

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido de crédito não encontrado.",
      });
    }

    if (["APROVADO", "REJEITADO", "DESEMBOLSADO", "ENCERRADO"].includes(pedido.status)) {
      return res.status(400).json({
        message: `Não é possível aprovar/rejeitar um pedido com status ${pedido.status}.`,
      });
    }

    if (Number(nivel) !== Number(pedido.etapaAtual)) {
      return res.status(400).json({
        message: `Este pedido está na etapa ${pedido.etapaAtual}. Só é possível decidir no nível correspondente.`,
      });
    }

    const aprovacaoExistente = await AprovacaoPedido.findOne({
      where: {
        pedidoId,
        nivel,
      },
    });

    if (aprovacaoExistente && aprovacaoExistente.decisao !== "PENDENTE") {
      return res.status(409).json({
        message: `Já existe uma decisão registada para o nível ${nivel}.`,
      });
    }

    let aprovacao;

    if (aprovacaoExistente) {
      await aprovacaoExistente.update({
        aprovadorId: req.user.id,
        decisao,
        comentario: comentario || null,
        dataDecisao: new Date(),
      });

      aprovacao = aprovacaoExistente;
    } else {
      aprovacao = await AprovacaoPedido.create({
        pedidoId,
        nivel,
        aprovadorId: req.user.id,
        decisao,
        comentario: comentario || null,
        dataDecisao: new Date(),
      });
    }

    // Log da decisão tomada
    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "DECIDIR_APROVACAO_PEDIDO",
      entidade: "AprovacaoPedido",
      entidadeId: aprovacao.id,
      descricao: `Pedido ${pedido.numeroPedido} recebeu decisão ${decisao} no nível ${nivel}.`,
    });

    if (decisao === "REJEITADO") {
      await pedido.update({
        status: "REJEITADO",
      });

      await criarNotificacao({
        userId: pedido.createdBy,
        titulo: "Pedido rejeitado",
        mensagem: `O pedido ${pedido.numeroPedido} foi rejeitado no nível ${nivel}.`,
        tipo: "REJEICAO",
      });

      // Log específico de rejeição
      await registrarLogAuditoria({
        userId: req.user.id,
        acao: "REJEITAR_PEDIDO_CREDITO",
        entidade: "PedidoCredito",
        entidadeId: pedido.id,
        descricao: `Pedido ${pedido.numeroPedido} rejeitado no nível ${nivel}.`,
      });

      return res.status(200).json({
        message: "Pedido rejeitado com sucesso.",
        aprovacao,
        pedido,
      });
    }

    if (Number(nivel) === 1) {
      await pedido.update({
        status: "EM_VALIDACAO",
        etapaAtual: 2,
      });

      await criarNotificacao({
        userId: pedido.createdBy,
        titulo: "Pedido aprovado no nível 1",
        mensagem: `O pedido ${pedido.numeroPedido} foi aprovado no nível 1 e segue para o nível 2.`,
        tipo: "APROVACAO",
      });

      await registrarLogAuditoria({
        userId: req.user.id,
        acao: "APROVAR_PEDIDO_NIVEL_1",
        entidade: "PedidoCredito",
        entidadeId: pedido.id,
        descricao: `Pedido ${pedido.numeroPedido} aprovado no nível 1.`,
      });
    } else if (Number(nivel) === 2) {
      await pedido.update({
        status: "EM_VALIDACAO",
        etapaAtual: 3,
      });

      await criarNotificacao({
        userId: pedido.createdBy,
        titulo: "Pedido aprovado no nível 2",
        mensagem: `O pedido ${pedido.numeroPedido} foi aprovado no nível 2 e segue para o nível 3.`,
        tipo: "APROVACAO",
      });

      await registrarLogAuditoria({
        userId: req.user.id,
        acao: "APROVAR_PEDIDO_NIVEL_2",
        entidade: "PedidoCredito",
        entidadeId: pedido.id,
        descricao: `Pedido ${pedido.numeroPedido} aprovado no nível 2.`,
      });
    } else if (Number(nivel) === 3) {
      await pedido.update({
        status: "APROVADO",
      });

      await criarNotificacao({
        userId: pedido.createdBy,
        titulo: "Pedido aprovado",
        mensagem: `O pedido ${pedido.numeroPedido} foi aprovado em definitivo.`,
        tipo: "APROVACAO",
      });

      await registrarLogAuditoria({
        userId: req.user.id,
        acao: "APROVAR_PEDIDO_FINAL",
        entidade: "PedidoCredito",
        entidadeId: pedido.id,
        descricao: `Pedido ${pedido.numeroPedido} aprovado em definitivo no nível 3.`,
      });
    }

    return res.status(200).json({
      message: "Decisão registada com sucesso.",
      aprovacao,
      pedido,
    });
  } catch (error) {
    console.error("Erro ao decidir aprovação:", error);

    return res.status(500).json({
      message: "Erro interno ao registar decisão de aprovação.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR APROVAÇÕES FEITAS PELO UTILIZADOR AUTENTICADO
  ==========================================================
*/
async function getMinhasAprovacoes(req, res) {
  try {
    const aprovacoes = await AprovacaoPedido.findAll({
      where: {
        aprovadorId: req.user.id,
      },
      include: [
        {
          model: PedidoCredito,
          as: "pedido",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(aprovacoes);
  } catch (error) {
    console.error("Erro ao listar minhas aprovações:", error);

    return res.status(500).json({
      message: "Erro interno ao listar minhas aprovações.",
      error: error.message,
    });
  }
}

module.exports = {
  getAprovacoesByPedido,
  decidirAprovacao,
  getMinhasAprovacoes,
};