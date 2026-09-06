/*
  ==========================================================
  APLICAR A COLUNA user_id EM password_reset_tokens (fora do sequelize-cli)
  ==========================================================
  Mesmo motivo do scripts/aplicarSchemaSubscricao.js: a baseline nunca
  foi marcada no SequelizeMeta, por isso `npm run migrate` tentaria
  recriar tabelas que já existem. Corre só esta migration diretamente.

  Corrige um bug real: sem esta coluna, redefinir password (esqueci-me
  da password) dá sempre 500. Ver a migration para detalhe.

  Uso (dentro do container do backend):
    node scripts/aplicarSchemaUserIdPasswordReset.js
*/

require("dotenv").config();
const { Sequelize } = require("sequelize");
const sequelize = require("../config/db");
const migration = require("../migrations/20260906121000-add-userid-to-password-reset-tokens");

async function main() {
  try {
    await sequelize.authenticate();
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log("Coluna user_id adicionada a password_reset_tokens com sucesso.");
  } catch (error) {
    console.error("Erro ao aplicar schema:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
