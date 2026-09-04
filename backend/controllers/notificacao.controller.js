const { Notificacao, User } = require("../models");

/*
  ==========================================================
  CRIAR NOTIFICAÇÃO
  ==========================================================
  Esta função cria uma nova notificação para um utilizador.

  Pode ser usada depois por:
  - aprovação de pedido
  - rejeição de pedido
  - alertas de prazo
  - notificações gerais do sistema
*/
async function createNotificacao(req, res) {
  try {
    const { userId, pedidoId, titulo, mensagem, tipo } = req.body;

    if (!userId || !titulo || !mensagem) {
      return res.status(400).json({
        message: "userId, titulo e mensagem são obrigatórios.",
      });
    }

    const tiposPermitidos = ["ALERTA_PRAZO", "ALERTA_PAGAMENTO", "APROVACAO", "REJEICAO", "SISTEMA", "REQUISITO", "PEDIDO_CRIADO"];

    if (tipo && !tiposPermitidos.includes(tipo)) {
      return res.status(400).json({
        message: "Tipo de notificação inválido.",
        tiposPermitidos,
      });
    }

    // Impede notificar utilizadores de outra empresa
    const destinatario = await User.findOne({ where: { id: userId, empresaId: req.user.empresaId }, attributes: ['id'] });
    if (!destinatario) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    const notificacaoExistente = await Notificacao.findOne({
      where: {
        userId,
        pedidoId: pedidoId || null,
        titulo,
        tipo: tipo || "SISTEMA",
        lida: false,
      },
    });

    if (notificacaoExistente) {
      return res.status(200).json({
        message: "Já existe uma notificação igual pendente para este contexto.",
        notificacao: notificacaoExistente,
      });
    }

    const notificacao = await Notificacao.create({
      userId,
      pedidoId: pedidoId || null,
      titulo,
      mensagem,
      tipo: tipo || "SISTEMA",
    });

    return res.status(201).json({
      message: "Notificação criada com sucesso.",
      notificacao,
    });
  } catch (error) {
    console.error("Erro ao criar notificação:", error);

    return res.status(500).json({
      message: "Erro interno ao criar notificação.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR NOTIFICAÇÕES DO UTILIZADOR AUTENTICADO
  ==========================================================
*/
async function getMinhasNotificacoes(req, res) {
  try {
    const notificacoes = await Notificacao.findAll({
      where: {
        userId: req.user.id,
      },
      order: [["created_at", "DESC"]],
      // Esta lista já é por utilizador (não por empresa), por isso o
      // risco de crescimento descontrolado é bem menor que os outros,
      // mesmo assim, trava de segurança para não devolver um histórico
      // ilimitado a um utilizador muito antigo.
      limit: 200,
    });

    return res.status(200).json(notificacoes);
  } catch (error) {
    console.error("Erro ao listar notificações:", error);

    return res.status(500).json({
      message: "Erro interno ao listar notificações.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  BUSCAR NOTIFICAÇÃO POR ID
  ==========================================================
  Só devolve se a notificação pertencer ao utilizador logado.
*/
async function getNotificacaoById(req, res) {
  try {
    const { id } = req.params;

    const notificacao = await Notificacao.findOne({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!notificacao) {
      return res.status(404).json({
        message: "Notificação não encontrada.",
      });
    }

    return res.status(200).json(notificacao);
  } catch (error) {
    console.error("Erro ao buscar notificação:", error);

    return res.status(500).json({
      message: "Erro interno ao buscar notificação.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  MARCAR NOTIFICAÇÃO COMO LIDA
  ==========================================================
*/
async function marcarComoLida(req, res) {
  try {
    const { id } = req.params;

    const notificacao = await Notificacao.findOne({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!notificacao) {
      return res.status(404).json({
        message: "Notificação não encontrada.",
      });
    }

    await notificacao.update({
      lida: true,
    });

    return res.status(200).json({
      message: "Notificação marcada como lida.",
      notificacao,
    });
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);

    return res.status(500).json({
      message: "Erro interno ao atualizar notificação.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  MARCAR TODAS AS NOTIFICAÇÕES COMO LIDAS
  ==========================================================
*/
async function marcarTodasComoLidas(req, res) {
  try {
    await Notificacao.update(
      { lida: true },
      {
        where: {
          userId: req.user.id,
          lida: false,
        },
      }
    );

    return res.status(200).json({
      message: "Todas as notificações foram marcadas como lidas.",
    });
  } catch (error) {
    console.error("Erro ao marcar todas notificações como lidas:", error);

    return res.status(500).json({
      message: "Erro interno ao atualizar notificações.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  APAGAR NOTIFICAÇÃO
  ==========================================================
*/
async function deleteNotificacao(req, res) {
  try {
    const { id } = req.params;

    const notificacao = await Notificacao.findOne({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!notificacao) {
      return res.status(404).json({
        message: "Notificação não encontrada.",
      });
    }

    await notificacao.destroy();

    return res.status(200).json({
      message: "Notificação removida com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao remover notificação:", error);

    return res.status(500).json({
      message: "Erro interno ao remover notificação.",
      error: error.message,
    });
  }
}

module.exports = {
  createNotificacao,
  getMinhasNotificacoes,
  getNotificacaoById,
  marcarComoLida,
  marcarTodasComoLidas,
  deleteNotificacao,
};