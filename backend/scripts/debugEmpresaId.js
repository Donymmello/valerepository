/*
  Script de diagnóstico temporário — corre só o changeColumn de
  empresa_id com logging de SQL ativo, para vermos exatamente o que é
  executado e que erro (se algum) a base de dados devolve.

  Uso: node scripts/debugEmpresaId.js
*/

require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: 3306,
    dialect: "mysql",
    logging: console.log, // mostra o SQL real
  }
);

async function main() {
  try {
    await sequelize.authenticate();
    console.log("--- antes ---");
    const antes = await sequelize.getQueryInterface().describeTable("users");
    console.log(JSON.stringify(antes.empresa_id, null, 2));

    console.log("--- a alterar ---");
    await sequelize.getQueryInterface().changeColumn("users", "empresa_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    console.log("--- depois ---");
    const depois = await sequelize.getQueryInterface().describeTable("users");
    console.log(JSON.stringify(depois.empresa_id, null, 2));
  } catch (error) {
    console.error("ERRO:", error.message);
    console.error(error.original || error);
  } finally {
    await sequelize.close();
  }
}

main();
