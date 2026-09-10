/*
  ==========================================================
  APLICAR O SCHEMA DE PEDIDO DE PLANO PAGO (fora do sequelize-cli)
  ==========================================================
  Mesmo motivo do scripts/aplicarSchemaSubscricao.js: a baseline nunca
  foi marcada no SequelizeMeta, por isso `npm run migrate` tentaria
  recriar tabelas que já existem. Corre só esta migration diretamente.

  Uso (dentro do container do backend):
    node scripts/aplicarSchemaPedidoPlano.js
*/

require("dotenv").config();
const { Sequelize } = require("sequelize");
const sequelize = require("../config/db");
const migration = require("../migrations/20260909100000-pedido-plano-pago");

async function main() {
  try {
    await sequelize.authenticate();
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log("Schema de pedido de plano pago aplicado com sucesso.");
  } catch (error) {
    console.error("Erro ao aplicar schema:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
