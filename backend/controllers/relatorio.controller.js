const { Op } = require("sequelize");
const { PedidoCredito, Mutuario, Desembolso, Reembolso } = require("../models");

/*
    ==========================================================
    RESUMO GERAL DO SISTEMA
    ==========================================================
    Devolve:
    - Total de pedidos
    - Total por status
    - Total desembolsado
    - Total reembolsado
    - Saldo global
*/
async function getResumoGeral(req, res) {
  try {
    const pedidos = await PedidoCredito.findAll({
      attributes: ["id", "status"],
    });

    const desembolsos = await Desembolso.findAll({
      attributes: ["valorDesembolsado"],
    });

    const reembolsos = await Reembolso.findAll({
      attributes: ["valorReembolsado"],
    });

    const totalPedidos = pedidos.length;

    const pedidosPorStatus = pedidos.reduce((acc, pedido) => {
      const status = pedido.status || "SEM_STATUS";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const totalDesembolsado = desembolsos.reduce((acc, item) => {
      return acc + Number(item.valorDesembolsado || 0);
    }, 0);

    const totalReembolsado = reembolsos.reduce((acc, item) => {
      return acc + Number(item.valorReembolsado || 0);
    }, 0);

    const saldoGlobal = totalDesembolsado - totalReembolsado;

    return res.status(200).json({
      totalPedidos,
      pedidosPorStatus,
      totalDesembolsado,
      totalReembolsado,
      saldoGlobal,
    });
  } catch (error) {
    console.error("Erro ao obter resumo geral:", error);

    return res.status(500).json({
      message: "Erro ao obter resumo geral.",
      error: error.message,
    });
  }
}

/*
    ==========================================================
    RELATÓRIO DE PEDIDOS
    ==========================================================
    Permite filtrar por:
    - status
    - data de criação (dataInicial, dataFinal)

    Ex:
    /api/relatorios/pedidos?status=APROVADO
    /api/relatorios/pedidos?dataInicial=2024-01-01&dataFinal=2024-12-31
*/
async function getRelatorioPedidos(req, res) {
  try {
    const { status, dataInicial, dataFinal } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (dataInicial || dataFinal) {
      where.created_at = {};

      if (dataInicial) {
        where.created_at[Op.gte] = new Date(`${dataInicial}T00:00:00Z`);
      }

      if (dataFinal) {
        where.created_at[Op.lte] = new Date(`${dataFinal}T23:59:59Z`);
      }
    }

    const pedidos = await PedidoCredito.findAll({
      where,
      include: [
        {
          model: Mutuario,
          as: "mutuario",
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json(pedidos);
  } catch (error) {
    console.error("Erro ao gerar relatório de pedidos:", error);

    return res.status(500).json({
      message: "Erro interno ao gerar relatório de pedidos.",
      error: error.message,
    });
  }
}

/*
    ==========================================================
    RELATÓRIO FINANCEIRO POR PEDIDO
    ==========================================================
    Lista cada pedido com:
    - valor solicitado
    - total reembolsado
    - total desembolsado
    - saldo
*/
async function getRelatorioFinanceiroPedidos(req, res) {
  try {
    const pedidos = await PedidoCredito.findAll({
      include: [
        {
          model: Mutuario,
          as: "mutuario",
        },
        {
          model: Desembolso,
          as: "desembolsos",
          required: false,
        },
        {
          model: Reembolso,
          as: "reembolsos",
          required: false,
        },
      ],
      order: [["id", "DESC"]],
    });

    const relatorio = pedidos.map((pedido) => {
      const totalDesembolsado = pedido.desembolsos.reduce((acc, item) => {
        return acc + Number(item.valorDesembolsado || 0);
      }, 0);

      const totalReembolsado = pedido.reembolsos.reduce((acc, item) => {
        return acc + Number(item.valorReembolsado || 0);
      }, 0);

      const saldo = totalDesembolsado - totalReembolsado;

      return {
        pedidoId: pedido.id,
        numeroPedido: pedido.numeroPedido,
        status: pedido.status,
        etapaAtual: pedido.etapaAtual,
        valorSolicitado: pedido.valorSolicitado || 0,
        mutuario: pedido.mutuario
          ? {
              id: pedido.mutuario.id,
              codigoMutuario: pedido.mutuario.codigoMutuario,
              nomeCompleto: pedido.mutuario.nomeCompleto,
            }
          : null,
        totalDesembolsado,
        totalReembolsado,
        saldo,
      };
    });

    return res.status(200).json(relatorio);
  } catch (error) {
    console.error("Erro ao gerar relatório financeiro:", error);

    return res.status(500).json({
      message: "Erro interno ao gerar relatório financeiro.",
      error: error.message,
    });
  }
}

/*
    ==========================================================
    RELATÓRIO DE DESEMBOLSOS POR PERÍODO
    ==========================================================
*/
async function getRelatorioDesembolsos(req, res) {
  try {
    const { dataInicial, dataFinal } = req.query;

    const where = {};

    if (dataInicial || dataFinal) {
      where.dataDesembolso = {};

      if (dataInicial) {
        where.dataDesembolso[Op.gte] = new Date(`${dataInicial}T00:00:00Z`);
      }

      if (dataFinal) {
        where.dataDesembolso[Op.lte] = new Date(`${dataFinal}T23:59:59Z`);
      }
    }

    const desembolsos = await Desembolso.findAll({
      where,
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
      order: [["id", "DESC"]],
    });

    const total = desembolsos.reduce((acc, item) => {
      return acc + Number(item.valorDesembolsado || 0);
    }, 0);

    return res.status(200).json({
      totalDesembolsado: total,
      quantidade: desembolsos.length,
      desembolsos,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de desembolsos:", error);

    return res.status(500).json({
      message: "Erro interno ao gerar relatório de desembolsos.",
      error: error.message,
    });
  }
}

/*
    ==========================================================
    RELATÓRIO DE REEMBOLSOS POR PERÍODO
    ==========================================================
*/
async function getRelatorioReembolsos(req, res) {
  try {
    const { dataInicial, dataFinal } = req.query;

    const where = {};

    if (dataInicial || dataFinal) {
      where.dataReembolso = {};

      if (dataInicial) {
        where.dataReembolso[Op.gte] = new Date(`${dataInicial}T00:00:00Z`);
      }

      if (dataFinal) {
        where.dataReembolso[Op.lte] = new Date(`${dataFinal}T23:59:59Z`);
      }
    }

    const reembolsos = await Reembolso.findAll({
      where,
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
      order: [["id", "DESC"]],
    });

    const total = reembolsos.reduce((acc, item) => {
      return acc + Number(item.valorReembolsado || 0);
    }, 0);

    return res.status(200).json({
      totalReembolsado: total,
      quantidade: reembolsos.length,
      reembolsos,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de reembolsos:", error);

    return res.status(500).json({
      message: "Erro interno ao gerar relatório de reembolsos.",
      error: error.message,
    });
  }
}

module.exports = {
  getResumoGeral,
  getRelatorioPedidos,
  getRelatorioFinanceiroPedidos,
  getRelatorioDesembolsos,
  getRelatorioReembolsos,
};