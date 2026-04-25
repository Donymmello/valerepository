const XLSX = require("xlsx");
const {
  PedidoCredito,
  Mutuario,
  AprovacaoPedido,
  Desembolso,
  Reembolso,
  User,
} = require("../models");

async function exportarMeusPedidos(req, res) {
  try {
    const mutuario = await Mutuario.findOne({
      where: { userId: req.user.id },
    });

    if (!mutuario) {
      return res.status(404).json({
        message: "Mutuário não encontrado.",
      });
    }

    const pedidos = await PedidoCredito.findAll({
      where: { mutuarioId: mutuario.id },
      include: [
        {
          model: Mutuario,
          as: "mutuario",
        },
      ],
      order: [["id", "DESC"]],
    });

    const dados = pedidos.map((pedido) => ({
      ID: pedido.id || "",
      NumeroPedido: pedido.numeroPedido || "",
      ValorSolicitado: pedido.valorSolicitado || "",
      Finalidade: pedido.finalidade || "",
      PacoteFinanciamento: pedido.pacoteFinanciamento || "",
      Status: pedido.status || "",
      EtapaAtual: pedido.etapaAtual || "",
      DataSubmissao: pedido.dataSubmissao
        ? new Date(pedido.dataSubmissao).toLocaleString("pt-PT")
        : "",
      PrazoAvaliacao: pedido.prazoAvaliacao
        ? new Date(pedido.prazoAvaliacao).toLocaleString("pt-PT")
        : "",
      PrazoValidacao: pedido.prazoValidacao
        ? new Date(pedido.prazoValidacao).toLocaleString("pt-PT")
        : "",
      Observacoes: pedido.observacoes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(
      dados.length ? dados : [{}]
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MeusPedidos");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=meus_pedidos_${Date.now()}.xlsx`
    );

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Erro ao exportar meus pedidos:", error);
    return res.status(500).json({
      message: "Erro interno ao exportar meus pedidos.",
      error: error.message,
    });
  }
}

async function exportarMeuExtratoPedido(req, res) {
  try {
    const { pedidoId } = req.params;

    const mutuario = await Mutuario.findOne({
      where: { userId: req.user.id },
    });

    if (!mutuario) {
      return res.status(404).json({
        message: "Mutuário não encontrado.",
      });
    }

    const pedido = await PedidoCredito.findOne({
      where: {
        id: pedidoId,
        mutuarioId: mutuario.id,
      },
      include: [
        {
          model: Mutuario,
          as: "mutuario",
        },
        {
          model: AprovacaoPedido,
          as: "aprovacoes",
          required: false,
          include: [
            {
              model: User,
              as: "aprovador",
              attributes: ["id", "nome", "email", "role"],
            },
          ],
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
    });

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido não encontrado.",
      });
    }

    const totalDesembolsado = (pedido.desembolsos || []).reduce(
      (acc, item) => acc + Number(item.valorDesembolsado || 0),
      0
    );

    const totalReembolsado = (pedido.reembolsos || []).reduce(
      (acc, item) => acc + Number(item.valorReembolsado || 0),
      0
    );

    const saldoEmDivida = totalDesembolsado - totalReembolsado;

    const workbook = XLSX.utils.book_new();

    const resumoSheet = XLSX.utils.json_to_sheet([
      {
        NumeroPedido: pedido.numeroPedido || "",
        Mutuario: pedido.mutuario?.nomeCompleto || "",
        ValorSolicitado: pedido.valorSolicitado || "",
        Finalidade: pedido.finalidade || "",
        Status: pedido.status || "",
        EtapaAtual: pedido.etapaAtual || "",
        TotalDesembolsado: totalDesembolsado,
        TotalReembolsado: totalReembolsado,
        SaldoEmDivida: saldoEmDivida,
      },
    ]);

    const desembolsosSheet = XLSX.utils.json_to_sheet(
      (pedido.desembolsos || []).map((item) => ({
        ID: item.id || "",
        ValorDesembolsado: item.valorDesembolsado || "",
        DataDesembolso: item.dataDesembolso
          ? new Date(item.dataDesembolso).toLocaleString("pt-PT")
          : "",
        MeioPagamento: item.meioPagamento || "",
        NumeroTransacao: item.numeroTransacao || "",
        Referencia: item.referencia || "",
        Observacoes: item.observacoes || "",
      })) || [{}]
    );

    const reembolsosSheet = XLSX.utils.json_to_sheet(
      (pedido.reembolsos || []).map((item) => ({
        ID: item.id || "",
        ValorReembolsado: item.valorReembolsado || "",
        DataReembolso: item.dataReembolso
          ? new Date(item.dataReembolso).toLocaleString("pt-PT")
          : "",
        MeioPagamento: item.meioPagamento || "",
        NumeroTransacao: item.numeroTransacao || "",
        Referencia: item.referencia || "",
        Observacoes: item.observacoes || "",
      })) || [{}]
    );

    XLSX.utils.book_append_sheet(workbook, resumoSheet, "Resumo");
    XLSX.utils.book_append_sheet(workbook, desembolsosSheet, "Desembolsos");
    XLSX.utils.book_append_sheet(workbook, reembolsosSheet, "Reembolsos");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=extrato_pedido_${pedido.numeroPedido || pedido.id}.xlsx`
    );

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Erro ao exportar extrato do pedido:", error);
    return res.status(500).json({
      message: "Erro interno ao exportar extrato do pedido.",
      error: error.message,
    });
  }
}

module.exports = {
  exportarMeusPedidos,
  exportarMeuExtratoPedido,
};