/*
  ==========================================================
  APLICAR KYC OPCIONAL NO REGISTO DE MUTUÁRIO (fora do sequelize-cli)
  ==========================================================
  Corre a migration 20260816110000-relax-mutuario-kyc-required.js
  diretamente, sem depender do SequelizeMeta/baseline. Seguro correr
  mais de uma vez.

  Uso (dentro do container do backend):
    node scripts/aplicarMutuarioKycOpcional.js
*/

require("dotenv").config();
const { Sequelize } = require("sequelize");
const sequelize = require("../config/db");
const migration = require("../migrations/20260816110000-relax-mutuario-kyc-required");

async function main() {
  try {
    await sequelize.authenticate();
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log("Campos de KYC do mutuário tornados opcionais com sucesso.");
  } catch (error) {
    console.error("Erro ao aplicar schema:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
