/*
  ==========================================================
  APLICAR A COLUNA DE TAXA DE JUROS POR EMPRESA (fora do sequelize-cli)
  ==========================================================
  Mesma situação da migration de subscrição: corre a migration
  20260816090000-add-taxa-juros-empresa.js diretamente, sem depender
  do SequelizeMeta/baseline. Seguro correr mais de uma vez.

  Uso (dentro do container do backend):
    node scripts/aplicarTaxaJurosEmpresa.js
*/

require("dotenv").config();
const { Sequelize } = require("sequelize");
const sequelize = require("../config/db");
const migration = require("../migrations/20260816090000-add-taxa-juros-empresa");

async function main() {
  try {
    await sequelize.authenticate();
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log("Coluna de taxa de juros aplicada com sucesso.");
  } catch (error) {
    console.error("Erro ao aplicar schema:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
