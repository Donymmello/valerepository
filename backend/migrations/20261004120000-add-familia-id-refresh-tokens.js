"use strict";

/*
  familia_id em refresh_tokens: liga todos os tokens nascidos do mesmo
  login, para a rotação poder revogar a cadeia inteira quando deteta
  reutilização. Ver refreshAccessToken em controllers/auth.controller.js.

  As linhas que já existem recebem uma família própria cada uma. Não se
  podem agrupar: não há informação no registo que diga de que login é que
  cada token veio, e pô-las todas na mesma família faria com que a
  revogação de uma arrastasse as dos outros utilizadores.

  Para aplicar na VPS, onde `npm run migrate` continua por resolver por
  causa da baseline nunca marcada no SequelizeMeta:
    node scripts/aplicarSchemaRotacaoRefreshToken.js
*/
module.exports = {
  async up(queryInterface, Sequelize) {
    const tabela = await queryInterface.describeTable("refresh_tokens");
    if (tabela.familia_id) return;

    await queryInterface.addColumn("refresh_tokens", "familia_id", {
      type: Sequelize.STRING(64),
      allowNull: true,
    });

    // gen_random_uuid() é nativo no Postgres 13+ (o compose corre o 16),
    // não precisa da extensão pgcrypto.
    await queryInterface.sequelize.query(
      "UPDATE refresh_tokens SET familia_id = gen_random_uuid()::text WHERE familia_id IS NULL"
    );

    await queryInterface.changeColumn("refresh_tokens", "familia_id", {
      type: Sequelize.STRING(64),
      allowNull: false,
    });

    await queryInterface.addIndex("refresh_tokens", ["familia_id"], {
      name: "refresh_tokens_familia_id",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("refresh_tokens", "refresh_tokens_familia_id");
    await queryInterface.removeColumn("refresh_tokens", "familia_id");
  },
};
