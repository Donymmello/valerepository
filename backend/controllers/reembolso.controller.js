const { Reembolso, Credito, ParcelaPagamento, User, sequelize } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const { generateReferencia } = require("../utils/generateCode");
const CreditoService = require("../services/credito.service");
const { asyncHandler } = require("../middleware/errorHandler.middleware");
const { podeRegistrarReembolso } = require("../utils/regrasCredito");

// =========================================================================
// HELPERS INTERNOS DE FLUXO
// =========================================================================

/**
 * Valida o estado financeiro final do crédito pós-transação para logs de auditoria
 */
async function verificarLiquidacaoAutomatica(credito, userId, transaction) {
  // Se o crédito foi marcado como liquidado pelo CreditoService, regista na auditoria
  if (credito.estado === "LIQUIDADO") {
    await registrarLogAuditoria({
      userId,
      acao: "CREDITO_LIQUIDADO_POR_REEMBOLSO",
      entidade: "Credito",
      entidadeId: credito.id,
      descricao: `Crédito ${credito.numeroContrato} foi liquidado automaticamente após reembolso total.`,
    }, { transaction });
  }
}

// =========================================================================
// CONTROLLERS
// =========================================================================

/**
 * CRIAR REEMBOLSO (OPERATÓRIA FINANCEIRA ATÓMICA)
 */
const createReembolso = asyncHandler(async (req, res) => {
  const {
    creditoId,
    parcelaId,
    valorReembolsado,
    dataReembolso,
    meioPagamento,
    numeroTransacao,
    observacoes,
  } = req.body;

  if (!creditoId || !valorReembolsado) {
    return res.status(400).json({ message: "creditoId e valorReembolsado são obrigatórios." });
  }

  if (Number(valorReembolsado) <= 0) {
    return res.status(400).json({ message: "Valor do reembolso deve ser maior que zero." });
  }

  const credito = await Credito.findOne({ where: { id: creditoId, empresaId: req.user.empresaId } });
  if (!credito) {
    return res.status(404).json({ message: "Crédito não encontrado." });
  }

  if (!podeRegistrarReembolso(req.user, credito)) {
    return res.status(403).json({
      message: "Não tens permissão para registar reembolso neste crédito ou o status atual não permite.",
    });
  }

  const dataFormatada = dataReembolso ? new Date(dataReembolso) : new Date();

  // ISOLAMENTO ACID TOTAL: Garante integridade absoluta dos saldos e parcelas
  const { reembolso, resultado } = await sequelize.transaction(async (t) => {
    const referencia = await generateReferencia();

    const novoReembolso = await Reembolso.create({
      creditoId,
      empresaId: credito.empresaId,
      parcelaId: parcelaId || null,
      valorReembolsado,
      dataReembolso: dataFormatada,
      meioPagamento: meioPagamento || "TRANSFERENCIA",
      numeroTransacao: numeroTransacao || null,
      referencia,
      observacoes: observacoes || null,
      createdBy: req.user.id,
    }, { transaction: t });

    // Orquestra as atualizações financeiras dentro da mesma transação
    const resultadoFinanceiro = await CreditoService.registarReembolso(
      creditoId,
      parcelaId || null,
      valorReembolsado,
      dataFormatada,
      { transaction: t } // Certifica-te de que o teu CreditoService aceita e propaga este objeto de transação!
    );

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "CRIAR_REEMBOLSO",
      entidade: "Reembolso",
      entidadeId: novoReembolso.id,
      descricao: `Reembolso de ${valorReembolsado} criado para crédito ${credito.numeroContrato}.`,
    }, { transaction: t });

    // Recarrega os saldos atualizados diretamente na instância em memória usando a transação atual
    await credito.reload({ transaction: t });

    await verificarLiquidacaoAutomatica(credito, req.user.id, t);

    return { reembolso: novoReembolso, resultado: resultadoFinanceiro };
  });

  return res.status(201).json({
    message: "Reembolso criado com sucesso.",
    reembolso,
    credito: {
      id: credito.id,
      numeroContrato: credito.numeroContrato,
      estado: credito.estado,
      saldoAtual: credito.saldoAtual,
      totalPago: credito.totalPago,
      montanteTotal: credito.montanteTotal,
    },
    parcela: resultado.parcela ? {
      id: resultado.parcela.id,
      numeroParcela: resultado.parcela.numeroParcela,
      estado: resultado.parcela.estado,
      dataPagamento: resultado.parcela.dataPagamento,
    } : null,
  });
});

/**
 * LISTAR TODOS OS REEMBOLSOS
 */
const getAllReembolsos = asyncHandler(async (req, res) => {
  const reembolsos = await Reembolso.findAll({
    where: { empresaId: req.user.empresaId },
    include: [
      { model: Credito, as: "credito" },
      { model: ParcelaPagamento, as: "parcela" },
      { model: User, as: "criador", attributes: ["id", "nome", "email", "role"] },
    ],
    order: [["id", "DESC"]],
  });

  return res.status(200).json(reembolsos);
});

/**
 * LISTAR REEMBOLSOS POR CRÉDITO
 */
const getReembolsoByCredito = asyncHandler(async (req, res) => {
  const { creditoId } = req.params;

  const reembolsos = await Reembolso.findAll({
    where: { creditoId, empresaId: req.user.empresaId },
    include: [
      { model: Credito, as: "credito" },
      { model: User, as: "criador", attributes: ["id", "nome", "email", "role"] },
    ],
    order: [["created_at", "DESC"]], // ✅ camelCase obrigatório devido ao underscored: true
  });

  return res.status(200).json(reembolsos);
});

/**
 * OBTER DETALHES DE UM REEMBOLSO
 */
const obterReembolso = asyncHandler(async (req, res) => {
  const { reembolsoId } = req.params;

  const reembolso = await Reembolso.findOne({
    where: { id: reembolsoId, empresaId: req.user.empresaId },
    include: [
      { model: Credito, as: "credito" },
      { model: ParcelaPagamento, as: "parcela" },
      { model: User, as: "criador", attributes: ["id", "nome", "email"] },
    ],
  });

  if (!reembolso) {
    return res.status(404).json({ message: "Reembolso não encontrado." });
  }

  return res.status(200).json(reembolso);
});

module.exports = {
  createReembolso,
  getAllReembolsos,
  getReembolsoByCredito,
  obterReembolso,
};