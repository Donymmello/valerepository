const sequelize = require("./db");
const logger = require("../utils/logger");

/**
 * SINCRONIZAÇÃO DA BASE DE DADOS
 * Alinha os modelos do Sequelize com as tabelas da BD em ambiente de desenvolvimento.
 */
async function syncDatabase() {
  const sync = process.env.DB_SYNC === "true";
  const alter = process.env.DB_ALTER === "true";

  if (!sync) {
    logger.info("Sincronização automática desativada.");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    logger.warn("Sincronização IGNOVADA em ambiente de produção por motivos de segurança.");
    return;
  }

  try {
    if (alter) {
      logger.warn("Atenção: DB_ALTER está ativo. O Sequelize vai tentar modificar a estrutura das tabelas existentes.");
    }

    // Executa a sincronização segura
    await sequelize.sync({ alter });

    logger.info("Base de dados sincronizada com sucesso.", { alter });
  } catch (error) {
    // Garante que o erro de infraestrutura é registado detalhadamente sem deitar o servidor abaixo às cegas
    // error.parent.sqlMessage é específico do driver mysql2 — o driver
    // pg (Postgres) usa .message/.detail em vez disso. Verificamos os
    // dois para a mensagem de erro continuar detalhada em qualquer dialeto.
    logger.error("Erro crítico ao sincronizar a base de dados:", {
      error: error.message,
      stack: error.stack,
      original:
        error.parent?.sqlMessage ||
        error.parent?.detail ||
        error.parent?.message ||
        error.original?.sqlMessage ||
        null,
    });
    
    // Opcional: Em inicializações críticas, podes querer forçar o encerramento do processo
    // process.exit(1);
  }
}

module.exports = syncDatabase;