require("dotenv").config();

// Config no formato que o sequelize-cli exige (separado do config/db.js,
// que é a ligação programática usada pela app em runtime — mesmas envs).
const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  dialect: "mysql",
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
