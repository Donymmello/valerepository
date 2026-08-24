const { Mutuario, User, Credito, PedidoCredito, ParcelaPagamento } = require("../models");
const { Op } = require("sequelize");
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
 * Cria um crédito a partir de um "saldo de abertura" — para migrar um
 * empréstimo que já existia antes deste sistema (caderno/Excel do
 * cliente), em vez de recriar o histórico completo de parcelas desde o
 * início.
 *
 * Ao contrário de criarCredito() (fluxo normal, sempre começa do zero,
 * todas as parcelas PENDENTE), aqui: o saldo devedor e o total já pago
 * vêm de fora (o estado real de hoje, não recalculado), e só as
 * parcelas AINDA POR PAGAR são criadas — as `parcelasPagas` primeiras
 * são omitidas (ficam só resumidas num texto em `observacoes`). Ver
 * discussão em RECUPERACAO_BD.md, secção sobre migração de dados.
 *
 * `pedido` aqui não é um pedido real que passou por aprovação — é um
 * "pedido-invólucro" (status DESEMBOLSADO desde o início) criado só
 * para o crédito ter de onde herdar valorSolicitado/prazo/taxa/etc.,
 * mantendo a mesma estrutura de dados do resto do sistema.
 */
async function criarCreditoImportado(pedido, desembolso, userId, dadosAbertura = {}, options = {}) {
  const {
    parcelasPagas = 0,
    saldoAtual = null,
    totalPago = null,
    observacoes = null,
    numeroContrato = null,
  } = dadosAbertura;

  const numeroContratoFinal = numeroContrato || (await gerarNumeroContrato(options));
  const dataInicio = desembolso.dataDesembolso;

  const dataFimPrevista = new Date(dataInicio);
  dataFimPrevista.setMonth(dataFimPrevista.getMonth() + Number(pedido.prazo));

  const totalPagoFinal =
    totalPago !== null ? Number(totalPago) : Number(pedido.prestacao) * Number(parcelasPagas);
  const saldoAtualFinal =
    saldoAtual !== null
      ? Number(saldoAtual)
      : Math.max(0, Number(pedido.montanteTotal) - totalPagoFinal);

  const notaImportacao = `Crédito importado do sistema anterior. ${parcelasPagas} de ${pedido.prazo} parcelas já pagas antes da migração.`;
  const observacoesFinal = observacoes ? `${notaImportacao} ${observacoes}` : notaImportacao;

  const credito = await Credito.create({
    numeroContrato: numeroContratoFinal,
    empresaId: pedido.empresaId,
    pedidoId: pedido.id,
    desembolsoId: desembolso.id,
    mutuarioId: pedido.mutuarioId,
    valorOriginal: pedido.valorSolicitado,
    saldoAtual: saldoAtualFinal,
    totalPago: totalPagoFinal,
    prazo: pedido.prazo,
    taxa: pedido.taxa,
    prestacao: pedido.prestacao,
    jurosTotal: pedido.jurosTotal,
    montanteTotal: pedido.montanteTotal,
    estado: saldoAtualFinal <= 0 ? "LIQUIDADO" : "ATIVO",
    dataInicio,
    dataFimPrevista,
    dataLiquidacao: saldoAtualFinal <= 0 ? new Date() : null,
    observacoes: observacoesFinal,
    importado: true,
    createdBy: userId,
  }, options);

  // Gera o plano completo (igual ao fluxo normal) e descarta as
  // primeiras `parcelasPagas` — assim a numeração e as datas de
  // vencimento das parcelas restantes continuam corretas (ex: "parcela
  // 4 de 12", vencendo 4 meses depois do início real do contrato).
  const todasParcelas = generateCodParcela({
    creditoId: credito.id,
    empresaId: credito.empresaId,
    prestacao: credito.prestacao,
    numeroParcelas: credito.prazo,
    primeiraDataVencimento: credito.dataInicio,
  });

  const parcelasRestantes = todasParcelas.slice(Number(parcelasPagas));
  if (parcelasRestantes.length) {
    await ParcelaPagamento.bulkCreate(parcelasRestantes, options);
  }

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

/**
 * Marca automaticamente créditos ATIVOs como INCUMPRIMENTO quando têm
 * pelo menos uma parcela por pagar vencida há mais de `limiarDias`, e
 * recupera de volta para ATIVO os créditos já marcados que deixaram de
 * ter qualquer parcela nessas condições (ex: staff pagou o atraso).
 *
 * Antes desta função, `ESTADO_CREDITO.INCUMPRIMENTO` existia no ENUM e
 * era lido pelo Dashboard e pela situação dos mutuários, mas nunca era
 * escrito em lado nenhum do código — ver `podeMarcarIncumprimento()` em
 * utils/regrasCredito.js, que ficou só como comentário de planeamento.
 * Por isso o contador de "créditos em incumprimento" mostrava sempre 0.
 *
 * Chamada diariamente pelo agendador (services/agendador.service.js),
 * por empresa — mesmo padrão dos alertas de prazo/pagamento.
 */
async function verificarIncumprimentoEmpresa(empresaId, limiarDias = 30) {
  const limite = new Date();
  limite.setDate(limite.getDate() - limiarDias);

  const creditosParaMarcar = await Credito.findAll({
    where: { empresaId, estado: "ATIVO" },
    include: [
      {
        model: ParcelaPagamento,
        as: "parcelas",
        attributes: [],
        where: {
          estado: { [Op.ne]: "PAGO" },
          dataVencimento: { [Op.lt]: limite },
        },
        required: true,
      },
    ],
  });

  let marcados = 0;
  for (const credito of creditosParaMarcar) {
    await credito.update({ estado: "INCUMPRIMENTO" });
    marcados += 1;
  }

  const creditosEmIncumprimento = await Credito.findAll({
    where: { empresaId, estado: "INCUMPRIMENTO" },
    include: [
      {
        model: ParcelaPagamento,
        as: "parcelas",
        attributes: ["id", "estado", "dataVencimento"],
        required: false,
      },
    ],
  });

  let recuperados = 0;
  for (const credito of creditosEmIncumprimento) {
    const aindaEmIncumprimento = (credito.parcelas || []).some(
      (parcela) =>
        parcela.estado !== "PAGO" && new Date(parcela.dataVencimento) < limite
    );

    if (!aindaEmIncumprimento) {
      await credito.update({ estado: "ATIVO" });
      recuperados += 1;
    }
  }

  return { marcados, recuperados };
}

/**
 * Verifica se o mutuário tem algum crédito em INCUMPRIMENTO nesta
 * empresa — usado para bloquear a submissão de novos pedidos de crédito
 * (abordagem "estilo Txuna": sem juro de mora, só restringe acesso a
 * crédito novo até regularizar o que está em atraso).
 */
async function mutuarioTemCreditoEmIncumprimento(mutuarioId, empresaId) {
  const credito = await Credito.findOne({
    where: { mutuarioId, empresaId, estado: "INCUMPRIMENTO" },
    attributes: ["id"],
  });

  return !!credito;
}

module.exports = {
  listarMeusCreditos,
  buscarMeuCredito,
  criarCredito,
  criarCreditoImportado,
  atualizarSaldo,
  atualizarParcelaAposReembolso,
  registarReembolso,
  verificarIncumprimentoEmpresa,
  mutuarioTemCreditoEmIncumprimento,
};
