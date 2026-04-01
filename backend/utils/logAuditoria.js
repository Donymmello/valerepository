const { LogAuditoria } = require("../models");

/*
  Função auxiliar para gravar logs de auditoria.
  Assim podemos chamar esta função em qualquer controller.
*/
async function registrarLogAuditoria({
  userId = null,
  acao,
  entidade,
  entidadeId = null,
  descricao = null,
}) {
  try {
    await LogAuditoria.create({
      userId,
      acao,
      entidade,
      entidadeId,
      descricao,
    });
  } catch (error) {
    // Não lançamos erro para não travar a operação principal
    console.error("Erro ao registar log de auditoria:", error);
  }
}

module.exports = registrarLogAuditoria;