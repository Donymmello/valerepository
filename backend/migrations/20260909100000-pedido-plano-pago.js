"use strict";

/*
  Estende solicitacoes_acesso com o plano escolhido (pedido de plano
  pago com pagamento manual, ver TrialSection.jsx e
  controllers/solicitacaoAcesso.controller.js). Um pedido antigo
  "prefiro falar com alguém", sem plano, fica com os 3 campos a null,
  continua a funcionar exatamente como antes.

  Ver scripts/aplicarSchemaPedidoPlano.js para aplicar diretamente na
  VPS (a baseline nunca foi marcada no SequelizeMeta, ver os outros
  scripts aplicarSchema*).
*/
module.exports = {
  async up(queryInterface, Sequelize) {
    const desc = await queryInterface.describeTable("solicitacoes_acesso");

    if (!desc.plano) {
      await queryInterface.addColumn("solicitacoes_acesso", "plano", {
        type: Sequelize.ENUM("STARTER", "BUSINESS", "ENTERPRISE"),
        allowNull: true,
      });
    }

    if (!desc.ciclo_faturacao) {
      await queryInterface.addColumn("solicitacoes_acesso", "ciclo_faturacao", {
        type: Sequelize.ENUM("MENSAL", "ANUAL"),
        allowNull: true,
      });
    }

    if (!desc.valor_estimado) {
      await queryInterface.addColumn("solicitacoes_acesso", "valor_estimado", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("solicitacoes_acesso", "plano");
    await queryInterface.removeColumn("solicitacoes_acesso", "ciclo_faturacao");
    await queryInterface.removeColumn("solicitacoes_acesso", "valor_estimado");
    // Remove os tipos ENUM órfãos que o Postgres cria por trás das colunas
    // acima (o Sequelize não os apaga sozinho no down de removeColumn).
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_solicitacoes_acesso_plano";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_solicitacoes_acesso_ciclo_faturacao";`
    );
  },
};
