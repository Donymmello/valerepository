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
         const { buffer, fileName} = await excellService.gerarExcellMutuarios(req.user.empresaId);

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
    const { buffer, fileName } = await excellService.gerarExcellPedidos(req.user.empresaId);
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

    /*
      Registo de auditoria
    */
    await registrarLogAuditoria({
      userId: req.user?.id || null,
      acao: "EXPORTAR_PEDIDOS",
      entidade: "PedidoCredito",
      entidadeId: null,
      descricao: "Exportação Excel da lista de pedidos de crédito."
    });

    /*
      Envia o ficheiro ao cliente
    */
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Erro ao exportar pedidos:", error);

    return res.status(500).json({
      message: "Erro interno ao exportar pedidos para Excel.",
      error: error.message
    });
  }
}

/*
  ===========================================================
  * Controller responsável por exportar desembolsos para Excel
  ===========================================================
*/
async function exportarDesembolsos(req, res) {
  try {
    const { buffer, fileName } = await excellService.gerarExcellDesembolsos(req.user.empresaId);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    await registrarLogAuditoria({
      userId: req.user?.id || null,
      acao: "EXPORTAR_DESEMBOLSOS",
      entidade: "Desembolso",
      entidadeId: null,
      descricao: "Exportação Excel da lista de desembolsos."
    });

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Erro ao exportar desembolsos:", error);

    return res.status(500).json({
      message: "Erro interno ao exportar desembolsos para Excel.",
      error: error.message
    });
  }
}

/*
  ===========================================================
  * Controller responsável por exportar reembolsos para Excel
  ===========================================================
*/
async function exportarReembolsos(req, res) {
  try {
    const { buffer, fileName } = await excellService.gerarExcellReembolsos(req.user.empresaId);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    await registrarLogAuditoria({
      userId: req.user?.id || null,
      acao: "EXPORTAR_REEMBOLSOS",
      entidade: "Reembolso",
      entidadeId: null,
      descricao: "Exportação Excel da lista de reembolsos."
    });

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Erro ao exportar reembolsos:", error);

    return res.status(500).json({
      message: "Erro interno ao exportar reembolsos para Excel.",
      error: error.message
    });
  }
}

/*
  ===========================================================
  * Controller responsável por exportar relatório financeiro
  ===========================================================
*/
async function exportarRelatorioFinanceiro(req, res) {
  try {
    const { buffer, fileName } =
      await excellService.gerarExcellRelatorioFinanceiro(req.user.empresaId);

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

    /*
      Registo de auditoria
    */
    await registrarLogAuditoria({
      userId: req.user?.id || null,
      acao: "EXPORTAR_RELATORIO_FINANCEIRO",
      entidade: "PedidoCredito",
      entidadeId: null,
      descricao: "Exportação Excel do relatório financeiro dos pedidos."
    });

    /*
      Envia o ficheiro ao cliente
    */
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Erro ao exportar relatório financeiro:", error);

    return res.status(500).json({
      message: "Erro interno ao exportar relatório financeiro para Excel.",
      error: error.message
    });
  }
}

/**
 * Controller placeholder para importação de mutuários.
 * Também implementamos depois.
 */
async function importarMutuarios(req, res) {
  try {
    /*
      Verifica se foi enviado um ficheiro
      O multer vai colocar o ficheiro em req.file
    */
    if (!req.file) {
      return res.status(400).json({
        message: "Nenhum ficheiro Excel foi enviado."
      });
    }

    /*
      Chama o service e passa o buffer do ficheiro
      Também passamos o utilizador autenticado para eventual uso futuro
    */
    const resultado = await excellService.importarExcellMutuarios({
      fileBuffer: req.file.buffer,
      userId: req.user?.id || null,
      empresaId: req.user.empresaId,
    });

    /*
      Registo de auditoria
    */
    await registrarLogAuditoria({
      userId: req.user?.id || null,
      acao: "IMPORTAR_MUTUARIOS",
      entidade: "Mutuario",
      entidadeId: null,
      descricao: `Importação Excel de mutuários concluída. Importados: ${resultado.totalImportados}, erros: ${resultado.totalErros}.`
    });

    /*
      Devolve o resumo da importação
    */
    return res.status(200).json({
      message: "Importação de mutuários concluída com sucesso.",
      resultado,
    });
  } catch (error) {
    console.error("Erro ao importar mutuários:", error);

    return res.status(500).json({
      message: "Erro interno ao importar mutuários via Excel.",
      error: error.message
    });
  }
}

/*
  ===========================================================
  * Controller responsável por importar pedidos via Excel
  ===========================================================
*/
async function importarPedidos(req, res) {
  try {
    /*
      Verifica se foi enviado um ficheiro
    */
    if (!req.file) {
      return res.status(400).json({
        message: "Nenhum ficheiro Excel foi enviado."
      });
    }

    /*
      Chama o service para processar a importação
    */
    const resultado = await excellService.importarExcellPedidos({
      fileBuffer: req.file.buffer,
      userId: req.user?.id || null,
      empresaId: req.user.empresaId,
    });

    /*
      Registo de auditoria
    */
    await registrarLogAuditoria({
      userId: req.user?.id || null,
      acao: "IMPORTAR_PEDIDOS",
      entidade: "PedidoCredito",
      entidadeId: null,
      descricao: `Importação Excel de pedidos concluída. Importados: ${resultado.totalImportados}, erros: ${resultado.totalErros}.`
    });

    return res.status(200).json({
      message: "Importação de pedidos concluída.",
      resultado,
    });
  } catch (error) {
    console.error("Erro ao importar pedidos:", error);

    return res.status(500).json({
      message: "Erro interno ao importar pedidos via Excel.",
      error: error.message
    });
  }
}

/*
  ===========================================================
  * Controller responsável por importar créditos já existentes
  * ("saldo de abertura") via Excel, migração
  ===========================================================
*/
async function importarCreditos(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Nenhum ficheiro Excel foi enviado."
      });
    }

    const resultado = await excellService.importarExcellCreditos({
      fileBuffer: req.file.buffer,
      userId: req.user?.id || null,
      empresaId: req.user.empresaId,
    });

    await registrarLogAuditoria({
      userId: req.user?.id || null,
      acao: "IMPORTAR_CREDITOS",
      entidade: "Credito",
      entidadeId: null,
      descricao: `Importação Excel de créditos existentes (saldo de abertura) concluída. Importados: ${resultado.totalImportados}, erros: ${resultado.totalErros}.`
    });

    return res.status(200).json({
      message: "Importação de créditos concluída.",
      resultado,
    });
  } catch (error) {
    console.error("Erro ao importar créditos:", error);

    return res.status(500).json({
      message: "Erro interno ao importar créditos via Excel.",
      error: error.message
    });
  }
}

module.exports = {
    exportarMutuarios,
    exportarPedidos,
    exportarDesembolsos,
    exportarReembolsos,
    exportarRelatorioFinanceiro,
    importarMutuarios,
    importarPedidos,
    importarCreditos,
}