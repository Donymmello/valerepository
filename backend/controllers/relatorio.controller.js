const { Op, fn, col } = require("sequelize");

const {
  PedidoCredito,
  Credito,
  Mutuario,
  ParcelaPagamento,
  Desembolso,
  Reembolso,
} = require("../models");

const PENDING_PEDIDO_STATUS = [
  "RASCUNHO",
  "SUBMETIDO",
  "EM_ANALISE",
  "EM_VALIDACAO",
];

const APPROVED_PEDIDO_STATUS = ["APROVADO", "DESEMBOLSADO"];

function parseDate(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

function buildDateRangeFilter(field, query = {}) {
  const filter = {};
  const start = parseDate(query.dataInicial);
  const end = parseDate(query.dataFinal, true);

  if (start) filter[Op.gte] = start;
  if (end) filter[Op.lte] = end;

  return Object.keys(filter).length ? { [field]: filter } : {};
}

function buildPedidoFilters(query = {}, empresaId) {
  const where = { empresaId };

  if (query.status) {
    where.status = query.status;
  }

  const created_atFilter = buildDateRangeFilter("created_at", query);
  if (Object.keys(created_atFilter).length) {
    Object.assign(where, created_atFilter);
  }

  return where;
}

async function dashboardFinanceiro(req, res) {
  try {
    const hoje = new Date();
    const hojeString = hoje.toISOString().slice(0, 10);

    const empresaId = req.user.empresaId;

    const [creditosPorEstado, totalParcelas, parcelasPendentes, parcelasPagas, parcelasVencidas, valorDesembolsado, valorRecebido, saldoCarteira] =
      await Promise.all([
        Credito.findAll({
          where: { empresaId },
          attributes: [
            "estado",
            [fn("COUNT", col("id")), "count"],
          ],
          group: ["estado"],
        }),
        ParcelaPagamento.count({ where: { empresaId } }),
        ParcelaPagamento.count({ where: { empresaId, estado: "PENDENTE" } }),
        ParcelaPagamento.count({ where: { empresaId, estado: "PAGO" } }),
        ParcelaPagamento.count({
          where: {
            empresaId,
            estado: "PENDENTE",
            dataVencimento: { [Op.lt]: hojeString },
          },
        }),
        Desembolso.sum("valorDesembolsado", { where: { empresaId } }),
        Reembolso.sum("valorReembolsado", { where: { empresaId } }),
        Credito.sum("saldoAtual", { where: { empresaId } }),
      ]);

    const estadoMap = creditosPorEstado.reduce((acc, item) => {
      acc[item.estado] = Number(item.get("count")) || 0;
      return acc;
    }, {});

    const resumo = {
      totalCreditos: Object.values(estadoMap).reduce((acc, value) => acc + value, 0),
      creditosAtivos: estadoMap["ATIVO"] || 0,
      creditosLiquidados: estadoMap["LIQUIDADO"] || 0,
      creditosIncumprimento: estadoMap["INCUMPRIMENTO"] || 0,
      creditosReestruturados: estadoMap["REESTRUTURADO"] || 0,
    };

    const financeiro = {
      valorDesembolsado: Number(valorDesembolsado || 0),
      valorRecebido: Number(valorRecebido || 0),
      saldoCarteira: Number(saldoCarteira || 0),
    };

    const infoParcelas = {
      totalParcelas: Number(totalParcelas || 0),
      parcelasPendentes: Number(parcelasPendentes || 0),
      parcelasPagas: Number(parcelasPagas || 0),
      parcelasVencidas: Number(parcelasVencidas || 0),
    };

    return res.status(200).json({
      resumo,
      financeiro,
      parcelas: infoParcelas,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao gerar dashboard financeiro.",
      error: error.message,
    });
  }
}

async function getResumoGeral(req, res) {
  try {
    const empresaId = req.user.empresaId;

    const [
      totalPedidos,
      pedidosPendentes,
      pedidosAprovados,
      totalMutuarios,
      totalDesembolsado,
      totalReembolsado,
      saldoGlobal,
      pedidosPorStatusRows,
    ] = await Promise.all([
      PedidoCredito.count({ where: { empresaId } }),
      PedidoCredito.count({ where: { empresaId, status: { [Op.in]: PENDING_PEDIDO_STATUS } } }),
      PedidoCredito.count({ where: { empresaId, status: { [Op.in]: APPROVED_PEDIDO_STATUS } } }),
      Mutuario.count({ where: { empresaId } }),
      Desembolso.sum("valorDesembolsado", { where: { empresaId } }),
      Reembolso.sum("valorReembolsado", { where: { empresaId } }),
      Credito.sum("saldoAtual", { where: { empresaId } }),
      PedidoCredito.findAll({
        where: { empresaId },
        attributes: [
          "status",
          [fn("COUNT", col("id")), "count"],
        ],
        group: ["status"],
      }),
    ]);

    const pedidosPorStatus = pedidosPorStatusRows.reduce((acc, row) => {
      acc[row.status] = Number(row.get("count")) || 0;
      return acc;
    }, {});

    return res.status(200).json({
      totalPedidos: Number(totalPedidos || 0),
      pedidosPendentes: Number(pedidosPendentes || 0),
      pedidosAprovados: Number(pedidosAprovados || 0),
      totalMutuarios: Number(totalMutuarios || 0),
      totalDesembolsado: Number(totalDesembolsado || 0),
      totalReembolsado: Number(totalReembolsado || 0),
      saldoGlobal: Number(saldoGlobal || 0),
      pedidosPorStatus,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao buscar o resumo geral.",
      error: error.message,
    });
  }
}

async function getRelatorioPedidos(req, res) {
  try {
    const where = buildPedidoFilters(req.query, req.user.empresaId);

    const pedidos = await PedidoCredito.findAll({
      where,
      attributes: [
        "id",
        "numeroPedido",
        "status",
        "valorSolicitado",
        "finalidade",
        "created_at",
      ],
      include: [
        {
          model: Mutuario,
          as: "mutuario",
          attributes: ["id", "nomeCompleto"],
        },
      ],
      order: [["created_at", "DESC"]],
      // RelatoriosList.jsx só mostra os 8 mais recentes (slice client-side)
      //, trava de segurança, o total agregado vem de getResumoGeral.
      limit: 500,
    });

    return res.status(200).json(pedidos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao buscar o relatório de pedidos.",
      error: error.message,
    });
  }
}

async function getRelatorioFinanceiroPedidos(req, res) {
  try {
    const where = buildPedidoFilters(req.query, req.user.empresaId);

    const pedidos = await PedidoCredito.findAll({
      where,
      attributes: [
        "id",
        "numeroPedido",
        "status",
        "valorSolicitado",
      ],
      include: [
        {
          model: Mutuario,
          as: "mutuario",
          attributes: ["id", "nomeCompleto"],
        },
      ],
      order: [["created_at", "DESC"]],
      // Mesma trava de segurança de getRelatorioPedidos.
      limit: 500,
    });

    const pedidoIds = pedidos.map((pedido) => pedido.id);

    const [desembolsoRows, reembolsoRows, saldoRows] = await Promise.all([
      Desembolso.findAll({
        attributes: [
          "pedidoId",
          [fn("SUM", col("valor_desembolsado")), "totalDesembolsado"],
        ],
        where: pedidoIds.length ? { pedidoId: { [Op.in]: pedidoIds } } : undefined,
        group: ["pedidoId"],
      }),
      // Reembolso não tem coluna pedidoId, relaciona-se com o pedido através
      // de Credito (Reembolso -> Credito -> PedidoCredito). Por isso soma-se
      // em JS em vez de um GROUP BY direto na BD.
      Reembolso.findAll({
        attributes: ["valorReembolsado"],
        include: [
          {
            model: Credito,
            as: "credito",
            attributes: ["pedidoId"],
            where: pedidoIds.length ? { pedidoId: { [Op.in]: pedidoIds } } : undefined,
            required: true,
          },
        ],
      }),
      Credito.findAll({
        attributes: [
          "pedidoId",
          [fn("SUM", col("saldo_atual")), "saldo"],
        ],
        where: pedidoIds.length ? { pedidoId: { [Op.in]: pedidoIds } } : undefined,
        group: ["pedidoId"],
      }),
    ]);

    const desembolsosPorPedido = desembolsoRows.reduce((acc, item) => {
      acc[item.pedidoId] = Number(item.get("totalDesembolsado")) || 0;
      return acc;
    }, {});

    const reembolsosPorPedido = reembolsoRows.reduce((acc, item) => {
      const pedidoId = item.credito?.pedidoId;
      if (pedidoId == null) return acc;
      acc[pedidoId] = (acc[pedidoId] || 0) + Number(item.valorReembolsado || 0);
      return acc;
    }, {});

    const saldosPorPedido = saldoRows.reduce((acc, item) => {
      acc[item.pedidoId] = Number(item.get("saldo")) || 0;
      return acc;
    }, {});

    const resultado = pedidos.map((pedido) => ({
      pedidoId: pedido.id,
      numeroPedido: pedido.numeroPedido,
      status: pedido.status,
      valorSolicitado: Number(pedido.valorSolicitado || 0),
      mutuario: pedido.mutuario,
      totalDesembolsado: desembolsosPorPedido[pedido.id] || 0,
      totalReembolsado: reembolsosPorPedido[pedido.id] || 0,
      saldo: saldosPorPedido[pedido.id] || 0,
    }));

    return res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao buscar o relatório financeiro de pedidos.",
      error: error.message,
    });
  }
}

async function getRelatorioDesembolsos(req, res) {
  try {
    const where = { empresaId: req.user.empresaId, ...buildDateRangeFilter("dataDesembolso", req.query) };

    const [desembolsos, quantidade, totalDesembolsado] = await Promise.all([
      Desembolso.findAll({
        where,
        attributes: [
          "id",
          "valorDesembolsado",
          "dataDesembolso",
          "meioPagamento",
          "numeroTransacao",
          "referencia",
        ],
        include: [
          {
            model: PedidoCredito,
            as: "pedido",
            attributes: ["id", "numeroPedido"],
            include: [
              {
                model: Mutuario,
                as: "mutuario",
                attributes: ["id", "nomeCompleto"],
              },
            ],
          },
        ],
        order: [["dataDesembolso", "DESC"]],
        // quantidade/totalDesembolsado já vêm agregados abaixo (count/sum),
        // independentes deste array, trava de segurança, não afeta os totais.
        limit: 500,
      }),
      Desembolso.count({ where }),
      Desembolso.sum("valorDesembolsado", { where }),
    ]);

    return res.status(200).json({
      quantidade: Number(quantidade || 0),
      totalDesembolsado: Number(totalDesembolsado || 0),
      desembolsos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao buscar o relatório de desembolsos.",
      error: error.message,
    });
  }
}

async function getRelatorioReembolsos(req, res) {
  try {
    const where = { empresaId: req.user.empresaId, ...buildDateRangeFilter("dataReembolso", req.query) };

    const [reembolsos, quantidade, totalReembolsado] = await Promise.all([
      // Reembolso não tem associação direta com PedidoCredito, passa por
      // Credito (Reembolso -> Credito -> PedidoCredito).
      Reembolso.findAll({
        where,
        attributes: [
          "id",
          "valorReembolsado",
          "dataReembolso",
          "meioPagamento",
          "numeroTransacao",
          "referencia",
        ],
        include: [
          {
            model: Credito,
            as: "credito",
            attributes: ["id"],
            include: [
              {
                model: PedidoCredito,
                as: "pedido",
                attributes: ["id", "numeroPedido"],
                include: [
                  {
                    model: Mutuario,
                    as: "mutuario",
                    attributes: ["id", "nomeCompleto"],
                  },
                ],
              },
            ],
          },
        ],
        order: [["dataReembolso", "DESC"]],
        // Mesma trava de getRelatorioDesembolsos, totais vêm do count/sum abaixo.
        limit: 500,
      }),
      Reembolso.count({ where }),
      Reembolso.sum("valorReembolsado", { where }),
    ]);

    // Achata credito.pedido -> pedido, para o frontend continuar a ler
    // reembolso.pedido.numeroPedido / reembolso.pedido.mutuario sem mudar nada.
    const resultado = reembolsos.map((reembolso) => {
      const item = reembolso.toJSON();
      item.pedido = item.credito?.pedido || null;
      delete item.credito;
      return item;
    });

    return res.status(200).json({
      quantidade: Number(quantidade || 0),
      totalReembolsado: Number(totalReembolsado || 0),
      reembolsos: resultado,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao buscar o relatório de reembolsos.",
      error: error.message,
    });
  }
}

module.exports = {
  dashboardFinanceiro,
  getResumoGeral,
  getRelatorioPedidos,
  getRelatorioFinanceiroPedidos,
  getRelatorioDesembolsos,
  getRelatorioReembolsos,
};
