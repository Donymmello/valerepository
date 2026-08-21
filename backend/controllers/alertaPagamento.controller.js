const { Op } = require("sequelize");
const {
  ParcelaPagamento,
  PedidoCredito,
  Mutuario,
  Notificacao,
} = require("../models");

async function criarNotificacaoSemDuplicar({
  userId,
  pedidoId = null,
  titulo,
  mensagem,
  tipo = "ALERTA_PAGAMENTO",
}) {
  const existente = await Notificacao.findOne({
    where: {
      userId,
      pedidoId,
      titulo,
      tipo,
      lida: false,
    },
  });

  if (existente) return null;

  return Notificacao.create({
    userId,
    pedidoId,
    titulo,
    mensagem,
    tipo,
  });
}

/*
  Núcleo da verificação, isolado do req/res para poder ser chamado tanto
  pelo endpoint manual (POST /alertas-pagamento/verificar) como pelo
  agendador automático (services/agendador.service.js) — antes disto só
  existia o endpoint manual, que nunca tinha botão nenhum no frontend a
  chamá-lo, por isso nenhum mutuário alguma vez recebeu este alerta.
*/
async function executarVerificacaoPagamento(empresaId) {
  const hoje = new Date();
  const emTresDias = new Date();
  emTresDias.setDate(emTresDias.getDate() + 3);

  const parcelas = await ParcelaPagamento.findAll({
    where: {
      empresaId,
      estado: "PENDENTE",
      dataVencimento: {
        [Op.lte]: emTresDias,
      },
    },
    include: [
      {
        model: PedidoCredito,
        as: "pedido",
        include: [
          {
            model: Mutuario,
            as: "mutuario",
          },
        ],
      },
    ],
    order: [["dataVencimento", "ASC"]],
  });

  const alertasCriados = [];

  for (const parcela of parcelas) {
    const pedido = parcela.pedido;
    const mutuario = pedido?.mutuario;

    if (!mutuario?.userId) continue;

    const vencimento = new Date(parcela.dataVencimento);
    const vencido = vencimento < hoje;

    const titulo = vencido
      ? "Pagamento em Atraso"
      : "Pagamento Próximo do Vencimento";

    const mensagem = vencido
      ? `A parcela ${parcela.numeroParcela} do pedido ${pedido.numeroPedido} está vencida.`
      : `A parcela ${parcela.numeroParcela} do pedido ${pedido.numeroPedido} vence em breve.`;

    const notificacao = await criarNotificacaoSemDuplicar({
      userId: mutuario.userId,
      pedidoId: pedido.id,
      titulo,
      mensagem,
      tipo: "ALERTA_PAGAMENTO",
    });

    if (notificacao) {
      alertasCriados.push({
        pedidoId: pedido.id,
        numeroPedido: pedido.numeroPedido,
        numeroParcela: parcela.numeroParcela,
        vencido,
        dataVencimento: parcela.dataVencimento,
      });
    }

    if (vencido) {
      await parcela.update({ estado: "VENCIDO" });
    }
  }

  return alertasCriados;
}

async function verificarAlertasPagamento(req, res) {
  try {
    const alertasCriados = await executarVerificacaoPagamento(req.user.empresaId);

    return res.status(200).json({
      message: "Verificação de alertas de pagamento concluída.",
      totalAlertas: alertasCriados.length,
      alertasCriados,
    });
  } catch (error) {
    console.error("Erro ao verificar alertas de pagamento:", error);

    return res.status(500).json({
      message: "Erro interno ao verificar alertas de pagamento.",
      error: error.message,
    });
  }
}

module.exports = {
  verificarAlertasPagamento,
  executarVerificacaoPagamento,
};