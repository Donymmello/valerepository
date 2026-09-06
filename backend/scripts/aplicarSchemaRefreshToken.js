/*
  ==========================================================
  APLICAR A TABELA refresh_tokens DIRETAMENTE (fora do sequelize-cli)
  ==========================================================
  Mesmo motivo do scripts/aplicarSchemaSubscricao.js: a baseline
  (00000000000000-baseline.js) nunca foi marcada como aplicada no
  SequelizeMeta, por isso `npm run migrate` tentaria recriar tabelas que
  já existem. Este script corre só esta migration diretamente.

  Uso (dentro do container do backend):
    node scripts/aplicarSchemaRefreshToken.js
*/

require("dotenv").config();
const { Sequelize } = require("sequelize");
const sequelize = require("../config/db");
const migration = require("../migrations/20260906120000-add-refresh-tokens-table");

async function main() {
  try {
    await sequelize.authenticate();
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log("Tabela refresh_tokens criada com sucesso.");
  } catch (error) {
    console.error("Erro ao aplicar schema:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
