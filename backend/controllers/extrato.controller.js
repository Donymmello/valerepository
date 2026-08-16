const {
  PedidoCredito,
  Mutuario,
  User,
  Reembolso,
  Desembolso,
  Credito,
  ParcelaPagamento,
  AprovacaoPedido,
} = require("../models");

/*
  ==========================================================
  EXTRATO FINANCEIRO E PROCESSUAL DO PEDIDO
  ==========================================================
  Nova dinâmica: a vida financeira do pedido vive no Crédito.
  Após o desembolso é criado um Crédito com parcelas; os
  reembolsos são registados contra a parcela/crédito (não
  contra o pedido). O extrato lê os totais reais do crédito:
  - montante total, total pago, saldo em dívida, estado
  - parcelas (previsto/pago/saldo/estado/vencimento)
  - reembolsos (via crédito)
*/
async function getExtratoPedido(req, res) {
  try {
    const { pedidoId } = req.params;

    const pedido = await PedidoCredito.findOne({
      where: { id: pedidoId, empresaId: req.user.empresaId },
      include: [
        {
          model: Mutuario,
          as: "mutuario",
        },
        {
          model: User,
          as: "criador",
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
        {
          model: AprovacaoPedido,
          as: "aprovacoes",
          required: false,
          include: [
            {
              model: User,
              as: "aprovador",
              attributes: ["id", "nome", "email", "role", "ativo"],
            },
          ],
        },
        {
          model: Desembolso,
          as: "desembolsos",
          required: false,
          include: [
            {
              model: User,
              as: "criador",
              attributes: ["id", "nome", "email", "role"],
            },
          ],
        },
        {
          model: Credito,
          as: "creditos",
          required: false,
          include: [
            {
              model: ParcelaPagamento,
              as: "parcelas",
              required: false,
            },
            {
              model: Reembolso,
              as: "reembolsos",
              required: false,
              include: [
                {
                  model: User,
                  as: "criador",
                  attributes: ["id", "nome", "email", "role"],
                },
              ],
            },
          ],
        },
      ],
      order: [
        [{ model: Credito, as: "creditos" }, { model: ParcelaPagamento, as: "parcelas" }, "numeroParcela", "ASC"],
      ],
    });

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido de crédito não encontrado.",
      });
    }

    const resumoFinanceiro = resumirExtrato(pedido);

    return res.status(200).json({
      pedido,
      resumoFinanceiro,
    });
  } catch (error) {
    console.error("Erro ao gerar extrato do pedido:", error);

    return res.status(500).json({
      message: "Erro interno ao gerar extrato do pedido.",
      error: error.message,
    });
  }
}

/*
  Agrega os totais do extrato a partir dos desembolsos do pedido
  e dos créditos (saldoAtual/totalPago já mantidos pelo serviço).
  Mantém as chaves antigas (totalDesembolsado/totalReembolsado/
  saldoEmDivida) para compatibilidade e acrescenta o montante.
*/
function resumirExtrato(pedido) {
  const num = (v) => Number(v || 0);

  const totalDesembolsado = (pedido.desembolsos || []).reduce(
    (total, item) => total + num(item.valorDesembolsado),
    0
  );

  const creditos = pedido.creditos || [];

  const montanteTotal = creditos.reduce((t, c) => t + num(c.montanteTotal), 0);
  const totalReembolsado = creditos.reduce((t, c) => t + num(c.totalPago), 0);
  const saldoEmDivida = creditos.reduce((t, c) => t + num(c.saldoAtual), 0);

  return {
    totalDesembolsado,
    totalReembolsado,
    montanteTotal,
    // saldo em dívida vem do crédito; sem crédito ainda, cai para desembolsado - reembolsado
    saldoEmDivida: creditos.length ? saldoEmDivida : totalDesembolsado - totalReembolsado,
  };
}

module.exports = {
  getExtratoPedido,
};
