/*
  ==========================================================
  APLICAR TIPOS DE NOTIFICAÇÃO EM FALTA (fora do sequelize-cli)
  ==========================================================
  Corre a migration 20260816120000-add-notificacao-tipos.js diretamente,
  sem depender do SequelizeMeta/baseline. Seguro correr mais de uma vez.

  Uso (dentro do container do backend):
    node scripts/aplicarNotificacaoTipos.js
*/

require("dotenv").config();
const { Sequelize } = require("sequelize");
const sequelize = require("../config/db");
const migration = require("../migrations/20260816120000-add-notificacao-tipos");

async function main() {
  try {
    await sequelize.authenticate();
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log("Tipos de notificação (PEDIDO_CRIADO, ALERTA_PAGAMENTO) aplicados com sucesso.");
  } catch (error) {
    console.error("Erro ao aplicar schema:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
