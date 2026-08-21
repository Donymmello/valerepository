/*
  ==========================================================
  GERAÇÃO DE PDF (extrato de pedido, comprovativos)
  ==========================================================
  Usa pdfkit — gera o PDF diretamente em Node, sem depender de um browser
  (ao contrário de soluções tipo puppeteer). Mantém-se leve e fácil de
  correr dentro do container do backend.

  Cada "gerarXPdf" devolve uma Promise<Buffer>, pronta a mandar como
  resposta HTTP (res.send(buffer)) — o mesmo padrão que o excell.service.js
  já usa para os ficheiros .xlsx.
*/

const PDFDocument = require("pdfkit");

const CORES = {
  marca: "#1a237e",
  texto: "#1f1f1f",
  textoSecundario: "#666666",
  linha: "#e0e0e0",
  zebra: "#f7f7f7",
};

function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "MZN",
    minimumFractionDigits: 2,
  }).format(number);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-PT");
}

function streamToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function desenharCabecalho(doc, { empresaNome, titulo, subtitulo }) {
  doc
    .fontSize(9)
    .fillColor(CORES.textoSecundario)
    .text(empresaNome || "Vale do Zambeze", { align: "right" });

  doc.moveDown(0.5);

  doc.fontSize(18).fillColor(CORES.marca).font("Helvetica-Bold").text(titulo);
  doc.font("Helvetica");

  if (subtitulo) {
    doc.fontSize(10).fillColor(CORES.textoSecundario).text(subtitulo);
  }

  doc.fontSize(8).fillColor("#999999").text(`Gerado em ${formatDate(new Date())}`);

  doc.moveDown(1);
  doc
    .strokeColor(CORES.linha)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(1);
  doc.fillColor(CORES.texto);
}

function desenharLinhaLabelValor(doc, label, valor) {
  const startX = doc.page.margins.left;
  doc
    .fontSize(10)
    .fillColor(CORES.textoSecundario)
    .text(label, startX, doc.y, { continued: true, width: 200 });
  doc.fillColor(CORES.texto).text(valor === null || valor === undefined || valor === "" ? "-" : String(valor));
}

/*
  Tabela simples com cabeçalho e zebra, com quebra de página automática.
  colunas: [{ key, label, width, align }]
  linhas: [{ [key]: valor }]
*/
function desenharTabela(doc, { colunas, linhas }) {
  const marginLeft = doc.page.margins.left;
  const rowHeight = 22;
  let y = doc.y;

  function desenharCabecalhoTabela() {
    const largura = colunas.reduce((acc, col) => acc + col.width, 0);
    doc.rect(marginLeft, y, largura, rowHeight).fill(CORES.marca);
    let x = marginLeft;
    doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
    colunas.forEach((col) => {
      doc.text(col.label, x + 6, y + 6, { width: col.width - 12, align: col.align || "left" });
      x += col.width;
    });
    y += rowHeight;
    doc.font("Helvetica").fillColor(CORES.texto);
  }

  desenharCabecalhoTabela();

  if (!linhas.length) {
    doc.fontSize(9).fillColor(CORES.textoSecundario).text("Sem registos.", marginLeft + 6, y + 6);
    y += rowHeight;
  }

  linhas.forEach((linha, index) => {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      desenharCabecalhoTabela();
    }

    const largura = colunas.reduce((acc, col) => acc + col.width, 0);
    if (index % 2 === 1) {
      doc.rect(marginLeft, y, largura, rowHeight).fill(CORES.zebra);
    }
    doc.fillColor(CORES.texto);

    let x = marginLeft;
    doc.fontSize(9);
    colunas.forEach((col) => {
      doc.text(String(linha[col.key] ?? "-"), x + 6, y + 6, { width: col.width - 12, align: col.align || "left" });
      x += col.width;
    });
    y += rowHeight;
  });

  doc.y = y + 15;
}

/*
  Extrato do pedido — resumo + tabelas de desembolsos e reembolsos.
  Usado tanto pelo portal (meu extrato) como, se um dia fizer sentido,
  pelo backoffice — o formato dos dados de entrada é o mesmo que já é
  usado para montar o Excel (ver portalExport.controller.js).
*/
async function gerarExtratoPedidoPdf({ empresa, pedido, mutuario, desembolsos, reembolsos, totais }) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const bufferPromise = streamToBuffer(doc);

  desenharCabecalho(doc, {
    empresaNome: empresa?.nome,
    titulo: `Extrato do Pedido ${pedido?.numeroPedido || ""}`,
    subtitulo: mutuario?.nomeCompleto ? `Mutuário: ${mutuario.nomeCompleto}` : undefined,
  });

  desenharLinhaLabelValor(doc, "Valor Solicitado", formatCurrency(pedido?.valorSolicitado));
  desenharLinhaLabelValor(doc, "Finalidade", pedido?.finalidade);
  desenharLinhaLabelValor(doc, "Status", pedido?.status);
  desenharLinhaLabelValor(doc, "Total Desembolsado", formatCurrency(totais?.totalDesembolsado));
  desenharLinhaLabelValor(doc, "Total Reembolsado", formatCurrency(totais?.totalReembolsado));
  if (totais?.montanteTotal) {
    desenharLinhaLabelValor(doc, "Montante Total (capital + juros)", formatCurrency(totais.montanteTotal));
  }
  desenharLinhaLabelValor(doc, "Saldo em Dívida", formatCurrency(totais?.saldoEmDivida));

  doc.moveDown(1.5);
  doc.fontSize(12).font("Helvetica-Bold").fillColor(CORES.marca).text("Desembolsos");
  doc.font("Helvetica").fillColor(CORES.texto);
  doc.moveDown(0.5);

  desenharTabela(doc, {
    colunas: [
      { key: "data", label: "Data", width: 110 },
      { key: "valor", label: "Valor", width: 110, align: "right" },
      { key: "meio", label: "Meio", width: 110 },
      { key: "referencia", label: "Referência", width: 150 },
    ],
    linhas: (desembolsos || []).map((item) => ({
      data: formatDate(item.dataDesembolso),
      valor: formatCurrency(item.valorDesembolsado),
      meio: item.meioPagamento,
      referencia: item.referencia || "-",
    })),
  });

  doc.moveDown(1);
  doc.fontSize(12).font("Helvetica-Bold").fillColor(CORES.marca).text("Reembolsos");
  doc.font("Helvetica").fillColor(CORES.texto);
  doc.moveDown(0.5);

  desenharTabela(doc, {
    colunas: [
      { key: "data", label: "Data", width: 110 },
      { key: "valor", label: "Valor", width: 110, align: "right" },
      { key: "meio", label: "Meio", width: 110 },
      { key: "referencia", label: "Referência", width: 150 },
    ],
    linhas: (reembolsos || []).map((item) => ({
      data: formatDate(item.dataReembolso),
      valor: formatCurrency(item.valorReembolsado),
      meio: item.meioPagamento,
      referencia: item.referencia || "-",
    })),
  });

  doc.end();
  return bufferPromise;
}

/*
  Comprovativo/recibo individual de um desembolso ou reembolso.
*/
async function gerarComprovativoPdf({ empresa, tipo, transacao, pedido, mutuario }) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const bufferPromise = streamToBuffer(doc);

  const ehDesembolso = tipo === "DESEMBOLSO";
  const valor = ehDesembolso ? transacao.valorDesembolsado : transacao.valorReembolsado;
  const data = ehDesembolso ? transacao.dataDesembolso : transacao.dataReembolso;

  desenharCabecalho(doc, {
    empresaNome: empresa?.nome,
    titulo: `Comprovativo de ${ehDesembolso ? "Desembolso" : "Reembolso"}`,
    subtitulo: `Referência ${transacao.referencia || transacao.id}`,
  });

  desenharLinhaLabelValor(doc, "Pedido", pedido?.numeroPedido);
  desenharLinhaLabelValor(doc, "Mutuário", mutuario?.nomeCompleto);
  desenharLinhaLabelValor(doc, "Valor", formatCurrency(valor));
  desenharLinhaLabelValor(doc, "Data", formatDate(data));
  desenharLinhaLabelValor(doc, "Meio de Pagamento", transacao.meioPagamento);
  desenharLinhaLabelValor(doc, "Número de Transação", transacao.numeroTransacao);
  desenharLinhaLabelValor(doc, "Referência", transacao.referencia);
  if (transacao.observacoes) {
    desenharLinhaLabelValor(doc, "Observações", transacao.observacoes);
  }

  doc.moveDown(2);
  doc
    .fontSize(8)
    .fillColor("#999999")
    .text("Este documento é gerado automaticamente e serve como comprovativo da transação acima.", {
      align: "left",
    });

  doc.end();
  return bufferPromise;
}

module.exports = {
  gerarExtratoPedidoPdf,
  gerarComprovativoPdf,
  formatCurrency,
  formatDate,
};
