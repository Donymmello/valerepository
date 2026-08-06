const sequelize = require("./db");
const logger = require("../utils/logger");

/**
 * SINCRONIZAÇÃO DA BASE DE DADOS
 * Alinha os modelos do Sequelize com as tabelas do MySQL em ambiente de desenvolvimento.
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
    logger.error("Erro crítico ao sincronizar a base de dados:", {
      message: error.message,
      stack: error.stack
    });
    
    // Opcional: Em inicializações críticas, podes querer forçar o encerramento do processo
    // process.exit(1);
  }
}

module.exports = syncDatabase;