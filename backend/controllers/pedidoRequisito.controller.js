const {
  PedidoCredito,
  RequisitoCredito,
  PedidoRequisito,
  Notificacao,
} = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const {
  podeValidarRequisito,
  statusPermiteAcao,
  userTemPermissaoParaAcao,
} = require("../utils/regrasPedido");

/*
  ==========================================================
  ADICIONAR REQUISITO AO PEDIDO
  ==========================================================
  Regra:
  - apenas ADMIN e GESTOR devem conseguir associar requisitos
  - pedido deve existir
  - não pode duplicar o mesmo requisito no mesmo pedido
*/
async function adicionarPedidoRequisito(req, res) {
  try {
    const { pedidoId } = req.params;
    const { requisitoId, observacoes } = req.body;

    if (!requisitoId) {
      return res.status(400).json({
        message: 'O campo "requisitoId" é obrigatório.',
      });
    }

    /*
      Regra de perfil:
      associar requisito ao pedido é uma ação de análise, tal como validar
      requisito, mesma matriz de perfis (ADMIN/GESTOR/ANALISTA), já usada
      pela rota (authorizeRoles) e por validarRequisitoPedido. Antes disto
      o check estava mais restrito ("ADMIN","GESTOR"), o que bloqueava
      ANALISTA mesmo a rota permitindo, inconsistência corrigida aqui.
    */
    if (!userTemPermissaoParaAcao(req.user, "VALIDAR_REQUISITO")) {
      return res.status(403).json({
        message: "Não tens permissão para adicionar requisitos ao pedido.",
      });
    }

    const pedido = await PedidoCredito.findOne({ where: { id: pedidoId, empresaId: req.user.empresaId } });

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido de crédito não encontrado.",
      });
    }

    /*
      Regra de status:
      só faz sentido associar requisitos enquanto o pedido
      ainda está em fluxo de análise/validação
    */
    if (!statusPermiteAcao(pedido, "VALIDAR_REQUISITO")) {
      return res.status(400).json({
        message:
          `Não é permitido adicionar requisitos para pedidos com status ${pedido.status}.`,
      });
    }

    const requisito = await RequisitoCredito.findOne({ where: { id: requisitoId, empresaId: req.user.empresaId } });

    if (!requisito) {
      return res.status(404).json({
        message: "Requisito de crédito não encontrado.",
      });
    }

    if (requisito.ativo === false) {
      return res.status(400).json({
        message: "Este requisito está inativo e não pode ser associado ao pedido.",
      });
    }

    const existente = await PedidoRequisito.findOne({
      where: { pedidoId, requisitoId },
    });

    if (existente) {
      return res.status(409).json({
        message: "Este requisito já foi adicionado a este pedido.",
      });
    }

    const item = await PedidoRequisito.create({
      pedidoId,
      requisitoId,
      estado: "PENDENTE",
      observacoes: observacoes || null,
    });

    await Notificacao.create({
      userId: pedido.createdBy,
      pedidoId: pedido.id,
      titulo: "Novo requisito solicitado",
      mensagem: `Foi solicitado o requisito "${requisito.nome}". Faça o envio do documento pelo portal.`,
      tipo: "REQUISITO",
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ADICIONAR_REQUISITO_AO_PEDIDO",
      entidade: "PedidoRequisito",
      entidadeId: item.id,
      descricao: `Requisito ID ${requisitoId} adicionado ao pedido ID ${pedidoId}.`,
    });

    return res.status(201).json({
      message: "Requisito adicionado ao pedido com sucesso.",
      item,
    });
  } catch (error) {
    console.error("Erro ao adicionar requisito ao pedido:", error);

    return res.status(500).json({
      message: "Ocorreu um erro ao adicionar o requisito ao pedido.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR REQUISITOS DE UM PEDIDO
  ==========================================================
  Regra:
  - devolve os itens PedidoRequisito já associados ao pedido
  - inclui os dados do requisito
*/
async function getRequisitosByPedido(req, res) {
  try {
    const { pedidoId } = req.params;

    const pedido = await PedidoCredito.findOne({ where: { id: pedidoId, empresaId: req.user.empresaId } });

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido de crédito não encontrado.",
      });
    }

    const requisitosPedido = await PedidoRequisito.findAll({
      where: { pedidoId },
      include: [
        {
          model: RequisitoCredito,
          as: "requisito",
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json({
      pedidoId: Number(pedidoId),
      total: requisitosPedido.length,
      requisitos: requisitosPedido,
    });
  } catch (error) {
    console.error("Erro ao listar requisitos do pedido:", error);

    return res.status(500).json({
      message: "Ocorreu um erro ao listar os requisitos do pedido.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  VALIDAR REQUISITO DO PEDIDO
  ==========================================================
  Regra:
  - só perfis autorizados podem validar
  - pedido deve estar em status permitido
  - estados padronizados em maiúsculas
*/
async function validarRequisitoPedido(req, res) {
  try {
    const { id } = req.params;
    const { estado, observacoes } = req.body;

    const estadosPermitidos = ["PENDENTE", "APROVADO", "REJEITADO"];

    const estadoNormalizado = String(estado || "").trim().toUpperCase();

    if (!estadoNormalizado || !estadosPermitidos.includes(estadoNormalizado)) {
      return res.status(400).json({
        message: "Estado inválido.",
        estadosPermitidos,
      });
    }

    const item = await PedidoRequisito.findByPk(id, {
      include: [
        {
          model: PedidoCredito,
          as: "pedido",
          where: { empresaId: req.user.empresaId },
          required: true,
        },
        {
          model: RequisitoCredito,
          as: "requisito",
        },
      ],
    });

    if (!item) {
      return res.status(404).json({
        message: "Requisito do pedido não encontrado.",
      });
    }

    /*
      Regra forte:
      perfil + status do pedido
    */
    if (!podeValidarRequisito(req.user, item.pedido)) {
      return res.status(403).json({
        message:
          "Não tens permissão para validar este requisito ou o status atual do pedido não permite.",
      });
    }

    await item.update({
      estado: estadoNormalizado,
      observacoes: observacoes !== undefined ? observacoes : item.observacoes,
      validadoPor: req.user.id,
      dataValidacao: new Date(),
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "VALIDAR_REQUISITO_DO_PEDIDO",
      entidade: "PedidoRequisito",
      entidadeId: item.id,
      descricao: `Requisito do pedido ID ${item.id} atualizado para estado ${estadoNormalizado}.`,
    });

    return res.status(200).json({
      message: "Requisito do pedido validado com sucesso.",
      item,
    });
  } catch (error) {
    console.error("Erro ao validar requisito do pedido:", error);

    return res.status(500).json({
      message: "Ocorreu um erro ao validar o requisito do pedido.",
      error: error.message,
    });
  }
}

module.exports = {
  adicionarPedidoRequisito,
  getRequisitosByPedido,
  validarRequisitoPedido,
};