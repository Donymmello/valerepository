const excellService = require("../services/excell.service");
const registrarLogAuditoria = require("../utils/logAuditoria");

/*
  ===========================================================
  * Controller responsável por exportar mutuários para Excel.
  ===========================================================
 * 
 * O papel do controller aqui é:
 * 1. Receber o pedido HTTP
 * 2. Chamar o service que gera o ficheiro
 * 3. Configurar os headers da resposta
 * 4. Enviar o ficheiro ao utilizador
 */
async function exportarMutuarios(req, res) {
    try {
         const { buffer, fileName} = await excellService.gerarExcellMutuarios();

         /*
      Define o tipo de conteúdo da resposta como ficheiro Excel
    */
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    /*
      Define o nome do ficheiro que será baixado
    */
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);


         //registo de log
         await registrarLogAuditoria({
            userId: req.user.id,
            acao: "EXPORTAR_MUTUARIOS",
            entidade: "Mutuario",
            entidadeId: null,
            descricao: "Exportação Excel da lista de mutuários."
         });

         // Envia o ficheiro ao cliente
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Erro ao exportar mutuários:", error);

    return res.status(500).json({
      message: "Erro interno ao exportar mutuários para Excel.",
      error: error.message
    });
  }
};

/**
 * Controller placeholder para exportação de pedidos.
 * Vamos implementar depois.
 */
async function exportarPedidos(req, res) {
  try {
    return res.status(501).json({
      message: "Exportação de pedidos ainda não implementada."
    });
  } catch (error) {
    console.error("Erro ao exportar pedidos:", error);

    return res.status(500).json({
      message: "Erro interno ao exportar pedidos.",
      error: error.message
    });
  }
};

/**
 * Controller placeholder para importação de mutuários.
 * Também implementamos depois.
 */
async function importarMutuarios(req, res) {
  try {
    return res.status(501).json({
      message: "Importação de mutuários ainda não implementada."
    });
  } catch (error) {
    console.error("Erro ao importar mutuários:", error);

    return res.status(500).json({
      message: "Erro interno ao importar mutuários.",
      error: error.message
    });
  }
};

module.exports = {
    exportarMutuarios,
    exportarPedidos,
    importarMutuarios,
}