/*
  ==========================================================
  APLICAR O SCHEMA DE SUBSCRIÇÃO DIRETAMENTE (fora do sequelize-cli)
  ==========================================================
  A migration 20260814120000-add-subscription-model-columns.js não
  pode ainda ser corrida via `npm run migrate` porque a baseline
  (00000000000000-baseline.js) nunca foi marcada como aplicada no
  SequelizeMeta, e tentaria recriar tabelas que já existem.

  Este script corre só a migration da subscrição diretamente. É seguro
  correr mais de uma vez — cada passo verifica o estado atual antes de
  alterar.

  Uso (dentro do container do backend):
    node scripts/aplicarSchemaSubscricao.js
*/

require("dotenv").config();
const { Sequelize } = require("sequelize");
const sequelize = require("../config/db");
const migration = require("../migrations/20260814120000-add-subscription-model-columns");

async function main() {
  try {
    await sequelize.authenticate();
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log("Schema de subscrição aplicado com sucesso.");
  } catch (error) {
    console.error("Erro ao aplicar schema:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
