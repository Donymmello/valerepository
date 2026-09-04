"use strict";

// Baseline: cria o esquema atual a partir dos models já existentes,
// em vez de reescrever ~20 tabelas à mão (uma fonte de verdade só).
// ponytail: FK checks desligados durante a criação para não ter de
// ordenar as tabelas por dependência, religa no fim.
//
// A instrução para desligar/religar os FK checks é diferente por
// dialeto (MySQL: SET FOREIGN_KEY_CHECKS; Postgres: SET
// session_replication_role), ver desligarFkChecks/religarFkChecks.
// Nota: em Postgres, "SET session_replication_role" exige que o
// utilizador da BD seja superuser, é o caso do utilizador criado pelo
// docker-compose (POSTGRES_USER), mas pode não ser o caso em serviços
// geridos (ex: RDS) sem privilégios elevados.
const { sequelize } = require("../models");

async function desligarFkChecks(queryInterface) {
  const dialeto = queryInterface.sequelize.getDialect();
  if (dialeto === "postgres") {
    await queryInterface.sequelize.query("SET session_replication_role = 'replica'");
  } else {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  }
}

async function religarFkChecks(queryInterface) {
  const dialeto = queryInterface.sequelize.getDialect();
  if (dialeto === "postgres") {
    await queryInterface.sequelize.query("SET session_replication_role = 'origin'");
  } else {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  }
}

module.exports = {
  async up(queryInterface) {
    await desligarFkChecks(queryInterface);
    try {
      for (const model of Object.values(sequelize.models)) {
        await queryInterface.createTable(model.getTableName(), model.rawAttributes);
      }
    } finally {
      await religarFkChecks(queryInterface);
    }
  },

  async down(queryInterface) {
    await desligarFkChecks(queryInterface);
    try {
      for (const model of Object.values(sequelize.models)) {
        await queryInterface.dropTable(model.getTableName());
      }
    } finally {
      await religarFkChecks(queryInterface);
    }
  },
};
