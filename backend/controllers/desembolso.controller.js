const { Desembolso, PedidoCredito, User, sequelize } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const { generateReferencia } = require("../utils/generateCode");
const creditoService = require("../services/credito.service");
const { asyncHandler } = require("../middleware/errorHandler.middleware");
const {
  podeDesembolsarPedido,
  podeTransitarStatus,
  STATUS_PEDIDO,
} = require("../utils/regrasPedido");

// =========================================================================
// CONTROLLERS
// =========================================================================

/**
 * CRIAR DESEMBOLSO (EXECUÇÃO ATÓMICA FINANCEIRA)
 */
const createDesembolso = asyncHandler(async (req, res) => {
  const {
    pedidoId,
    valorDesembolsado,
    dataDesembolso,
    meioPagamento,
    numeroTransacao,
    observacoes,
  } = req.body;

  if (!pedidoId || !valorDesembolsado) {
    return res.status(400).json({ message: "pedidoId e valorDesembolsado são obrigatórios." });
  }

  if (Number(valorDesembolsado) <= 0) {
    return res.status(400).json({ message: "Valor do desembolso deve ser maior que zero." });
  }

  const pedido = await PedidoCredito.findByPk(pedidoId);
  if (!pedido) {
    return res.status(404).json({ message: "Pedido de crédito não encontrado." });
  }

  // Validação estrita de permissões e estados do fluxo
  if (!podeDesembolsarPedido(req.user, pedido)) {
    return res.status(403).json({
      message: "Não tens permissão para desembolsar este pedido ou o status atual não permite.",
    });
  }

  if (!podeTransitarStatus(pedido.status, STATUS_PEDIDO.DESEMBOLSADO)) {
    return res.status(400).json({
      message: `Transição inválida de status: ${pedido.status} -> ${STATUS_PEDIDO.DESEMBOLSADO}.`,
    });
  }

  // Bloco Transacional: Garante consistência absoluta
  const desembolso = await sequelize.transaction(async (t) => {
    const referencia = await generateReferencia();

    const novoDesembolso = await Desembolso.create({
      pedidoId,
      valorDesembolsado,
      dataDesembolso: dataDesembolso ?? new Date(),
      meioPagamento: meioPagamento ?? "TRANSFERENCIA",
      numeroTransacao: numeroTransacao ?? null,
      referencia,
      observacoes: observacoes ?? null,
      createdBy: req.user.id,
    }, { transaction: t });

    // Propaga a transação para o serviço de crédito para execução segura
    await creditoService.criarCredito(
      pedido,
      novoDesembolso,
      req.user.id,
      { transaction: t }
    );

    // Atualiza o estado do pedido em memória RAM e na BD de forma atómica
    await pedido.update({ status: STATUS_PEDIDO.DESEMBOLSADO }, { transaction: t });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "CRIAR_DESEMBOLSO",
      entidade: "Desembolso",
      entidadeId: novoDesembolso.id,
      descricao: `Desembolso de ${valorDesembolsado} criado para pedido ${pedido.numeroPedido}.`,
    }, { transaction: t });

    return novoDesembolso;
  });

  return res.status(201).json({
    message: "Desembolso criado com sucesso.",
    desembolso,
    pedido, // O objeto pedido já foi atualizado em memória pelo método .update()
  });
});

/**
 * LISTAR TODOS OS DESEMBOLSOS
 */
const getAllDesembolsos = asyncHandler(async (req, res) => {
  const desembolsos = await Desembolso.findAll({
    include: [
      { model: PedidoCredito, as: "pedido" },
      { model: User, as: "criador", attributes: ["id", "nome", "email", "role"] },
    ],
    order: [["created_at", "DESC"]], // ✅ Mantido camelCase nativo do Sequelize
  });

  return res.status(200).json(desembolsos);
});

/**
 * LISTAR DESEMBOLSOS POR PEDIDO
 */
const getDesembolsoByPedido = asyncHandler(async (req, res) => {
  const { pedidoId } = req.params;

  const desembolsos = await Desembolso.findAll({
    where: { pedidoId },
    include: [
      { model: PedidoCredito, as: "pedido" },
      { model: User, as: "criador", attributes: ["id", "nome", "email", "role"] },
    ],
    order: [["id", "DESC"]],
  });

  return res.status(200).json(desembolsos);
});

module.exports = {
  createDesembolso,
  getAllDesembolsos,
  getDesembolsoByPedido,
};