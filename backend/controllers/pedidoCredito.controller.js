const { PedidoCredito, Mutuario, User, AprovacaoPedido, Desembolso, Reembolso, Notificacao, sequelize } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const { Op } = require("sequelize");
const { podeCriarPedido, podeEditarPedido, podeTransitarStatus, STATUS_PEDIDO } = require("../utils/regrasPedido");
const calcularPrestacao = require("../utils/calCredito");

// =========================================================================
// HELPERS / UTILS
// =========================================================================
function generateNumeroPedido() {
  const now = new Date();
  const format = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `PED-${format}-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * OPTIMIZAÇÃO DE PERFORMANCE: Criação em lote (Bulk Insert)
 * Executa apenas 1 query na BD em vez de fazer um loop bloqueante.
 */
async function criarAlertasPedidoCriado(pedido, transaction) {
  try {
    const usuariosInternos = await User.findAll({
      where: { ativo: true, role: { [Op.in]: ["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"] } },
      attributes: ['id'],
      transaction
    });

    if (!usuariosInternos.length) return;

    const notificacoes = usuariosInternos.map(usuario => ({
      userId: usuario.id,
      pedidoId: pedido.id,
      titulo: "Novo Pedido de Crédito Criado",
      mensagem: `Novo pedido de crédito ${pedido.numeroPedido} foi criado. Prazo de avaliação: 7 dias.`,
      tipo: "PEDIDO_CRIADO",
      lida: false,
    }));

    // Inserção em massa numa única viagem à BD
    await Notificacao.bulkCreate(notificacoes, { transaction });
  } catch (error) {
    console.error("[Alertas Error]: Falha ao gerar notificações em lote:", error);
  }
}

// =========================================================================
// CONTROLLERS
// =========================================================================

/**
 * CRIAR PEDIDO DE CRÉDITO
 */
async function createPedidoCredito(req, res) {
  try {
    const { mutuarioId, valorSolicitado, prazo, finalidade, pacoteFinanciamento, observacoes } = req.body;

    if (!podeCriarPedido(req.user)) {
      return res.status(403).json({ message: "Não tens permissão para criar pedido de crédito." });
    }

    // Guard Clause única unificada
    if (!mutuarioId || !valorSolicitado || !prazo || !finalidade) {
      return res.status(400).json({ message: "mutuarioId, valorSolicitado, prazo e finalidade são obrigatórios." });
    }

    const vSoli = Number(valorSolicitado);
    const pMeses = Number(prazo);

    if (vSoli <= 0 || pMeses <= 0) {
      return res.status(400).json({ message: "Valor solicitado e prazo devem ser maiores que zero." });
    }

    const mutuario = await Mutuario.findByPk(mutuarioId, { attributes: ['id'] });
    if (!mutuario) {
      return res.status(404).json({ message: "Mutuário não encontrado." });
    }

    // Cálculos Financeiros Lógicos
    const dataSubmissao = new Date();
    const prazoAvaliacao = new Date(dataSubmissao.getTime() + 7 * 24 * 60 * 60 * 1000);
    const taxa = 18;
    const prestacao = calcularPrestacao(vSoli, taxa, pMeses);
    const montanteTotal = prestacao * pMeses;

    // Execução Atómica controlada por Transação
    const pedido = await sequelize.transaction(async (t) => {
      const novoPedido = await PedidoCredito.create({
        numeroPedido: generateNumeroPedido(),
        mutuarioId,
        valorSolicitado: vSoli,
        finalidade,
        pacoteFinanciamento: pacoteFinanciamento || null,
        status: STATUS_PEDIDO.SUBMETIDO,
        etapaAtual: 1,
        dataSubmissao,
        prazoAvaliacao,
        prazoValidacao: prazoAvaliacao,
        prazo: pMeses,
        taxa,
        prestacao,
        jurosTotal: montanteTotal - vSoli,
        montanteTotal,
        observacoes: observacoes || null,
        createdBy: req.user.id,
      }, { transaction: t });

      await registrarLogAuditoria({
        userId: req.user.id,
        acao: "CRIAR_PEDIDO_CREDITO",
        entidade: "PedidoCredito",
        entidadeId: novoPedido.id,
        descricao: `Pedido ${novoPedido.numeroPedido} criado para o mutuário ID ${novoPedido.mutuarioId}.`,
      }, { transaction: t });

      await criarAlertasPedidoCriado(novoPedido, t);
      return novoPedido;
    });

    return res.status(201).json({ message: "Pedido de crédito criado com sucesso.", pedido });
  } catch (error) {
    console.error("[CreatePedido Error]:", error);
    return res.status(500).json({ message: "Erro interno ao criar pedido de crédito." });
  }
}

/**
 * LISTAR TODOS OS PEDIDOS
 */
async function getAllPedidosCredito(req, res) {
  try {
    const pedidos = await PedidoCredito.findAll({
      include: [
        { model: Mutuario, as: "mutuario" },
        { model: User, as: "criador", attributes: ["id", "nome", "email", "role"] },
      ],
      order: [["id", "DESC"]],
    });
    return res.status(200).json(pedidos);
  } catch (error) {
    console.error("[GetAllPedidos Error]:", error);
    return res.status(500).json({ message: "Erro interno ao listar pedidos." });
  }
}

/**
 * BUSCAR PEDIDO POR ID
 */
async function getPedidoCreditoById(req, res) {
  try {
    const pedido = await PedidoCredito.findByPk(req.params.id, {
      include: [
        { model: Mutuario, as: "mutuario" },
        { model: User, as: "criador", attributes: ["id", "nome", "email", "role"] },
        { model: AprovacaoPedido, as: "aprovacoes", required: false },
      ],
    });

    if (!pedido) return res.status(404).json({ message: "Pedido de crédito não encontrado." });
    return res.status(200).json(pedido);
  } catch (error) {
    console.error("[GetPedidoById Error]:", error);
    return res.status(500).json({ message: "Erro interno ao buscar pedido." });
  }
}

/**
 * LISTAR PEDIDOS DE UM MUTUÁRIO
 */
async function getPedidosByMutuario(req, res) {
  try {
    const { mutuarioId } = req.params;
    const mutuario = await Mutuario.findByPk(mutuarioId, { attributes: ['id'] });
    if (!mutuario) return res.status(404).json({ message: "Mutuário não encontrado." });

    const pedidos = await PedidoCredito.findAll({
      where: { mutuarioId },
      include: [{ model: User, as: "criador", attributes: ["id", "nome", "email", "role"] }],
      order: [["id", "DESC"]],
    });

    return res.status(200).json(pedidos);
  } catch (error) {
    console.error("[GetPedidosByMutuario Error]:", error);
    return res.status(500).json({ message: "Erro interno ao listar pedidos do mutuário." });
  }
}

/**
 * LISTAR PEDIDOS ELEGÍVEIS PARA DESEMBOLSO
 */
async function getPedidosElegiveisDesembolso(req, res) {
  try {
    const elegiveis = await PedidoCredito.findAll({
      where: { status: STATUS_PEDIDO.APROVADO },
      include: [
        { model: Mutuario, as: "mutuario", required: false },
        { model: Desembolso, as: "desembolsos", required: false }
      ],
      order: [["id", "DESC"]],
    });

    // Filtro JS limpo direto no retorno
    const result = elegiveis.filter(p => !p.desembolsos?.length);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[GetElegiveisDesembolso Error]:", error);
    return res.status(500).json({ message: "Erro interno ao listar pedidos elegíveis para desembolso." });
  }
}

/**
 * LISTAR PEDIDOS ELEGÍVEIS PARA REEMBOLSO
 */
async function getPedidosElegiveisReembolso(req, res) {
  try {
    const pedidos = await PedidoCredito.findAll({
      where: { status: STATUS_PEDIDO.DESEMBOLSADO },
      include: [
        { model: Mutuario, as: "mutuario", required: false },
        { model: Desembolso, as: "desembolsos", required: false },
        { model: Reembolso, as: "reembolsos", required: false },
      ],
      order: [["id", "DESC"]],
    });

    const elegiveis = pedidos.filter((pedido) => {
      const totalDesembolsado = (pedido.desembolsos || []).reduce((acc, item) => acc + Number(item.valorDesembolsado || 0), 0);
      const totalReembolsado = (pedido.reembolsos || []).reduce((acc, item) => acc + Number(item.valorReembolsado || 0), 0);
      return totalDesembolsado > 0 && totalReembolsado < totalDesembolsado;
    });

    return res.status(200).json(elegiveis);
  } catch (error) {
    console.error("[GetElegiveisReembolso Error]:", error);
    return res.status(500).json({ message: "Erro interno ao listar pedidos elegíveis para reembolso." });
  }
}

/**
 * ATUALIZAR PEDIDO DE CRÉDITO
 */
async function updatePedidoCredito(req, res) {
  try {
    const pedido = await PedidoCredito.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ message: "Pedido de crédito não encontrado." });

    if (!podeEditarPedido(req.user, pedido)) {
      return res.status(403).json({ message: `Sem permissão para editar ou o status ${pedido.status} bloqueia alterações.` });
    }

    const { valorSolicitado, finalidade, pacoteFinanciamento, observacoes, etapaAtual } = req.body;
    if (valorSolicitado !== undefined && Number(valorSolicitado) <= 0) {
      return res.status(400).json({ message: "valorSolicitado deve ser maior que zero." });
    }

    await pedido.update({
      valorSolicitado: valorSolicitado ?? pedido.valorSolicitado,
      finalidade: finalidade ?? pedido.finalidade,
      pacoteFinanciamento: pacoteFinanciamento ?? pedido.pacoteFinanciamento,
      observacoes: observacoes ?? pedido.observacoes,
      etapaAtual: etapaAtual ?? pedido.etapaAtual,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ATUALIZAR_PEDIDO_CREDITO",
      entidade: "PedidoCredito",
      entidadeId: pedido.id,
      descricao: `Pedido ${pedido.numeroPedido} atualizado.`,
    });

    return res.status(200).json({ message: "Pedido de crédito updated.", pedido });
  } catch (error) {
    console.error("[UpdatePedido Error]:", error);
    return res.status(500).json({ message: "Erro interno ao atualizar pedido." });
  }
}

/**
 * ATUALIZAR STATUS DO PEDIDO
 */
async function updateStatusPedidoCredito(req, res) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "O campo status é obrigatório." });

    if (!["ADMIN", "GESTOR"].includes(req.user.role)) {
      return res.status(403).json({ message: "Não tens permissão para alterar manualmente o status." });
    }

    const pedido = await PedidoCredito.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ message: "Pedido de crédito não encontrado." });

    if (!podeTransitarStatus(pedido.status, status)) {
      return res.status(400).json({ message: `Transição inválida: ${pedido.status} -> ${status}.` });
    }

    await pedido.update({ status });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ATUALIZAR_STATUS_PEDIDO_CREDITO",
      entidade: "PedidoCredito",
      entidadeId: pedido.id,
      descricao: `Status do pedido ${pedido.numeroPedido} alterado para ${status}.`,
    });

    return res.status(200).json({ message: "Status atualizado com sucesso.", pedido });
  } catch (error) {
    console.error("[UpdateStatus Error]:", error);
    return res.status(500).json({ message: "Erro interno ao atualizar status." });
  }
}

/**
 * REMOVER PEDIDO DE CRÉDITO
 */
async function deletePedidoCredito(req, res) {
  try {
    if (!["ADMIN", "GESTOR"].includes(req.user.role)) {
      return res.status(403).json({ message: "Não tens permissão para remover o pedido." });
    }

    const pedido = await PedidoCredito.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ message: "Pedido de crédito não encontrado." });

    if (![STATUS_PEDIDO.RASCUNHO, STATUS_PEDIDO.SUBMETIDO].includes(pedido.status)) {
      return res.status(400).json({ message: `Apenas permitido remover em estado RASCUNHO ou SUBMETIDO.` });
    }

    await pedido.destroy();

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "REMOVER_PEDIDO_CREDITO",
      entidade: "PedidoCredito",
      entidadeId: pedido.id,
      descricao: `Pedido ${pedido.numeroPedido} deletado por ID ${req.user.id}.`,
    });

    return res.status(200).json({ message: "Pedido de crédito removido com sucesso." });
  } catch (error) {
    console.error("[DeletePedido Error]:", error);
    return res.status(500).json({ message: "Erro interno ao remover pedido." });
  }
}

module.exports = {
  createPedidoCredito,
  getAllPedidosCredito,
  getPedidosElegiveisDesembolso,
  getPedidosElegiveisReembolso,
  getPedidoCreditoById,
  getPedidosByMutuario,
  updatePedidoCredito,
  updateStatusPedidoCredito,
  deletePedidoCredito,
};