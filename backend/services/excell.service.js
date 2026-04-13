const XLSX = require("xlsx");
const { Mutuario } = require("../models");

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
    Ajusta os campos conforme o teu model real
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

module.exports = {
  gerarExcellMutuarios,
};