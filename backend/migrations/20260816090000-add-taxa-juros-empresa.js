"use strict";

/*
  Adiciona a faixa de taxa de juros (min/max) por empresa, para
  substituir a taxa fixa de 18% que estava hardcoded em todo o
  sistema (pedidoCredito.controller.js). Idempotente, tal como a
  migration 20260814120000, seguro correr mais que uma vez.
*/

module.exports = {
  async up(queryInterface, Sequelize) {
    const empresasDesc = await queryInterface.describeTable("empresas");

    if (!empresasDesc.taxa_juros_min) {
      await queryInterface.addColumn("empresas", "taxa_juros_min", {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 15.0,
      });
    }

    if (!empresasDesc.taxa_juros_max) {
      await queryInterface.addColumn("empresas", "taxa_juros_max", {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 30.0,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("empresas", "taxa_juros_max");
    await queryInterface.removeColumn("empresas", "taxa_juros_min");
  },
};
