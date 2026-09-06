"use strict";

/*
  Tabela do refresh token (ver models/refreshToken.js e
  scripts/aplicarSchemaRefreshToken.js, este último para aplicar
  diretamente na VPS, onde `npm run migrate` continua por resolver por
  causa da baseline nunca marcada no SequelizeMeta).
*/
module.exports = {
  async up(queryInterface, Sequelize) {
    const tabelas = await queryInterface.showAllTables();
    const existe = tabelas.some((t) => String(t).toLowerCase() === "refresh_tokens");
    if (existe) return;

    await queryInterface.createTable("refresh_tokens", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      token: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      revoked: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("refresh_tokens");
  },
};
