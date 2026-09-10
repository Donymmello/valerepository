/*
  ==========================================================
  APLICAR O SCHEMA DE CONVITES DE GRUPO (fora do sequelize-cli)
  ==========================================================
  Mesmo motivo do scripts/aplicarSchemaSubscricao.js: a baseline nunca
  foi marcada no SequelizeMeta, por isso `npm run migrate` tentaria
  recriar tabelas que já existem. Corre só esta migration diretamente.

  Uso (dentro do container do backend):
    node scripts/aplicarSchemaConvitesGrupo.js
*/

require("dotenv").config();
const { Sequelize } = require("sequelize");
const sequelize = require("../config/db");
const migration = require("../migrations/20260906130000-convite-portal-grupo");

async function main() {
  try {
    await sequelize.authenticate();
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log("Schema de convites de grupo aplicado com sucesso.");
  } catch (error) {
    console.error("Erro ao aplicar schema:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
