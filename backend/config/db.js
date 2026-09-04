const { Sequelize } = require("sequelize");
require("dotenv").config();

/*
  Aqui configuramos a conexão com a base de dados PostgreSQL.
  O Sequelize vai usar essas credenciais para se conectar.

  Em testes (NODE_ENV=test), liga a um sqlite em memória em vez do
  Postgres real, permite testes de integração reais (BD de verdade,
  não mocks) sem precisar de Postgres a correr no ambiente de CI/sandbox.
  Ver __tests__/authIntegration.test.js.
*/
const sequelize =
  process.env.NODE_ENV === "test"
    ? new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false })
    : new Sequelize(
        process.env.DB_NAME,       // nome da base de dados
        process.env.DB_USER,       // utilizador do PostgreSQL
        process.env.DB_PASS,   // senha do PostgreSQL
        {
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT) || 5432,
          dialect: "postgres",
          logging: false, // se quiser ver queries SQL no terminal, mude para true
        }
      );

module.exports = sequelize;