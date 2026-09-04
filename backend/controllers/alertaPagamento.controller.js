const { Op } = require("sequelize");
const {
  ParcelaPagamento,
  PedidoCredito,
  Mutuario,
  Notificacao,
} = require("../models");

/*
  Núcleo da verificação, isolado do req/res para poder ser chamado tanto
  pelo endpoint manual (POST /alertas-pagamento/verificar) como pelo
  agendador automático (services/agendador.service.js), antes disto só
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

  /*
    Antes: 1 findOne + (às vezes) 1 create + 1 update por parcela, para
    N parcelas vencendo/vencidas, até 3N round-trips sequenciais à BD.
    Agora: monta os candidatos em memória primeiro, faz 1 query para
    saber que notificações "não lidas" já existem, e no fim faz no
    máximo 1 bulkCreate + 1 update em lote.
  */
  const candidatos = [];
  const idsVencidas = [];

  for (const parcela of parcelas) {
    const pedido = parcela.pedido;
    const mutuario = pedido?.mutuario;

    if (!mutuario?.userId) continue;

    const vencimento = new Date(parcela.dataVencimento);
    const vencido = vencimento < hoje;

    if (vencido) idsVencidas.push(parcela.id);

    const titulo = vencido
      ? "Pagamento em Atraso"
      : "Pagamento Próximo do Vencimento";

    const mensagem = vencido
      ? `A parcela ${parcela.numeroParcela} do pedido ${pedido.numeroPedido} está vencida.`
      : `A parcela ${parcela.numeroParcela} do pedido ${pedido.numeroPedido} vence em breve.`;

    candidatos.push({
      userId: mutuario.userId,
      pedidoId: pedido.id,
      numeroPedido: pedido.numeroPedido,
      numeroParcela: parcela.numeroParcela,
      dataVencimento: parcela.dataVencimento,
      titulo,
      mensagem,
      vencido,
    });
  }

  const alertasCriados = [];

  if (candidatos.length) {
    const userIds = [...new Set(candidatos.map((c) => c.userId))];
    const pedidoIds = [...new Set(candidatos.map((c) => c.pedidoId))];

    const existentes = await Notificacao.findAll({
      where: {
        userId: { [Op.in]: userIds },
        pedidoId: { [Op.in]: pedidoIds },
        tipo: "ALERTA_PAGAMENTO",
        lida: false,
      },
      attributes: ["userId", "pedidoId", "titulo"],
      raw: true,
    });
    const chavesExistentes = new Set(
      existentes.map((n) => `${n.userId}|${n.pedidoId}|${n.titulo}`)
    );

    // Mesma regra do código original: só uma notificação por
    // (mutuário, pedido, título), mesmo que várias parcelas do mesmo
    // pedido estejam vencidas/a vencer ao mesmo tempo.
    const paraCriar = [];
    for (const candidato of candidatos) {
      const chave = `${candidato.userId}|${candidato.pedidoId}|${candidato.titulo}`;
      if (chavesExistentes.has(chave)) continue;
      chavesExistentes.add(chave);
      paraCriar.push(candidato);
    }

    if (paraCriar.length) {
      await Notificacao.bulkCreate(
        paraCriar.map((c) => ({
          userId: c.userId,
          pedidoId: c.pedidoId,
          titulo: c.titulo,
          mensagem: c.mensagem,
          tipo: "ALERTA_PAGAMENTO",
        }))
      );

      paraCriar.forEach((c) => {
        alertasCriados.push({
          pedidoId: c.pedidoId,
          numeroPedido: c.numeroPedido,
          numeroParcela: c.numeroParcela,
          vencido: c.vencido,
          dataVencimento: c.dataVencimento,
        });
      });
    }
  }

  if (idsVencidas.length) {
    // "ATRASADO", não "VENCIDO", o ENUM de ParcelaPagamento.estado só
    // tem PENDENTE/PAGO/ATRASADO (ver model). "VENCIDO" nunca existiu
    // no enum; este update falhava sempre (erro do Postgres), silenciado
    // pelo try/catch do endpoint manual e, no agendador automático,
    // significava que nenhuma parcela vencida era alguma vez marcada
    // como ATRASADO por este job, ver credito.service.js
    // (atualizarParcelaAposReembolso), que já usa "ATRASADO" corretamente
    // no único outro sítio do sistema que escreve este campo.
    await ParcelaPagamento.update(
      { estado: "ATRASADO" },
      { where: { id: { [Op.in]: idsVencidas } } }
    );
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