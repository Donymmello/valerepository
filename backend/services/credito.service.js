const { Credito, PedidoCredito, ParcelaPagamento } = require("../models");
const generateCodParcela = require("../utils/generateCodParcela");


/*
==========================================================
LISTAR CRÉDITOS DO MUTUÁRIO
==========================================================
*/
async function listarMeusCreditos(mutuarioId) {
  return await Credito.findAll({
    where: {
      mutuarioId,
    },
    include: [
      {
        model: PedidoCredito,
        as: "pedido",
      },
    ],
    order: [["createdAt", "DESC"]],
  });
}

/*
==========================================================
DETALHE DE UM CRÉDITO
==========================================================
*/
async function buscarMeuCredito(creditoId, mutuarioId) {
  return await Credito.findOne({
    where: {
      id: creditoId,
      mutuarioId,
    },
    include: [
      {
        model: PedidoCredito,
        as: "pedido",
      },
      {
        model: ParcelaPagamento,
        as: "parcelas",
        separate: true,
        order: [["numeroParcela", "ASC"]],
      },
    ],
  });
}

/**
 * Gera um número de contrato.
 * Exemplo:
 * CTR-2026-000001
 */
async function gerarNumeroContrato() {
  const ano = new Date().getFullYear();

  const ultimo = await Credito.findOne({
    order: [["id", "DESC"]],
  });

  const sequencia = ultimo ? ultimo.id + 1 : 1;

  return `CTR-${ano}-${String(sequencia).padStart(6, "0")}`;
}

/**
 * Cria automaticamente um crédito a partir
 * de um pedido já desembolsado.
 */
async function criarCredito(pedido, desembolso, userId) {
  const numeroContrato = await gerarNumeroContrato();

  const dataInicio = desembolso.dataDesembolso || new Date();

  const dataFimPrevista = new Date(dataInicio);
  dataFimPrevista.setMonth(
    dataFimPrevista.getMonth() + Number(pedido.prazo)
  );

  const credito = await Credito.create({
    numeroContrato,

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
  });

  const parcelas = generateCodParcela({
    creditoId: credito.id,
    prestacao: credito.prestacao,
    numeroParcelas: credito.prazo,
    primeiraDataVencimento: credito.dataInicio,
  });

  await ParcelaPagamento.bulkCreate(parcelas);

  return credito;
}

/**
 * Atualiza o saldo após um reembolso.
 */
async function atualizarSaldo(creditoId, valorPago) {
  const credito = await Credito.findByPk(creditoId);

  if (!credito) {
    throw new Error("Crédito não encontrado.");
  }

  const novoTotalPago =
    Number(credito.totalPago) + Number(valorPago);

  const novoSaldo =
    Number(credito.saldoAtual) - Number(valorPago);

  credito.totalPago = novoTotalPago;
  credito.saldoAtual = Math.max(0, novoSaldo);

  if (credito.saldoAtual <= 0) {
    credito.estado = "LIQUIDADO";
    credito.dataLiquidacao = new Date();
  }

  await credito.save();

  return credito;
}

module.exports = {
  listarMeusCreditos,
  buscarMeuCredito,
  criarCredito,
  atualizarSaldo,
};
