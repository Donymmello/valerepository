const XLSX = require("xlsx");
const {
  PedidoCredito,
  Mutuario,
  AprovacaoPedido,
  Desembolso,
  Reembolso,
  Credito,
  Empresa,
  User,
} = require("../models");
const { gerarExtratoPedidoPdf, gerarComprovativoPdf } = require("../services/pdfExport.service");

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

/*
  Busca partilhada entre a exportação em Excel e em PDF do extrato de um
  pedido — ambas precisam exatamente dos mesmos dados, só divergem na
  serialização final. Devolve { erro } se algo não for encontrado, para o
  chamador decidir a resposta HTTP.
*/
async function buscarExtratoPedido(req) {
  const { pedidoId } = req.params;

  const mutuario = await Mutuario.findOne({
    where: { userId: req.user.id },
  });

  if (!mutuario) {
    return { erro: "Mutuário não encontrado." };
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
        model: Credito,
        as: "creditos",
        required: false,
      },
    ],
  });

  if (!pedido) {
    return { erro: "Pedido não encontrado." };
  }

  // Reembolso não tem associação direta com PedidoCredito — relaciona-se
  // através de Credito (Reembolso -> Credito -> PedidoCredito), tal como
  // corrigido em relatorio.controller.js. Por isso é uma query à parte,
  // em vez de um include direto no PedidoCredito.findOne acima.
  const reembolsos = await Reembolso.findAll({
    include: [
      {
        model: Credito,
        as: "credito",
        attributes: [],
        where: { pedidoId: pedido.id },
        required: true,
      },
    ],
  });

  const num = (v) => Number(v || 0);
  const creditos = pedido.creditos || [];

  const totalDesembolsado = (pedido.desembolsos || []).reduce(
    (acc, item) => acc + num(item.valorDesembolsado),
    0
  );

  const totalReembolsado = reembolsos.reduce(
    (acc, item) => acc + num(item.valorReembolsado),
    0
  );

  // O montante total a pagar (capital + juros) só existe depois do
  // desembolso, quando o Crédito é criado a partir de pedido.montanteTotal
  // (ver credito.service.js). Antes disso não há juros a mostrar.
  const montanteTotal = creditos.reduce((acc, c) => acc + num(c.montanteTotal), 0);

  // Saldo em dívida real vem do saldoAtual do crédito (que já desconta os
  // reembolsos de capital + juros); sem crédito ainda, cai para o
  // desembolsado menos reembolsado (só há capital em jogo nessa fase).
  const saldoEmDivida = creditos.length
    ? creditos.reduce((acc, c) => acc + num(c.saldoAtual), 0)
    : totalDesembolsado - totalReembolsado;

  return {
    mutuario,
    pedido,
    reembolsos,
    totalDesembolsado,
    totalReembolsado,
    montanteTotal,
    saldoEmDivida,
  };
}

async function exportarMeuExtratoPedido(req, res) {
  try {
    const resultado = await buscarExtratoPedido(req);
    if (resultado.erro) {
      return res.status(404).json({ message: resultado.erro });
    }

    const { pedido, reembolsos, totalDesembolsado, totalReembolsado, montanteTotal, saldoEmDivida } = resultado;

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
        MontanteTotal: montanteTotal,
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
      (reembolsos || []).map((item) => ({
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

async function exportarMeuExtratoPedidoPdf(req, res) {
  try {
    const resultado = await buscarExtratoPedido(req);
    if (resultado.erro) {
      return res.status(404).json({ message: resultado.erro });
    }

    const { mutuario, pedido, reembolsos, totalDesembolsado, totalReembolsado, montanteTotal, saldoEmDivida } = resultado;

    const empresa = await buscarEmpresaDoUser(req);

    const buffer = await gerarExtratoPedidoPdf({
      empresa,
      pedido,
      mutuario,
      desembolsos: pedido.desembolsos,
      reembolsos,
      totais: { totalDesembolsado, totalReembolsado, montanteTotal, saldoEmDivida },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=extrato_pedido_${pedido.numeroPedido || pedido.id}.pdf`
    );

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Erro ao exportar extrato do pedido em PDF:", error);
    return res.status(500).json({
      message: "Erro interno ao exportar extrato do pedido em PDF.",
      error: error.message,
    });
  }
}

/*
  Busca a empresa do utilizador autenticado, para o cabeçalho/marca do
  PDF (mesma lógica de branding usada em services/notificacaoExterna.service.js).
*/
async function buscarEmpresaDoUser(req) {
  if (!req.user.empresaId) return null;
  return Empresa.findByPk(req.user.empresaId, { attributes: ["nome"] });
}

async function exportarComprovativoDesembolsoPdf(req, res) {
  try {
    const { desembolsoId } = req.params;

    const mutuario = await Mutuario.findOne({ where: { userId: req.user.id } });
    if (!mutuario) {
      return res.status(404).json({ message: "Mutuário não encontrado." });
    }

    const desembolso = await Desembolso.findOne({
      where: { id: desembolsoId },
      include: [
        {
          model: PedidoCredito,
          as: "pedido",
          where: { mutuarioId: mutuario.id },
          required: true,
        },
      ],
    });

    if (!desembolso) {
      return res.status(404).json({ message: "Comprovativo não encontrado." });
    }

    const empresa = await buscarEmpresaDoUser(req);

    const buffer = await gerarComprovativoPdf({
      empresa,
      tipo: "DESEMBOLSO",
      transacao: desembolso,
      pedido: desembolso.pedido,
      mutuario,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=comprovativo_desembolso_${desembolso.referencia || desembolso.id}.pdf`
    );
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Erro ao exportar comprovativo de desembolso:", error);
    return res.status(500).json({
      message: "Erro interno ao exportar comprovativo de desembolso.",
      error: error.message,
    });
  }
}

async function exportarComprovativoReembolsoPdf(req, res) {
  try {
    const { reembolsoId } = req.params;

    const mutuario = await Mutuario.findOne({ where: { userId: req.user.id } });
    if (!mutuario) {
      return res.status(404).json({ message: "Mutuário não encontrado." });
    }

    // Reembolso -> Credito -> PedidoCredito (mesma cadeia usada em
    // buscarExtratoPedido) — não há atalho direto para o pedido.
    const reembolso = await Reembolso.findOne({
      where: { id: reembolsoId },
      include: [
        {
          model: Credito,
          as: "credito",
          required: true,
          include: [
            {
              model: PedidoCredito,
              as: "pedido",
              where: { mutuarioId: mutuario.id },
              required: true,
            },
          ],
        },
      ],
    });

    if (!reembolso) {
      return res.status(404).json({ message: "Comprovativo não encontrado." });
    }

    const empresa = await buscarEmpresaDoUser(req);

    const buffer = await gerarComprovativoPdf({
      empresa,
      tipo: "REEMBOLSO",
      transacao: reembolso,
      pedido: reembolso.credito?.pedido,
      mutuario,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=comprovativo_reembolso_${reembolso.referencia || reembolso.id}.pdf`
    );
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Erro ao exportar comprovativo de reembolso:", error);
    return res.status(500).json({
      message: "Erro interno ao exportar comprovativo de reembolso.",
      error: error.message,
    });
  }
}

module.exports = {
  exportarMeusPedidos,
  exportarMeuExtratoPedido,
  exportarMeuExtratoPedidoPdf,
  exportarComprovativoDesembolsoPdf,
  exportarComprovativoReembolsoPdf,
};