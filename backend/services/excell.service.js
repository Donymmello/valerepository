const XLSX = require("xlsx");
const { Mutuario, PedidoCredito, Desembolso, Reembolso } = require("../models");

/*
  ===========================================================
  * Service responsável por gerar ficheiro Excel de mutuários
  ===========================================================
  *
  * O papel deste service é:
  * 1. Buscar os mutuários na base de dados
  * 2. Formatar os dados para a planilha
  * 3. Criar workbook e worksheet
  * 4. Gerar o buffer do ficheiro Excel
  * 5. Devolver buffer + nome do ficheiro
*/
async function gerarExcellMutuarios() {
  /*
    Busca todos os mutuários
  */
  const mutuarios = await Mutuario.findAll({
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
  *
  * O papel deste service é:
  * 1. Buscar os pedidos com os relacionamentos necessários
  * 2. Formatar os dados para a planilha
  * 3. Criar workbook e worksheet
  * 4. Gerar o buffer do ficheiro Excel
  * 5. Devolver buffer + nome do ficheiro
*/
async function gerarExcellPedidos() {
  /*
    Busca todos os pedidos com dados do mutuário e criador
  */
  const pedidos = await PedidoCredito.findAll({
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
            Finalidade: "",
            PacoteFinanciamento: "",
            Status: "",
            EtapaAtual: "",
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
    { wch: 8 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
    { wch: 35 },
    { wch: 22 },
    { wch: 18 },
    { wch: 12 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 35 },
    { wch: 12 },
    { wch: 25 },
    { wch: 30 },
    { wch: 22 },
    { wch: 22 },
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
async function gerarExcellDesembolsos() {
  const desembolsos = await Desembolso.findAll({
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
async function gerarExcellReembolsos() {
  const reembolsos = await Reembolso.findAll({
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
  *
  * O papel deste service é:
  * 1. Buscar os pedidos com mutuário, desembolsos e reembolsos
  * 2. Calcular totais financeiros por pedido
  * 3. Formatar os dados para a planilha
  * 4. Criar workbook e worksheet
  * 5. Gerar o buffer do ficheiro Excel
  * 6. Devolver buffer + nome do ficheiro
*/
async function gerarExcellRelatorioFinanceiro() {
  /*
    Busca todos os pedidos com os relacionamentos necessários
  */
  const pedidos = await PedidoCredito.findAll({
    include: [
      {
        association: "mutuario",
      },
      {
        association: "desembolsos",
      },
      {
        association: "reembolsos",
      },
    ],
    order: [["id", "DESC"]],
  });

  /*
    Monta os dados do relatório
  */
  const dadosFormatados = pedidos.map((pedido) => {
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
    const totalReembolsado = (pedido.reembolsos || []).reduce(
      (total, reembolso) =>
        total + Number(reembolso.valorReembolsado || 0),
      0
    );

    /*
      Calcula o saldo em aberto
      Regra:
      saldo = total desembolsado - total reembolsado
    */
    const saldoEmAberto = totalDesembolsado - totalReembolsado;

    /*
      Quantidade de movimentos financeiros
    */
    const quantidadeDesembolsos = (pedido.desembolsos || []).length;
    const quantidadeReembolsos = (pedido.reembolsos || []).length;

    return {
      ID: pedido.id || "",
      NumeroPedido: pedido.numeroPedido || "",
      CodigoMutuario: pedido.mutuario?.codigoMutuario || "",
      NomeMutuario: pedido.mutuario?.nomeCompleto || "",
      ValorSolicitado: Number(pedido.valorSolicitado || 0),
      TotalDesembolsado: totalDesembolsado,
      TotalReembolsado: totalReembolsado,
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
  *
  * O papel deste service é:
  * 1. Ler o ficheiro Excel recebido em buffer
  * 2. Converter a primeira folha em JSON
  * 3. Validar linha por linha
  * 4. Evitar duplicados
  * 5. Criar os mutuários válidos
  * 6. Devolver um resumo da importação
*/
async function importarExcellMutuarios({ fileBuffer, userId }) {
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
      Verifica duplicado por código de mutuário
    */
    const mutuarioExistentePorCodigo = await Mutuario.findOne({
      where: { codigoMutuario }
    });

    if (mutuarioExistentePorCodigo) {
      erros.push({
        linha: numeroLinha,
        erro: `CodigoMutuario '${codigoMutuario}' já existe.`
      });
      continue;
    }

    /*
      Verifica duplicado por documento, quando existir
    */
    if (documentoNumero) {
      const mutuarioExistentePorDocumento = await Mutuario.findOne({
        where: { documentoNumero }
      });

      if (mutuarioExistentePorDocumento) {
        erros.push({
          linha: numeroLinha,
          erro: `DocumentoNumero '${documentoNumero}' já existe.`
        });
        continue;
      }
    }

    /*
      Monta os dados para criação
      userId do mutuário é opcional no teu model,
      então por agora não vamos forçar esse campo
    */
    const dadosMutuario = {
      codigoMutuario,
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
    };

    /*
      Cria o mutuário na base de dados
    */
    const novoMutuario = await Mutuario.create(dadosMutuario);

    importados.push({
      id: novoMutuario.id,
      codigoMutuario: novoMutuario.codigoMutuario,
      nomeCompleto: novoMutuario.nomeCompleto,
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

module.exports = {
  gerarExcellMutuarios,
  gerarExcellPedidos,
  gerarExcellDesembolsos,
  gerarExcellReembolsos,
  gerarExcellRelatorioFinanceiro,
  importarExcellMutuarios,
};