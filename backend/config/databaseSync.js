const sequelize = require("./db");
const logger = require("../utils/logger");

async function syncDatabase() {
  const sync = process.env.DB_SYNC === "true";
  const alter = process.env.DB_ALTER === "true";

  if (!sync) {
    logger.info("Sincronização automática desativada.");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    logger.info("Sincronização ignorada em produção.");
    return;
}

  await sequelize.sync({ alter });

  logger.info("Base de dados sincronizada.", {
    alter,
  });
}

module.exports = syncDatabase;