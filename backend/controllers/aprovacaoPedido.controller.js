const {
  AprovacaoPedido,
  PedidoCredito,
  User,
  Mutuario,
  Notificacao,
  PedidoRequisito,
  RequisitoCredito,
} = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const {
  podeAprovarPedido,
  podeRejeitarPedido,
  podeTransitarStatus,
  STATUS_PEDIDO,
} = require("../utils/regrasPedido");

/*
  ==========================================================
  FUNÇÃO AUXILIAR PARA CRIAR NOTIFICAÇÃO SEM DUPLICAR
  ==========================================================
  Regra forte:
  - verifica por userId + pedidoId + titulo + tipo + lida=false
*/
async function criarNotificacao({
  userId,
  pedidoId = null,
  titulo,
  mensagem,
  tipo = "SISTEMA",
}) {
  if (!userId) return null;

  const notificacaoExistente = await Notificacao.findOne({
    where: {
      userId,
      pedidoId,
      titulo,
      tipo,
      lida: false,
    },
  });

  if (notificacaoExistente) {
    return null;
  }

  const notificacao = await Notificacao.create({
    userId,
    pedidoId,
    titulo,
    mensagem,
    tipo,
  });

  return notificacao;
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
  VERIFICAR SE O PEDIDO TEM REQUISITOS OBRIGATÓRIOS PENDENTES
  ==========================================================
*/
async function verificarRequisitosObrigatoriosPendentes(pedidoId) {
  const requisitosPendentes = await PedidoRequisito.findAll({
    where: {
      pedidoId,
    },
    include: [
      {
        model: RequisitoCredito,
        as: "requisito",
        where: {
          obrigatorio: true,
          ativo: true,
        },
      },
    ],
  });

  return requisitosPendentes.filter((item) =>
    ["PENDENTE", "REJEITADO"].includes(item.estado)
  );
}

/*
  ==========================================================
  DECIDIR PRÓXIMO STATUS E ETAPA DO PEDIDO
  ==========================================================
*/
function calcularProximoFluxoAprovacao(pedido) {
  let novoStatus = pedido.status;
  let novaEtapa = pedido.etapaAtual;

  /*
    Etapa 1:
    SUBMETIDO -> EM_ANALISE / etapa 2
  */
  if (Number(pedido.etapaAtual) === 1) {
    novoStatus = STATUS_PEDIDO.EM_ANALISE;
    novaEtapa = 2;
  }

  /*
    Etapa 2:
    EM_ANALISE -> EM_VALIDACAO / etapa 3
  */
  else if (Number(pedido.etapaAtual) === 2) {
    novoStatus = STATUS_PEDIDO.EM_VALIDACAO;
    novaEtapa = 3;
  }

  /*
    Etapa 3:
    EM_VALIDACAO -> APROVADO
  */
  else if (Number(pedido.etapaAtual) === 3) {
    novoStatus = STATUS_PEDIDO.APROVADO;
    novaEtapa = 3;
  }

  return {
    novoStatus,
    novaEtapa,
  };
}

/*
  ==========================================================
  REGISTAR DECISÃO DE APROVAÇÃO COM REGRAS FORTES
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

    /*
      Só permite decisão na etapa correspondente
    */
    if (Number(nivel) !== Number(pedido.etapaAtual)) {
      return res.status(400).json({
        message: `Este pedido está na etapa ${pedido.etapaAtual}. Só é possível decidir no nível correspondente.`,
      });
    }

    /*
      Bloqueia decisão em estados finais
    */
    if (
      [
        STATUS_PEDIDO.APROVADO,
        STATUS_PEDIDO.REJEITADO,
        STATUS_PEDIDO.DESEMBOLSADO,
        STATUS_PEDIDO.ENCERRADO,
      ].includes(pedido.status)
    ) {
      return res.status(400).json({
        message: `Não é possível aprovar/rejeitar um pedido com status ${pedido.status}.`,
      });
    }

    /*
      Regras por perfil e etapa
    */
    if (decisao === "APROVADO" && !podeAprovarPedido(req.user, pedido)) {
      return res.status(403).json({
        message: "Não tens permissão para aprovar este pedido nesta etapa.",
      });
    }

    if (decisao === "REJEITADO" && !podeRejeitarPedido(req.user, pedido)) {
      return res.status(403).json({
        message: "Não tens permissão para rejeitar este pedido nesta etapa.",
      });
    }

    /*
      Verifica requisitos obrigatórios só quando a decisão for APROVADO
    */
    if (decisao === "APROVADO") {
      const requisitosBloqueantes =
        await verificarRequisitosObrigatoriosPendentes(pedidoId);

      if (requisitosBloqueantes.length > 0) {
        return res.status(400).json({
          message:
            "Não é possível aprovar o pedido. Existem requisitos obrigatórios pendentes ou rejeitados.",
          requisitosBloqueantes: requisitosBloqueantes.map((item) => ({
            id: item.id,
            requisitoId: item.requisitoId,
            nome: item.requisito ? item.requisito.nome : null,
            estado: item.estado,
            observacoes: item.observacoes,
          })),
        });
      }
    }

    /*
      Verifica se já existe decisão para este pedido neste nível
    */
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

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "DECIDIR_APROVACAO_PEDIDO",
      entidade: "AprovacaoPedido",
      entidadeId: aprovacao.id,
      descricao: `Pedido ${pedido.numeroPedido} recebeu decisão ${decisao} no nível ${nivel}.`,
    });

    /*
      Fluxo de rejeição
    */
    if (decisao === "REJEITADO") {
      if (!podeTransitarStatus(pedido.status, STATUS_PEDIDO.REJEITADO)) {
        return res.status(400).json({
          message: `Transição inválida de status: ${pedido.status} -> ${STATUS_PEDIDO.REJEITADO}.`,
        });
      }

      await pedido.update({
        status: STATUS_PEDIDO.REJEITADO,
      });

      await criarNotificacao({
        userId: pedido.createdBy,
        pedidoId: pedido.id,
        titulo: "Pedido rejeitado",
        mensagem: `O pedido ${pedido.numeroPedido} foi rejeitado no nível ${nivel}.`,
        tipo: "REJEICAO",
      });

      await registrarLogAuditoria({
        userId: req.user.id,
        acao: "REJEITAR_PEDIDO_CREDITO",
        entidade: "PedidoCredito",
        entidadeId: pedido.id,
        descricao: `Pedido ${pedido.numeroPedido} rejeitado no nível ${nivel}.`,
      });

      const pedidoAtualizado = await PedidoCredito.findByPk(pedido.id, {
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

      return res.status(200).json({
        message: "Pedido rejeitado com sucesso.",
        aprovacao,
        pedido: pedidoAtualizado,
      });
    }

    /*
      Fluxo de aprovação
    */
    const { novoStatus, novaEtapa } = calcularProximoFluxoAprovacao(pedido);

    if (
      novoStatus !== pedido.status &&
      !podeTransitarStatus(pedido.status, novoStatus)
    ) {
      return res.status(400).json({
        message: `Transição inválida de status: ${pedido.status} -> ${novoStatus}.`,
      });
    }

    await pedido.update({
      status: novoStatus,
      etapaAtual: novaEtapa,
    });

    if (Number(nivel) === 1) {
      await criarNotificacao({
        userId: pedido.createdBy,
        pedidoId: pedido.id,
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
      await criarNotificacao({
        userId: pedido.createdBy,
        pedidoId: pedido.id,
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
      await criarNotificacao({
        userId: pedido.createdBy,
        pedidoId: pedido.id,
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

    const pedidoAtualizado = await PedidoCredito.findByPk(pedido.id, {
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

    return res.status(200).json({
      message: "Decisão registada com sucesso.",
      aprovacao,
      pedido: pedidoAtualizado,
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