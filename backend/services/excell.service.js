const XLSX = require("xlsx");
const { Mutuario, PedidoCredito, Desembolso, Reembolso, Credito, sequelize } = require("../models");
const { obterEmpresaCacheada } = require("../utils/empresaCache");
const calcularPrestacao = require("../utils/calCredito");
const { generateReferencia } = require("../utils/generateCode");
const creditoService = require("./credito.service");

// Mesmo gerador usado em pedidoCredito.controller.js/portalMutuario.controller.js
// (não está centralizado num util partilhado, replicado aqui de propósito,
// como nos outros dois sítios, para não criar acoplamento novo por uma função
// de 3 linhas).
function generateNumeroPedido() {
  const now = new Date();
  const format = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `PED-${format}-${Math.floor(100000 + Math.random() * 900000)}`;
}

/*
  ===========================================================
  * Service responsável por gerar ficheiro Excel de mutuários
  ===========================================================
*/
async function gerarExcellMutuarios(empresaId) {
  /*
    Busca todos os mutuários
  */
  const mutuarios = await Mutuario.findAll({
    where: { empresaId },
    order: [["id", "DESC"]],
  });

  /*
    Converte os dados para um formato amigável ao Excel
    Cada objeto representa uma linha da planilha
  */
  const dadosFormatados = mutuarios.map((mutuario) => ({
    ID: mutuario.id || "",
    CodigoMutuario: mutuario.codigoMutuario || "",
    NomeCompleto: mutuario.nomeCompleto || "",
    DocumentoTipo: mutuario.documentoTipo || "",
    DocumentoNumero: mutuario.documentoNumero || "",
    DataNascimento: mutuario.dataNascimento || "",
    Provincia: mutuario.provincia || "",
    Distrito: mutuario.distrito || "",
    LocalResidencia: mutuario.localResidencia || "",
    Telefone: mutuario.telefone || "",
    Email: mutuario.email || "",
    UserId: mutuario.userId || "",
    DataCriacao: mutuario.created_at
      ? new Date(mutuario.created_at).toLocaleString("pt-PT")
      : "",
    DataAtualizacao: mutuario.updated_at
      ? new Date(mutuario.updated_at).toLocaleString("pt-PT")
      : "",
  }));

  /*
    Mesmo que não existam registos, criaremos uma planilha
    com os cabeçalhos
  */
  const dadosParaPlanilha =
    dadosFormatados.length > 0
      ? dadosFormatados
      : [
          {
            ID: "",
            CodigoMutuario: "",
            NomeCompleto: "",
            DocumentoTipo: "",
            DocumentoNumero: "",
            DataNascimento: "",
            Provincia: "",
            Distrito: "",
            LocalResidencia: "",
            Telefone: "",
            Email: "",
            UserId: "",
            DataCriacao: "",
            DataAtualizacao: "",
          },
        ];

  /*
    Cria a folha da planilha
  */
  const worksheet = XLSX.utils.json_to_sheet(dadosParaPlanilha);

  /*
    Ajusta a largura das colunas para melhorar a leitura
  */
  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 18 },
    { wch: 30 },
    { wch: 10 },
    { wch: 22 },
    { wch: 22 },
  ];

  /*
    Cria o workbook principal
  */
  const workbook = XLSX.utils.book_new();

  /*
    Adiciona a worksheet ao workbook
  */
  XLSX.utils.book_append_sheet(workbook, worksheet, "Mutuarios");

  /*
    Gera o ficheiro em memória no formato buffer
  */
  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  /*
    Nome do ficheiro que será descarregado
  */
  const fileName = `mutuarios_${Date.now()}.xlsx`;

  return {
    buffer,
    fileName,
  };
}

/*
  ===========================================================
  * Service responsável por gerar ficheiro Excel de pedidos
  ===========================================================
*/
async function gerarExcellPedidos(empresaId) {
  /*
    Busca todos os pedidos com dados do mutuário e criador
  */
  const pedidos = await PedidoCredito.findAll({
    where: { empresaId },
    include: [
      {
        association: "mutuario",
      },
      {
        association: "criador",
      },
    ],
    order: [["id", "DESC"]],
  });

  /*
    Converte os dados para um formato amigável ao Excel
    Cada objeto representa uma linha da planilha
  */
  const dadosFormatados = pedidos.map((pedido) => ({
    ID: pedido.id || "",
    NumeroPedido: pedido.numeroPedido || "",
    CodigoMutuario: pedido.mutuario?.codigoMutuario || "",
    NomeMutuario: pedido.mutuario?.nomeCompleto || "",
    ValorSolicitado: pedido.valorSolicitado || "",
    Prazo: pedido.prazo || "",
    Finalidade: pedido.finalidade || "",
    PacoteFinanciamento: pedido.pacoteFinanciamento || "",
    Status: pedido.status || "",
    EtapaAtual: pedido.etapaAtual || "",
    Taxa: pedido.taxa || "",
    Prestacao: pedido.prestacao || "",
    JurosTotal: pedido.jurosTotal || "",
    MontanteTotal: pedido.montanteTotal || "",
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

    /*
      Aqui tentamos mostrar algo mais legível do criador.
      Como ainda não vimos o user.model, mantemos fallback seguro.
    */
    CriadoPorId: pedido.createdBy || "",
    CriadoPorNome:
      pedido.criador?.nome ||
      pedido.criador?.nomeCompleto ||
      pedido.criador?.username ||
      "",
    CriadoPorEmail: pedido.criador?.email || "",

    DataCriacao: pedido.created_at
      ? new Date(pedido.created_at).toLocaleString("pt-PT")
      : "",
    DataAtualizacao: pedido.updated_at
      ? new Date(pedido.updated_at).toLocaleString("pt-PT")
      : "",
  }));

  /*
    Mesmo que não existam registos, criaremos uma planilha
    com os cabeçalhos
  */
  const dadosParaPlanilha =
    dadosFormatados.length > 0
      ? dadosFormatados
      : [
          {
            ID: "",
            NumeroPedido: "",
            CodigoMutuario: "",
            NomeMutuario: "",
            ValorSolicitado: "",
            Prazo: "",
            Finalidade: "",
            PacoteFinanciamento: "",
            Status: "",
            EtapaAtual: "",
            Taxa: "",
            Prestacao: "",
            JurosTotal: "",
            MontanteTotal: "",
            DataSubmissao: "",
            PrazoAvaliacao: "",
            PrazoValidacao: "",
            Observacoes: "",
            CriadoPorId: "",
            CriadoPorNome: "",
            CriadoPorEmail: "",
            DataCriacao: "",
            DataAtualizacao: "",
          },
        ];

  const worksheet = XLSX.utils.json_to_sheet(dadosParaPlanilha);

  worksheet["!cols"] = [
    { wch: 8 },  // ID
    { wch: 18 }, // NumeroPedido
    { wch: 18 }, // CodigoMutuario
    { wch: 30 }, // NomeMutuario
    { wch: 18 }, // ValorSolicitado
    { wch: 10 }, // Prazo
    { wch: 35 }, // Finalidade
    { wch: 22 }, // PacoteFinanciamento
    { wch: 18 }, // Status
    { wch: 12 }, // EtapaAtual
    { wch: 10 }, // Taxa
    { wch: 14 }, // Prestacao
    { wch: 14 }, // JurosTotal
    { wch: 16 }, // MontanteTotal
    { wch: 22 }, // DataSubmissao
    { wch: 22 }, // PrazoAvaliacao
    { wch: 22 }, // PrazoValidacao
    { wch: 35 }, // Observacoes
    { wch: 12 }, // CriadoPorId
    { wch: 25 }, // CriadoPorNome
    { wch: 30 }, // CriadoPorEmail
    { wch: 22 }, // DataCriacao
    { wch: 22 }, // DataAtualizacao
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  const fileName = `pedidos_credito_${Date.now()}.xlsx`;

  return {
    buffer,
    fileName,
  };
}

/*
  ===========================================================
  * Service responsável por gerar ficheiro Excel de desembolsos
  ===========================================================
*/
async function gerarExcellDesembolsos(empresaId) {
  const desembolsos = await Desembolso.findAll({
    where: { empresaId },
    include: [
      {
        association: "pedido",
        include: [
          {
            association: "mutuario",
          },
        ],
      },
      {
        association: "criador",
      },
    ],
    order: [["id", "DESC"]],
  });

  const dadosFormatados = desembolsos.map((desembolso) => ({
    ID: desembolso.id || "",
    PedidoId: desembolso.pedidoId || "",
    NumeroPedido: desembolso.pedido?.numeroPedido || "",
    CodigoMutuario: desembolso.pedido?.mutuario?.codigoMutuario || "",
    NomeMutuario: desembolso.pedido?.mutuario?.nomeCompleto || "",
    ValorDesembolsado: desembolso.valorDesembolsado || "",
    DataDesembolso: desembolso.dataDesembolso
      ? new Date(desembolso.dataDesembolso).toLocaleString("pt-PT")
      : "",
    MeioPagamento: desembolso.meioPagamento || "",
    NumeroTransacao: desembolso.numeroTransacao || "",
    Referencia: desembolso.referencia || "",
    Observacoes: desembolso.observacoes || "",
    CriadoPorId: desembolso.createdBy || "",
    CriadoPorNome:
      desembolso.criador?.nome ||
      desembolso.criador?.nomeCompleto ||
      desembolso.criador?.username ||
      "",
    CriadoPorEmail: desembolso.criador?.email || "",
    DataCriacao: desembolso.created_at
      ? new Date(desembolso.created_at).toLocaleString("pt-PT")
      : "",
  }));

  const dadosParaPlanilha =
    dadosFormatados.length > 0
      ? dadosFormatados
      : [
          {
            ID: "",
            PedidoId: "",
            NumeroPedido: "",
            CodigoMutuario: "",
            NomeMutuario: "",
            ValorDesembolsado: "",
            DataDesembolso: "",
            MeioPagamento: "",
            NumeroTransacao: "",
            Referencia: "",
            Observacoes: "",
            CriadoPorId: "",
            CriadoPorNome: "",
            CriadoPorEmail: "",
            DataCriacao: "",
          },
        ];

  const worksheet = XLSX.utils.json_to_sheet(dadosParaPlanilha);

  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 35 },
    { wch: 12 },
    { wch: 25 },
    { wch: 30 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Desembolsos");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  const fileName = `desembolsos_${Date.now()}.xlsx`;

  return {
    buffer,
    fileName,
  };
}

/*
  ===========================================================
  * Service responsável por gerar ficheiro Excel de reembolsos
  ===========================================================
*/
async function gerarExcellReembolsos(empresaId) {
  const reembolsos = await Reembolso.findAll({
    where: { empresaId },
    include: [
      {
        association: "pedido",
        include: [
          {
            association: "mutuario",
          },
        ],
      },
      {
        association: "criador",
      },
    ],
    order: [["id", "DESC"]],
  });

  const dadosFormatados = reembolsos.map((reembolso) => ({
    ID: reembolso.id || "",
    PedidoId: reembolso.pedidoId || "",
    NumeroPedido: reembolso.pedido?.numeroPedido || "",
    CodigoMutuario: reembolso.pedido?.mutuario?.codigoMutuario || "",
    NomeMutuario: reembolso.pedido?.mutuario?.nomeCompleto || "",
    ValorReembolsado: reembolso.valorReembolsado || "",
    DataReembolso: reembolso.dataReembolso
      ? new Date(reembolso.dataReembolso).toLocaleString("pt-PT")
      : "",
    MeioPagamento: reembolso.meioPagamento || "",
    Referencia: reembolso.referencia || "",
    NumeroTransacao: reembolso.numeroTransacao || "",
    Observacoes: reembolso.observacoes || "",
    CriadoPorId: reembolso.createdBy || "",
    CriadoPorNome:
      reembolso.criador?.nome ||
      reembolso.criador?.nomeCompleto ||
      reembolso.criador?.username ||
      "",
    CriadoPorEmail: reembolso.criador?.email || "",
    DataCriacao: reembolso.created_at
      ? new Date(reembolso.created_at).toLocaleString("pt-PT")
      : "",
  }));

  const dadosParaPlanilha =
    dadosFormatados.length > 0
      ? dadosFormatados
      : [
          {
            ID: "",
            PedidoId: "",
            NumeroPedido: "",
            CodigoMutuario: "",
            NomeMutuario: "",
            ValorReembolsado: "",
            DataReembolso: "",
            MeioPagamento: "",
            NumeroTransacao: "",
            Referencia: "",
            Observacoes: "",
            CriadoPorId: "",
            CriadoPorNome: "",
            CriadoPorEmail: "",
            DataCriacao: "",
          },
        ];

  const worksheet = XLSX.utils.json_to_sheet(dadosParaPlanilha);

  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 35 },
    { wch: 12 },
    { wch: 25 },
    { wch: 30 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reembolsos");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  const fileName = `reembolsos_${Date.now()}.xlsx`;

  return {
    buffer,
    fileName,
  };
}

/*
  ===========================================================
  * Service responsável por gerar ficheiro Excel de relatório
  * financeiro dos pedidos
  ===========================================================
*/
async function gerarExcellRelatorioFinanceiro(empresaId) {
  /*
    Busca todos os pedidos com os relacionamentos necessários
  */
  const pedidos = await PedidoCredito.findAll({
    where: { empresaId },
    include: [
      {
        association: "mutuario",
      },
      {
        association: "desembolsos",
      },
      {
        // Reembolso não tem associação direta com PedidoCredito, só existe
        // via Credito (Reembolso -> Credito -> PedidoCredito). Um include
        // direto de "reembolsos" aqui dava SequelizeEagerLoadingError (mesmo
        // bug corrigido em relatorio.controller.js e portalExport.controller.js).
        association: "creditos",
        include: [{ association: "reembolsos" }],
      },
    ],
    order: [["id", "DESC"]],
  });

  /*
    Monta os dados do relatório
  */
  const dadosFormatados = pedidos.map((pedido) => {
    const creditos = pedido.creditos || [];
    const reembolsosDoPedido = creditos.flatMap((credito) => credito.reembolsos || []);

    /*
      Soma o total desembolsado do pedido
    */
    const totalDesembolsado = (pedido.desembolsos || []).reduce(
      (total, desembolso) =>
        total + Number(desembolso.valorDesembolsado || 0),
      0
    );

    /*
      Soma o total reembolsado do pedido
    */
    const totalReembolsado = reembolsosDoPedido.reduce(
      (total, reembolso) =>
        total + Number(reembolso.valorReembolsado || 0),
      0
    );

    /*
      Montante total a pagar (capital + juros), vem do Crédito, criado a
      partir de pedido.montanteTotal no desembolso (ver credito.service.js).
    */
    const montanteTotal = creditos.reduce(
      (total, credito) => total + Number(credito.montanteTotal || 0),
      0
    );

    /*
      Calcula o saldo em aberto a partir do saldoAtual do crédito (já
      desconta capital + juros pagos). Sem crédito ainda (pedido não
      desembolsado), só há capital em jogo, daí o fallback.
    */
    const saldoEmAberto = creditos.length
      ? creditos.reduce((total, credito) => total + Number(credito.saldoAtual || 0), 0)
      : totalDesembolsado - totalReembolsado;

    /*
      Quantidade de movimentos financeiros
    */
    const quantidadeDesembolsos = (pedido.desembolsos || []).length;
    const quantidadeReembolsos = reembolsosDoPedido.length;

    return {
      ID: pedido.id || "",
      NumeroPedido: pedido.numeroPedido || "",
      CodigoMutuario: pedido.mutuario?.codigoMutuario || "",
      NomeMutuario: pedido.mutuario?.nomeCompleto || "",
      ValorSolicitado: Number(pedido.valorSolicitado || 0),
      TotalDesembolsado: totalDesembolsado,
      TotalReembolsado: totalReembolsado,
      MontanteTotal: montanteTotal,
      SaldoEmAberto: saldoEmAberto,
      QuantidadeDesembolsos: quantidadeDesembolsos,
      QuantidadeReembolsos: quantidadeReembolsos,
      Status: pedido.status || "",
      EtapaAtual: pedido.etapaAtual || "",
      PacoteFinanciamento: pedido.pacoteFinanciamento || "",
      Finalidade: pedido.finalidade || "",
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
      DataCriacao: pedido.created_at
        ? new Date(pedido.created_at).toLocaleString("pt-PT")
        : "",
      DataAtualizacao: pedido.updated_at
        ? new Date(pedido.updated_at).toLocaleString("pt-PT")
        : "",
    };
  });

  /*
    Caso não existam pedidos, cria a planilha com cabeçalhos
  */
  const dadosParaPlanilha =
    dadosFormatados.length > 0
      ? dadosFormatados
      : [
          {
            ID: "",
            NumeroPedido: "",
            CodigoMutuario: "",
            NomeMutuario: "",
            ValorSolicitado: "",
            TotalDesembolsado: "",
            TotalReembolsado: "",
            MontanteTotal: "",
            SaldoEmAberto: "",
            QuantidadeDesembolsos: "",
            QuantidadeReembolsos: "",
            Status: "",
            EtapaAtual: "",
            PacoteFinanciamento: "",
            Finalidade: "",
            DataSubmissao: "",
            PrazoAvaliacao: "",
            PrazoValidacao: "",
            Observacoes: "",
            DataCriacao: "",
            DataAtualizacao: "",
          },
        ];

  /*
    Cria a worksheet
  */
  const worksheet = XLSX.utils.json_to_sheet(dadosParaPlanilha);

  /*
    Ajusta a largura das colunas para melhor leitura
  */
  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 22 },
    { wch: 35 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 35 },
    { wch: 22 },
    { wch: 22 },
  ];

  /*
    Cria o workbook principal
  */
  const workbook = XLSX.utils.book_new();

  /*
    Adiciona a worksheet ao workbook
  */
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "RelatorioFinanceiro"
  );

  /*
    Gera o ficheiro Excel em memória
  */
  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  /*
    Define o nome do ficheiro
  */
  const fileName = `relatorio_financeiro_${Date.now()}.xlsx`;

  return {
    buffer,
    fileName,
  };
}

/*
  ===========================================================
  * Service responsável por importar mutuários via Excel
  ===========================================================
*/
async function importarExcellMutuarios({ fileBuffer, userId, empresaId }) {
  /*
    Lê o ficheiro Excel em memória
  */
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });

  /*
    Obtém o nome da primeira folha
  */
  const primeiraFolha = workbook.SheetNames[0];

  if (!primeiraFolha) {
    throw new Error("O ficheiro Excel não possui folhas válidas.");
  }

  /*
    Obtém a worksheet da primeira folha
  */
  const worksheet = workbook.Sheets[primeiraFolha];

  /*
    Converte a worksheet para JSON
    defval: "" evita valores undefined
  */
  const linhas = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
  });

  /*
    Se não houver linhas, retorna erro amigável
  */
  if (!linhas.length) {
    return {
      totalLidos: 0,
      totalImportados: 0,
      totalErros: 0,
      erros: [],
      importados: [],
    };
  }

  /*
    Estruturas de controlo do processo
  */
  const erros = [];
  const importados = [];
  const paraCriar = [];

  /*
    Antes tínhamos um findOne por linha (2 queries × N linhas) só para
    checar duplicados, para um ficheiro de 1000 linhas, 2000 round-trips
    sequenciais à BD. Uma única query aqui carrega os códigos/documentos
    já existentes desta empresa para memória (Set), e vamos atualizando
    esse Set à medida que aceitamos linhas, para apanhar duplicados
    dentro do próprio ficheiro também (o findOne por linha apanhava isso
    de rebate, por correr sequencialmente depois de cada create).
  */
  const mutuariosExistentes = await Mutuario.findAll({
    where: { empresaId },
    attributes: ["codigoMutuario", "documentoNumero"],
    raw: true,
  });
  const codigosVistos = new Set(mutuariosExistentes.map((m) => m.codigoMutuario));
  const documentosVistos = new Set(
    mutuariosExistentes.filter((m) => m.documentoNumero).map((m) => m.documentoNumero)
  );

  /*
    Processa linha por linha
  */
  for (let index = 0; index < linhas.length; index++) {
    const linha = linhas[index];
    const numeroLinha = index + 2;

    /*
      Aceitamos colunas com os nomes do nosso export
      ou nomes parecidos para facilitar importação manual
    */
    const codigoMutuario =
      String(
        linha.CodigoMutuario ||
        linha.codigoMutuario ||
        linha.codigo_mutuario ||
        ""
      ).trim();

    const nomeCompleto =
      String(
        linha.NomeCompleto ||
        linha.nomeCompleto ||
        linha.nome_completo ||
        ""
      ).trim();

    const documentoTipo =
      String(
        linha.DocumentoTipo ||
        linha.documentoTipo ||
        linha.documento_tipo ||
        ""
      ).trim();

    const documentoNumero =
      String(
        linha.DocumentoNumero ||
        linha.documentoNumero ||
        linha.documento_numero ||
        ""
      ).trim();

    const dataNascimento =
      String(
        linha.DataNascimento ||
        linha.dataNascimento ||
        linha.data_nascimento ||
        ""
      ).trim();

    const provincia =
      String(
        linha.Provincia ||
        linha.provincia ||
        ""
      ).trim();

    const distrito =
      String(
        linha.Distrito ||
        linha.distrito ||
        ""
      ).trim();

    const localResidencia =
      String(
        linha.LocalResidencia ||
        linha.localResidencia ||
        linha.local_residencia ||
        ""
      ).trim();

    const telefone =
      String(
        linha.Telefone ||
        linha.telefone ||
        ""
      ).trim();

    const email =
      String(
        linha.Email ||
        linha.email ||
        ""
      ).trim();

    /*
      Validações obrigatórias
    */
    if (!codigoMutuario) {
      erros.push({
        linha: numeroLinha,
        erro: "CodigoMutuario é obrigatório."
      });
      continue;
    }

    if (!nomeCompleto) {
      erros.push({
        linha: numeroLinha,
        erro: "NomeCompleto é obrigatório."
      });
      continue;
    }

    /*
      Validação simples de email, se preenchido
    */
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      erros.push({
        linha: numeroLinha,
        erro: "Email inválido."
      });
      continue;
    }

    /*
      Verifica duplicado por código de mutuário, só dentro da mesma
      empresa (tenant). O código só precisa de ser único por empresa,
      não em toda a plataforma (ver migration
      20260824130000-tenant-scope-unique-codes.js). Contra o Set em
      memória, não contra a BD.
    */
    if (codigosVistos.has(codigoMutuario)) {
      erros.push({
        linha: numeroLinha,
        erro: `CodigoMutuario '${codigoMutuario}' já existe.`
      });
      continue;
    }

    /*
      Verifica duplicado por documento, quando existir, também
      isolado por empresa. Um mesmo BI pode legitimamente ser cliente
      de duas empresas de crédito diferentes.
    */
    if (documentoNumero && documentosVistos.has(documentoNumero)) {
      erros.push({
        linha: numeroLinha,
        erro: `DocumentoNumero '${documentoNumero}' já existe.`
      });
      continue;
    }

    /*
      Marca como visto já aqui (não só depois do bulkCreate) para
      apanhar duplicados entre linhas do mesmo ficheiro.
    */
    codigosVistos.add(codigoMutuario);
    if (documentoNumero) documentosVistos.add(documentoNumero);

    /*
      Monta os dados para criação
      userId do mutuário é opcional no teu model,
      então por agora não vamos forçar esse campo
    */
    paraCriar.push({
      linha: numeroLinha,
      dados: {
        codigoMutuario,
        empresaId,
        nomeCompleto,
        documentoTipo: documentoTipo || null,
        documentoNumero: documentoNumero || null,
        dataNascimento: dataNascimento || null,
        provincia: provincia || null,
        distrito: distrito || null,
        localResidencia: localResidencia || null,
        telefone: telefone || null,
        email: email || null,
        userId: null,
      },
    });
  }

  /*
    Cria todos os mutuários válidos numa única query (bulkCreate) em vez
    de um INSERT por linha, para 1000 linhas válidas, 1 round-trip em
    vez de 1000. `returning: true` é necessário no Postgres para os IDs
    gerados virem de volta nas instâncias.
  */
  if (paraCriar.length) {
    const novosMutuarios = await Mutuario.bulkCreate(
      paraCriar.map((item) => item.dados),
      { returning: true }
    );

    novosMutuarios.forEach((novoMutuario) => {
      importados.push({
        id: novoMutuario.id,
        codigoMutuario: novoMutuario.codigoMutuario,
        nomeCompleto: novoMutuario.nomeCompleto,
      });
    });
  }

  /*
    Devolve o resumo final da importação
  */
  return {
    totalLidos: linhas.length,
    totalImportados: importados.length,
    totalErros: erros.length,
    erros,
    importados,
  };
}

/*
  ===========================================================
  * Service responsável por importar pedidos via Excel
  ===========================================================
*/
async function importarExcellPedidos({ fileBuffer, userId, empresaId }) {
  /*
    Lê o ficheiro Excel em memória
  */
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });

  /*
    Obtém a primeira folha
  */
  const primeiraFolha = workbook.SheetNames[0];

  if (!primeiraFolha) {
    throw new Error("O ficheiro Excel não possui folhas válidas.");
  }

  /*
    Obtém a worksheet
  */
  const worksheet = workbook.Sheets[primeiraFolha];

  /*
    Converte a worksheet para JSON
  */
  const linhas = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
  });

  if (!linhas.length) {
    return {
      totalLidos: 0,
      totalImportados: 0,
      totalErros: 0,
      erros: [],
      importados: [],
    };
  }

  const erros = [];
  const importados = [];
  const paraCriar = [];

  /*
    A taxa é obrigatória no modelo (allowNull: false). Se a planilha não
    trouxer uma taxa explícita por linha (ex: importação de pedidos ainda
    não aprovados), usamos a taxa mínima da empresa como estimativa,
    o mesmo critério usado em pedidoCredito.controller.js e
    portalMutuario.controller.js. Buscamos a empresa uma única vez, fora
    do loop, para não repetir a query por linha.
  */
  const empresa = await obterEmpresaCacheada(empresaId);
  const taxaMin = Number(empresa?.taxaJurosMin ?? 0);
  const taxaMax = Number(empresa?.taxaJurosMax ?? 100);
  const taxaEstimativaPadrao = Number(empresa?.taxaJurosMin ?? 18);

  /*
    Antes: 2 findOne por linha (numeroPedido duplicado + mutuário pelo
    código), para 1000 linhas, 2000 round-trips sequenciais. Carrega os
    dois conjuntos de uma vez, fora do loop.
  */
  const [pedidosExistentes, mutuariosDaEmpresa] = await Promise.all([
    PedidoCredito.findAll({ where: { empresaId }, attributes: ["numeroPedido"], raw: true }),
    Mutuario.findAll({
      where: { empresaId },
      attributes: ["id", "codigoMutuario", "nomeCompleto"],
      raw: true,
    }),
  ]);
  const numerosVistos = new Set(pedidosExistentes.map((p) => p.numeroPedido));
  const mutuariosPorCodigo = new Map(mutuariosDaEmpresa.map((m) => [m.codigoMutuario, m]));

  /*
    Processa linha por linha
  */
  for (let index = 0; index < linhas.length; index++) {
    const linha = linhas[index];
    const numeroLinha = index + 2;

    /*
      Aceita nomes de colunas em formatos parecidos
    */
    const numeroPedido = String(
      linha.NumeroPedido ||
      linha.numeroPedido ||
      linha.numero_pedido ||
      ""
    ).trim();

    const codigoMutuario = String(
      linha.CodigoMutuario ||
      linha.codigoMutuario ||
      linha.codigo_mutuario ||
      ""
    ).trim();

    const valorSolicitadoBruto =
      linha.ValorSolicitado ??
      linha.valorSolicitado ??
      linha.valor_solicitado ??
      "";

    const prazoBruto =
      linha.Prazo ??
      linha.prazo ??
      linha.PrazoMeses ??
      linha.prazoMeses ??
      "";

    const taxaBruta =
      linha.Taxa ??
      linha.taxa ??
      "";

    const finalidade = String(
      linha.Finalidade ||
      linha.finalidade ||
      ""
    ).trim();

    const pacoteFinanciamento = String(
      linha.PacoteFinanciamento ||
      linha.pacoteFinanciamento ||
      linha.pacote_financiamento ||
      ""
    ).trim();

    const status = String(
      linha.Status ||
      linha.status ||
      "SUBMETIDO"
    ).trim().toUpperCase();

    const etapaAtualBruta =
      linha.EtapaAtual ??
      linha.etapaAtual ??
      linha.etapa_atual ??
      1;

    const dataSubmissao = String(
      linha.DataSubmissao ||
      linha.dataSubmissao ||
      linha.data_submissao ||
      ""
    ).trim();

    const prazoAvaliacao = String(
      linha.PrazoAvaliacao ||
      linha.prazoAvaliacao ||
      linha.prazo_avaliacao ||
      ""
    ).trim();

    const prazoValidacao = String(
      linha.PrazoValidacao ||
      linha.prazoValidacao ||
      linha.prazo_validacao ||
      ""
    ).trim();

    const observacoes = String(
      linha.Observacoes ||
      linha.observacoes ||
      ""
    ).trim();

    /*
      Validações obrigatórias
    */
    if (!numeroPedido) {
      erros.push({
        linha: numeroLinha,
        erro: "NumeroPedido é obrigatório."
      });
      continue;
    }

    if (!codigoMutuario) {
      erros.push({
        linha: numeroLinha,
        erro: "CodigoMutuario é obrigatório."
      });
      continue;
    }

    if (valorSolicitadoBruto === "" || valorSolicitadoBruto === null) {
      erros.push({
        linha: numeroLinha,
        erro: "ValorSolicitado é obrigatório."
      });
      continue;
    }

    if (prazoBruto === "" || prazoBruto === null) {
      erros.push({
        linha: numeroLinha,
        erro: "Prazo (em meses) é obrigatório."
      });
      continue;
    }

    if (!finalidade) {
      erros.push({
        linha: numeroLinha,
        erro: "Finalidade é obrigatória."
      });
      continue;
    }

    /*
      Converte valor solicitado
    */
    const valorSolicitado = Number(
      String(valorSolicitadoBruto).replace(",", ".")
    );

    if (Number.isNaN(valorSolicitado) || valorSolicitado <= 0) {
      erros.push({
        linha: numeroLinha,
        erro: "ValorSolicitado inválido."
      });
      continue;
    }

    /*
      Converte prazo (meses)
    */
    const prazo = Number(String(prazoBruto).replace(",", "."));

    if (!Number.isInteger(prazo) || prazo <= 0) {
      erros.push({
        linha: numeroLinha,
        erro: "Prazo inválido (deve ser um número inteiro de meses maior que zero)."
      });
      continue;
    }

    /*
      Converte/valida taxa. Se a linha não trouxer taxa (coluna vazia),
      usa a estimativa mínima da empresa, mesmo critério das outras
      formas de criar pedido. Se trouxer, valida contra a faixa da
      empresa (taxaJurosMin/taxaJurosMax), tal como na aprovação.
    */
    let taxa;
    if (taxaBruta === "" || taxaBruta === null) {
      taxa = taxaEstimativaPadrao;
    } else {
      taxa = Number(String(taxaBruta).replace(",", "."));
      if (!Number.isFinite(taxa) || taxa <= 0) {
        erros.push({
          linha: numeroLinha,
          erro: "Taxa inválida."
        });
        continue;
      }
      if (taxa < taxaMin || taxa > taxaMax) {
        erros.push({
          linha: numeroLinha,
          erro: `Taxa deve estar entre ${taxaMin}% e ${taxaMax}% (faixa definida em Configurações > Empresa).`
        });
        continue;
      }
    }

    const prestacao = calcularPrestacao(valorSolicitado, taxa, prazo);
    const montanteTotal = prestacao * prazo;
    const jurosTotal = montanteTotal - valorSolicitado;

    /*
      Converte etapa atual
    */
    const etapaAtual = Number(etapaAtualBruta || 1);

    if (Number.isNaN(etapaAtual) || etapaAtual <= 0) {
      erros.push({
        linha: numeroLinha,
        erro: "EtapaAtual inválida."
      });
      continue;
    }

    /*
      Valida status permitido conforme model
    */
    const statusPermitidos = [
      "RASCUNHO",
      "SUBMETIDO",
      "EM_ANALISE",
      "EM_VALIDACAO",
      "APROVADO",
      "REJEITADO",
      "DESEMBOLSADO",
      "ENCERRADO",
    ];

    if (!statusPermitidos.includes(status)) {
      erros.push({
        linha: numeroLinha,
        erro: `Status '${status}' inválido.`
      });
      continue;
    }

    /*
      Verifica duplicado por número do pedido, isolado por empresa,
      mesmo motivo do codigoMutuario acima. Contra o Set em memória.
    */
    if (numerosVistos.has(numeroPedido)) {
      erros.push({
        linha: numeroLinha,
        erro: `NumeroPedido '${numeroPedido}' já existe.`
      });
      continue;
    }

    /*
      Localiza o mutuário pelo código, no mapa carregado antes do loop.
    */
    const mutuario = mutuariosPorCodigo.get(codigoMutuario);

    if (!mutuario) {
      erros.push({
        linha: numeroLinha,
        erro: `Mutuário com código '${codigoMutuario}' não encontrado.`
      });
      continue;
    }

    /*
      Marca como visto já aqui, para apanhar duplicados entre linhas do
      mesmo ficheiro.
    */
    numerosVistos.add(numeroPedido);

    /*
      Monta os dados do pedido
    */
    paraCriar.push({
      dados: {
        numeroPedido,
        mutuarioId: mutuario.id,
        empresaId,
        valorSolicitado,
        prazo,
        taxa,
        prestacao,
        jurosTotal,
        montanteTotal,
        finalidade,
        pacoteFinanciamento: pacoteFinanciamento || null,
        status: status || "SUBMETIDO",
        etapaAtual: etapaAtual || 1,
        dataSubmissao: dataSubmissao || null,
        prazoAvaliacao: prazoAvaliacao || null,
        prazoValidacao: prazoValidacao || null,
        observacoes: observacoes || null,
        createdBy: userId,
      },
      codigoMutuario: mutuario.codigoMutuario,
      nomeMutuario: mutuario.nomeCompleto,
    });
  }

  /*
    Cria todos os pedidos válidos numa única query. `returning: true`
    preserva a ordem de entrada nas instâncias devolvidas (Postgres), o
    que permite reassociar cada pedido criado ao mutuário da mesma linha
    sem outra query.
  */
  if (paraCriar.length) {
    const novosPedidos = await PedidoCredito.bulkCreate(
      paraCriar.map((item) => item.dados),
      { returning: true }
    );

    novosPedidos.forEach((novoPedido, i) => {
      importados.push({
        id: novoPedido.id,
        numeroPedido: novoPedido.numeroPedido,
        codigoMutuario: paraCriar[i].codigoMutuario,
        nomeMutuario: paraCriar[i].nomeMutuario,
      });
    });
  }

  return {
    totalLidos: linhas.length,
    totalImportados: importados.length,
    totalErros: erros.length,
    erros,
    importados,
  };
}

/*
  ===========================================================
  * Service responsável por importar créditos já existentes
  * ("saldo de abertura") via Excel, migração de empréstimos
  * que já estavam em curso antes deste sistema (caderno/Excel
  * do cliente), não novos pedidos.
  ===========================================================

  Ao contrário de importarExcellPedidos (que só cria um PedidoCredito
  "em aberto"), esta função cria o crédito de facto, PedidoCredito
  (invólucro, já DESEMBOLSADO), Desembolso e Credito, com o saldo
  devedor de HOJE, não recalculado desde o início. As parcelas já
  pagas antes da migração não são recriadas uma a uma, só as que
  ainda faltam pagar, ver credito.service.js (criarCreditoImportado).
*/
async function importarExcellCreditos({ fileBuffer, userId, empresaId }) {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const primeiraFolha = workbook.SheetNames[0];

  if (!primeiraFolha) {
    throw new Error("O ficheiro Excel não possui folhas válidas.");
  }

  const worksheet = workbook.Sheets[primeiraFolha];
  const linhas = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  if (!linhas.length) {
    return {
      totalLidos: 0,
      totalImportados: 0,
      totalErros: 0,
      erros: [],
      importados: [],
    };
  }

  const erros = [];
  const importados = [];

  // Mesmo critério de fallback de taxa usado em importarExcellPedidos.
  const empresa = await obterEmpresaCacheada(empresaId);
  const taxaMin = Number(empresa?.taxaJurosMin ?? 0);
  const taxaMax = Number(empresa?.taxaJurosMax ?? 100);
  const taxaEstimativaPadrao = Number(empresa?.taxaJurosMin ?? 18);

  /*
    Nota sobre este importador em particular: ao contrário dos outros
    dois, cada linha aqui cria PedidoCredito + Desembolso + Credito (e
    possivelmente parcelas) dentro de uma transação própria, é lógica
    de negócio por linha, não um insert simples, por isso não convertido
    para bulkCreate (misturar isso num único bulk quebraria a garantia
    de atomicidade por contrato migrado). A parte que É um N+1 puro,
    o findOne do mutuário por código, fica pré-carregada abaixo, igual
    aos outros dois importadores.
  */
  const mutuariosDaEmpresa = await Mutuario.findAll({
    where: { empresaId },
    attributes: ["id", "codigoMutuario", "nomeCompleto"],
    raw: true,
  });
  const mutuariosPorCodigo = new Map(mutuariosDaEmpresa.map((m) => [m.codigoMutuario, m]));

  for (let index = 0; index < linhas.length; index++) {
    const linha = linhas[index];
    const numeroLinha = index + 2;

    const codigoMutuario = String(
      linha.CodigoMutuario || linha.codigoMutuario || linha.codigo_mutuario || ""
    ).trim();

    const valorOriginalBruto =
      linha.ValorOriginal ?? linha.valorOriginal ?? linha.valor_original ?? "";

    const prazoBruto = linha.Prazo ?? linha.prazo ?? "";

    const taxaBruta = linha.Taxa ?? linha.taxa ?? "";

    const prestacaoBruta =
      linha.Prestacao ?? linha.prestacao ?? "";

    const dataDesembolsoBruta = String(
      linha.DataDesembolso || linha.dataDesembolso || linha.data_desembolso || ""
    ).trim();

    const parcelasPagasBruto =
      linha.ParcelasPagas ?? linha.parcelasPagas ?? linha.parcelas_pagas ?? "0";

    const saldoAtualBruto =
      linha.SaldoAtual ?? linha.saldoAtual ?? linha.saldo_atual ?? "";

    const numeroContrato = String(
      linha.NumeroContrato || linha.numeroContrato || linha.numero_contrato || ""
    ).trim();

    const observacoes = String(
      linha.Observacoes || linha.observacoes || ""
    ).trim();

    /*
      Validações obrigatórias
    */
    if (!codigoMutuario) {
      erros.push({ linha: numeroLinha, erro: "CodigoMutuario é obrigatório." });
      continue;
    }

    if (valorOriginalBruto === "" || valorOriginalBruto === null) {
      erros.push({ linha: numeroLinha, erro: "ValorOriginal é obrigatório." });
      continue;
    }

    if (prazoBruto === "" || prazoBruto === null) {
      erros.push({ linha: numeroLinha, erro: "Prazo (total de parcelas) é obrigatório." });
      continue;
    }

    if (!dataDesembolsoBruta) {
      erros.push({ linha: numeroLinha, erro: "DataDesembolso é obrigatória (data real do desembolso original)." });
      continue;
    }

    const valorOriginal = Number(String(valorOriginalBruto).replace(",", "."));
    if (Number.isNaN(valorOriginal) || valorOriginal <= 0) {
      erros.push({ linha: numeroLinha, erro: "ValorOriginal inválido." });
      continue;
    }

    const prazo = Number(String(prazoBruto).replace(",", "."));
    if (!Number.isInteger(prazo) || prazo <= 0) {
      erros.push({ linha: numeroLinha, erro: "Prazo inválido (deve ser um número inteiro de meses maior que zero)." });
      continue;
    }

    const dataDesembolso = new Date(dataDesembolsoBruta);
    if (Number.isNaN(dataDesembolso.getTime())) {
      erros.push({ linha: numeroLinha, erro: "DataDesembolso inválida." });
      continue;
    }

    const parcelasPagas = Number(String(parcelasPagasBruto).replace(",", "."));
    if (!Number.isInteger(parcelasPagas) || parcelasPagas < 0) {
      erros.push({ linha: numeroLinha, erro: "ParcelasPagas inválido (deve ser um número inteiro maior ou igual a zero)." });
      continue;
    }
    if (parcelasPagas > prazo) {
      erros.push({ linha: numeroLinha, erro: "ParcelasPagas não pode ser maior que Prazo." });
      continue;
    }

    let taxa;
    if (taxaBruta === "" || taxaBruta === null) {
      taxa = taxaEstimativaPadrao;
    } else {
      taxa = Number(String(taxaBruta).replace(",", "."));
      if (!Number.isFinite(taxa) || taxa <= 0) {
        erros.push({ linha: numeroLinha, erro: "Taxa inválida." });
        continue;
      }
      if (taxa < taxaMin || taxa > taxaMax) {
        erros.push({
          linha: numeroLinha,
          erro: `Taxa deve estar entre ${taxaMin}% e ${taxaMax}% (faixa definida em Configurações > Empresa).`,
        });
        continue;
      }
    }

    // Prestação: se a planilha não trouxer o valor real da prestação
    // (recomendado, para refletir o contrato real), calcula pela
    // fórmula padrão, igual ao resto do sistema.
    let prestacao;
    if (prestacaoBruta === "" || prestacaoBruta === null) {
      prestacao = calcularPrestacao(valorOriginal, taxa, prazo);
    } else {
      prestacao = Number(String(prestacaoBruta).replace(",", "."));
      if (!Number.isFinite(prestacao) || prestacao <= 0) {
        erros.push({ linha: numeroLinha, erro: "Prestacao inválida." });
        continue;
      }
    }

    const montanteTotal = Number((prestacao * prazo).toFixed(2));
    const jurosTotal = Number((montanteTotal - valorOriginal).toFixed(2));

    let saldoAtual = null;
    if (saldoAtualBruto !== "" && saldoAtualBruto !== null) {
      saldoAtual = Number(String(saldoAtualBruto).replace(",", "."));
      if (!Number.isFinite(saldoAtual) || saldoAtual < 0) {
        erros.push({ linha: numeroLinha, erro: "SaldoAtual inválido." });
        continue;
      }
    }

    /*
      Localiza o mutuário pelo código, no mapa carregado antes do loop.
    */
    const mutuario = mutuariosPorCodigo.get(codigoMutuario);
    if (!mutuario) {
      erros.push({ linha: numeroLinha, erro: `Mutuário com código '${codigoMutuario}' não encontrado.` });
      continue;
    }

    /*
      Cria PedidoCredito (invólucro) + Desembolso + Credito numa
      transação, se algo falhar a meio, nada fica meio-criado.
    */
    try {
      const credito = await sequelize.transaction(async (t) => {
        const pedidoInvolucro = await PedidoCredito.create({
          numeroPedido: generateNumeroPedido(),
          mutuarioId: mutuario.id,
          empresaId,
          valorSolicitado: valorOriginal,
          finalidade: "Crédito importado do sistema anterior (migração de saldo de abertura).",
          prazo,
          taxa,
          prestacao,
          jurosTotal,
          montanteTotal,
          status: "DESEMBOLSADO",
          dataSubmissao: dataDesembolso,
          createdBy: userId,
        }, { transaction: t });

        const desembolso = await Desembolso.create({
          pedidoId: pedidoInvolucro.id,
          empresaId,
          valorDesembolsado: valorOriginal,
          dataDesembolso,
          meioPagamento: "TRANSFERENCIA",
          referencia: await generateReferencia(),
          observacoes: "Desembolso registado retroativamente (importação de crédito existente).",
          createdBy: userId,
        }, { transaction: t });

        return creditoService.criarCreditoImportado(
          pedidoInvolucro,
          desembolso,
          userId,
          { parcelasPagas, saldoAtual, observacoes: observacoes || null, numeroContrato: numeroContrato || null },
          { transaction: t }
        );
      });

      importados.push({
        id: credito.id,
        numeroContrato: credito.numeroContrato,
        codigoMutuario: mutuario.codigoMutuario,
        nomeMutuario: mutuario.nomeCompleto,
        saldoAtual: credito.saldoAtual,
        estado: credito.estado,
      });
    } catch (error) {
      erros.push({ linha: numeroLinha, erro: `Erro ao criar crédito: ${error.message}` });
    }
  }

  return {
    totalLidos: linhas.length,
    totalImportados: importados.length,
    totalErros: erros.length,
    erros,
    importados,
  };
}

module.exports = {
  gerarExcellMutuarios,
  gerarExcellPedidos,
  gerarExcellDesembolsos,
  gerarExcellReembolsos,
  gerarExcellRelatorioFinanceiro,
  importarExcellMutuarios,
  importarExcellPedidos,
  importarExcellCreditos,
};