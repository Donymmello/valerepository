"use strict";

// Baseline: cria o esquema atual a partir dos models já existentes,
// em vez de reescrever ~20 tabelas à mão (uma fonte de verdade só).
// ponytail: FK checks desligados durante a criação para não ter de
// ordenar as tabelas por dependência — religa no fim.
const { sequelize } = require("../models");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    try {
      for (const model of Object.values(sequelize.models)) {
        await queryInterface.createTable(model.getTableName(), model.rawAttributes);
      }
    } finally {
      await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    try {
      for (const model of Object.values(sequelize.models)) {
        await queryInterface.dropTable(model.getTableName());
      }
    } finally {
      await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    }
  },
};
