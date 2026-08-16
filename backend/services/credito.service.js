const { Mutuario, User, Credito, PedidoCredito, ParcelaPagamento } = require("../models");
const generateCodParcela = require("../utils/generateCodParcela");

/**
 * Gera um número de contrato incremental baseado no ID.
 */
async function gerarNumeroContrato(options = {}) {
  const ano = new Date().getFullYear();
  const ultimo = await Credito.findOne({
    order: [["id", "DESC"]],
    ...options
  });

  const sequencia = ultimo ? ultimo.id + 1 : 1;
  return `CTR-${ano}-${String(sequencia).padStart(6, "0")}`;
}

/**
 * Cria automaticamente um crédito e faz o bulkCreate das parcelas.
 */
async function criarCredito(pedido, desembolso, userId, options = {}) {
  const numeroContrato = await gerarNumeroContrato(options);
  const dataInicio = desembolso.dataDesembolso || new Date();

  const dataFimPrevista = new Date(dataInicio);
  dataFimPrevista.setMonth(dataFimPrevista.getMonth() + Number(pedido.prazo));

  const credito = await Credito.create({
    numeroContrato,
    empresaId: pedido.empresaId,
    pedidoId: pedido.id,
    desembolsoId: desembolso.id,
    simulacaoId: pedido.simulacaoId || null,
    mutuarioId: pedido.mutuarioId,
    valorOriginal: pedido.valorSolicitado,
    saldoAtual: pedido.montanteTotal,
    totalPago: 0,
    prazo: pedido.prazo,
    taxa: pedido.taxa,
    prestacao: pedido.prestacao,
    jurosTotal: pedido.jurosTotal,
    montanteTotal: pedido.montanteTotal,
    estado: "ATIVO",
    dataInicio,
    dataFimPrevista,
    observacoes: pedido.observacoes || null,
    createdBy: userId,
  }, options);

  const parcelas = generateCodParcela({
    creditoId: credito.id,
    empresaId: credito.empresaId,
    prestacao: credito.prestacao,
    numeroParcelas: credito.prazo,
    primeiraDataVencimento: credito.dataInicio,
  });

  await ParcelaPagamento.bulkCreate(parcelas, options);
  return credito;
}

/**
 * Atualiza o saldo geral do crédito.
 */
async function atualizarSaldo(creditoId, valorPago, options = {}) {
  const credito = await Credito.findByPk(creditoId, options);
  if (!credito) {
    throw new Error("Crédito não encontrado.");
  }

  const novoTotalPago = Number(credito.totalPago) + Number(valorPago);
  const novoSaldo = Number(credito.saldoAtual) - Number(valorPago);

  credito.totalPago = novoTotalPago;
  credito.saldoAtual = Math.max(0, novoSaldo);

  if (credito.saldoAtual <= 0) {
    credito.estado = "LIQUIDADO";
    credito.dataLiquidacao = new Date();
  }

  await credito.save(options);
  return credito;
}

/**
 * Atualiza o estado interno e saldo de uma parcela específica.
 */
async function atualizarParcelaAposReembolso(creditoId, parcelaId, valorPago, dataReembolso = new Date(), options = {}) {
  const parcela = await ParcelaPagamento.findByPk(parcelaId, options);
  if (!parcela) {
    throw new Error("Parcela não encontrada.");
  }

  if (parcela.creditoId !== creditoId) {
    throw new Error("Parcela não pertence a este crédito.");
  }

  if (Number(valorPago) > Number(parcela.saldoParcela)) {
    throw new Error("O valor do pagamento nao pode ser superior ao saldo da parcela.");
  }

  const novoValorPago = Number(parcela.valorPago || 0) + Number(valorPago);
  const novoSaldoParcela = Math.max(0, Number(parcela.valorPrevisto) - novoValorPago);
  
  let novoEstado = "PENDENTE";
  if (novoSaldoParcela === 0) {
    novoEstado = "PAGO";
  } else if (new Date(parcela.dataVencimento) < new Date() && novoSaldoParcela > 0) {
    novoEstado = "ATRASADO";
  }

  await parcela.update({
    estado: novoEstado,
    dataPagamento: novoEstado === "PAGO" ? dataReembolso : parcela.dataPagamento,
    valorPago: novoValorPago,
    saldoParcela: novoSaldoParcela,
  }, options);

  return parcela;
}

/**
 * ORQUESTRADOR DO REEMBOLSO (Suporta e exige propagação transacional)
 */
async function registarReembolso(creditoId, parcelaId, valorReembolsado, dataReembolso = new Date(), options = {}) {
  const credito = await Credito.findByPk(creditoId, options);
  if (!credito) {
    throw new Error("Crédito não encontrado.");
  }

  if (credito.estado === "LIQUIDADO") {
    throw new Error("Crédito já foi liquidado. Não é possível registar reembolsos.");
  }

  if (!parcelaId) {
    throw new Error("A parcela do pagamento e obrigatoria.");
  }

  const parcelaAtualizada = await atualizarParcelaAposReembolso(
    creditoId,
    parcelaId,
    valorReembolsado,
    dataReembolso,
    options
  );

  const creditoAtualizado = await atualizarSaldo(creditoId, valorReembolsado, options);

  return {
    credito: creditoAtualizado,
    parcela: parcelaAtualizada,
    sucesso: true,
  };
}

// Consultas nativas limpas (Reaproveitáveis)
async function listarMeusCreditos(mutuarioId) {
  return await Credito.findAll({
    where: { mutuarioId },
    include: [{ model: PedidoCredito, as: "pedido" }],
    order: [["created_at", "DESC"]], // ✅ camelCase obrigatório
  });
}

async function buscarMeuCredito(creditoId, mutuarioId) {
  return await Credito.findOne({
    where: { id: creditoId, mutuarioId },
    include: [
      { model: PedidoCredito, as: "pedido" },
      { model: ParcelaPagamento, as: "parcelas", separate: true, order: [["numeroParcela", "ASC"]] },
    ],
  });
}

module.exports = {
  listarMeusCreditos,
  buscarMeuCredito,
  criarCredito,
  atualizarSaldo,
  atualizarParcelaAposReembolso,
  registarReembolso,
};
