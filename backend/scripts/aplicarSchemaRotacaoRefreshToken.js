/*
  ==========================================================
  APLICAR familia_id EM refresh_tokens (fora do sequelize-cli)
  ==========================================================
  Mesmo motivo do scripts/aplicarSchemaRefreshToken.js: a baseline
  (00000000000000-baseline.js) nunca foi marcada como aplicada no
  SequelizeMeta, por isso `npm run migrate` tentaria recriar tabelas que
  já existem. Este script corre só esta migration diretamente.

  Uso (dentro do container do backend):
    node scripts/aplicarSchemaRotacaoRefreshToken.js
*/

require("dotenv").config();
const { Sequelize } = require("sequelize");
const sequelize = require("../config/db");
const migration = require("../migrations/20261004120000-add-familia-id-refresh-tokens");

async function main() {
  try {
    await sequelize.authenticate();
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log("Coluna familia_id aplicada em refresh_tokens.");
  } catch (error) {
    console.error("Erro ao aplicar schema:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
