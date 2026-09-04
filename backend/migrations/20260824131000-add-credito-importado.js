"use strict";

/*
  Adiciona a coluna `importado` (boolean, default false) à tabela
  `creditos`, marca créditos criados pela importação de "saldo de
  abertura" (migração de empréstimos que já existiam antes deste
  sistema). Ver credito.service.js (criarCreditoImportado) e
  excell.service.js (importarExcellCreditos).

  Idempotente, segue o mesmo padrão das outras migrations deste
  projeto (describeTable antes de mexer).
*/

module.exports = {
  async up(queryInterface, Sequelize) {
    const descricao = await queryInterface.describeTable("creditos");

    if (!descricao.importado) {
      await queryInterface.addColumn("creditos", "importado", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const descricao = await queryInterface.describeTable("creditos");

    if (descricao.importado) {
      await queryInterface.removeColumn("creditos", "importado");
    }
  },
};
