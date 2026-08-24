"use strict";

/*
  Aplica ao esquema real da BD as mudanças de modelo desta sessão que o
  DB_ALTER nunca conseguiu aplicar por completo (confirmado por dois
  sintomas: "Column 'empresa_id' cannot be null" ao criar um SUPERADMIN,
  e a tabela solicitacoes_acesso em falta nos logs). Cada passo verifica
  o estado atual antes de alterar, por isso é seguro correr esta
  migration independentemente de quanto já tenha sido aplicado
  manualmente antes.
*/

const { enumJaTemValores } = require("../utils/migrationHelpers");

module.exports = {
  async up(queryInterface, Sequelize) {
    const usersDesc = await queryInterface.describeTable("users");

    if (usersDesc.empresa_id.allowNull === false) {
      // Nota: incluir "references" aqui faz o MySQL/Sequelize gerar um
      // ALTER TABLE que não aplica a mudança de allowNull, sem dar erro
      // nenhum. Não é preciso de qualquer forma — não estamos a mexer
      // na foreign key, só na obrigatoriedade da coluna.
      await queryInterface.changeColumn("users", "empresa_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!(await enumJaTemValores(queryInterface, "users", "role", ["SUPERADMIN"]))) {
      await queryInterface.changeColumn("users", "role", {
        type: Sequelize.ENUM("SUPERADMIN", "ADMIN", "GESTOR", "ANALISTA", "DIRETOR", "MUTUARIO", "USER"),
        allowNull: false,
        defaultValue: "USER",
      });
    }

    const empresasDesc = await queryInterface.describeTable("empresas");

    if (!(await enumJaTemValores(queryInterface, "empresas", "estado", ["TESTE"]))) {
      await queryInterface.changeColumn("empresas", "estado", {
        type: Sequelize.ENUM("TESTE", "ATIVA", "SUSPENSA", "CANCELADA"),
        defaultValue: "TESTE",
      });
    }

    if (!empresasDesc.trial_ends_at) {
      await queryInterface.addColumn("empresas", "trial_ends_at", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    const tabelas = await queryInterface.showAllTables();
    const existeSolicitacoes = tabelas.some(
      (t) => String(t).toLowerCase() === "solicitacoes_acesso"
    );

    if (!existeSolicitacoes) {
      await queryInterface.createTable("solicitacoes_acesso", {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        nome_empresa: { type: Sequelize.STRING(150), allowNull: false },
        nome_contacto: { type: Sequelize.STRING(150), allowNull: false },
        email: { type: Sequelize.STRING(150), allowNull: false },
        telefone: { type: Sequelize.STRING(30), allowNull: true },
        mensagem: { type: Sequelize.TEXT, allowNull: true },
        estado: {
          type: Sequelize.ENUM("PENDENTE", "CONTACTADO", "CONVERTIDO", "REJEITADO"),
          defaultValue: "PENDENTE",
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("solicitacoes_acesso");
    await queryInterface.removeColumn("empresas", "trial_ends_at");
    await queryInterface.changeColumn("empresas", "estado", {
      type: Sequelize.ENUM("ATIVA", "SUSPENSA", "CANCELADA"),
      defaultValue: "ATIVA",
    });
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM("ADMIN", "GESTOR", "ANALISTA", "DIRETOR", "MUTUARIO", "USER"),
      allowNull: false,
      defaultValue: "USER",
    });
    await queryInterface.changeColumn("users", "empresa_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
