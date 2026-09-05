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
      const modelos = Object.values(sequelize.models);

      // Passo 1: cria todas as tabelas SEM as foreign keys. A ordem de
      // sequelize.models é a ordem em que os ficheiros de modelo são
      // "require"'d em models/index.js, não a ordem de dependência entre
      // tabelas. Criar tudo já com "references:" falha em Postgres assim
      // que um modelo referencia uma tabela que ainda não existe nesta
      // mesma passagem (ex.: "users" aponta para "empresas", mas User
      // pode ser processado antes de Empresa) — desligar os FK checks
      // (session_replication_role) só afasta a validação em INSERT/UPDATE,
      // não dispensa a tabela referenciada de já existir no CREATE TABLE.
      for (const model of modelos) {
        const atributos = {};
        for (const [nome, definicao] of Object.entries(model.rawAttributes)) {
          const { references, ...resto } = definicao;
          atributos[nome] = resto;
        }
        await queryInterface.createTable(model.getTableName(), atributos);
      }

      // Passo 2: com todas as tabelas já criadas, acrescenta as foreign
      // keys como constraints separadas, a ordem deixa de importar.
      for (const model of modelos) {
        for (const [nome, definicao] of Object.entries(model.rawAttributes)) {
          if (!definicao.references) continue;
          const tabela = model.getTableName();
          const coluna = definicao.field || nome;
          await queryInterface.addConstraint(tabela, {
            fields: [coluna],
            type: "foreign key",
            name: `fk_${tabela}_${coluna}`,
            references: {
              table: definicao.references.model,
              field: definicao.references.key || "id",
            },
          });
        }
      }
    } finally {
      await religarFkChecks(queryInterface);
    }
  },

  async down(queryInterface) {
    await desligarFkChecks(queryInterface);
    try {
      for (const model of Object.values(sequelize.models)) {
        // cascade: true porque as foreign keys entre estas tabelas agora
        // são constraints à parte (ver passo 2 do up()); sem isso, apagar
        // uma tabela referenciada por outra falha mesmo com os FK checks
        // desligados (session_replication_role não dispensa essa
        // verificação de dependência no DROP TABLE).
        await queryInterface.dropTable(model.getTableName(), { cascade: true });
      }
    } finally {
      await religarFkChecks(queryInterface);
    }
  },
};
