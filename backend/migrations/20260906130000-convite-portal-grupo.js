"use strict";

/*
  Convites de grupo: substitui o campo booleano "usado" por um par
  max_usos/total_usos (ver models/convitePortal.model.js). Migra o
  estado existente antes de remover a coluna antiga: um convite já
  marcado como usado fica com max_usos=1, total_usos=1 (continua
  esgotado, exatamente como estava); um por usar fica max_usos=1,
  total_usos=0 (continua válido, uso único, como sempre foi).

  Ver scripts/aplicarSchemaConvitesGrupo.js para aplicar diretamente na
  VPS (o mesmo motivo dos outros scripts aplicarSchema*: a baseline
  nunca foi marcada no SequelizeMeta).
*/
module.exports = {
  async up(queryInterface, Sequelize) {
    const desc = await queryInterface.describeTable("convites_portal");

    if (!desc.max_usos) {
      await queryInterface.addColumn("convites_portal", "max_usos", {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1,
      });
    }

    if (!desc.total_usos) {
      await queryInterface.addColumn("convites_portal", "total_usos", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (desc.usado) {
      await queryInterface.sequelize.query(
        `UPDATE convites_portal SET max_usos = 1, total_usos = CASE WHEN usado THEN 1 ELSE 0 END`
      );
      await queryInterface.removeColumn("convites_portal", "usado");
    }
  },

  async down(queryInterface, Sequelize) {
    const desc = await queryInterface.describeTable("convites_portal");

    if (!desc.usado) {
      await queryInterface.addColumn("convites_portal", "usado", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      });
      await queryInterface.sequelize.query(
        `UPDATE convites_portal SET usado = (total_usos > 0)`
      );
    }

    await queryInterface.removeColumn("convites_portal", "max_usos");
    await queryInterface.removeColumn("convites_portal", "total_usos");
  },
};
