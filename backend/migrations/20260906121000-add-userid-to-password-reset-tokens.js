"use strict";

/*
  Corrige um bug real: password_reset_tokens nunca teve coluna user_id
  (o .associate() do modelo que a criaria nunca era invocado por
  ninguém, ver models/index.js). resetPassword() lia sempre
  resetToken.userId como undefined, e Sequelize rejeita um WHERE com
  undefined, resultado: redefinir password dava sempre 500. Ver
  scripts/aplicarSchemaUserIdPasswordReset.js para aplicar diretamente
  na VPS.

  allowNull: true de propósito, tokens de reset já existentes (todos com
  15 min de validade, praticamente garantido já expirados) ficam com
  user_id nulo em vez de partir a migration.
*/
module.exports = {
  async up(queryInterface, Sequelize) {
    const desc = await queryInterface.describeTable("password_reset_tokens");
    if (desc.user_id) return;

    await queryInterface.addColumn("password_reset_tokens", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("password_reset_tokens", "user_id");
  },
};
