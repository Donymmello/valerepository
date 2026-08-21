"use strict";

/*
  Torna documento_tipo, documento_numero, nuit e data_nascimento
  opcionais na tabela mutuarios. Antes eram obrigatórios logo no
  registo do mutuário (RegisterMutuario.jsx) — agora o registo pede só
  o essencial (nome, email, password, nome completo, telefone) e estes
  campos de identificação (KYC) passam a poder ser preenchidos depois,
  em "Completar Perfil" (ver portalMutuario.controller.js,
  updateMeuMutuario). A submissão de um pedido de crédito continua a
  exigir o perfil completo (ver createMeuPedido) — só o registo em si
  ficou mais leve.

  Idempotente — seguro correr mais de uma vez, tal como as anteriores.
*/

module.exports = {
  async up(queryInterface, Sequelize) {
    const mutuariosDesc = await queryInterface.describeTable("mutuarios");

    if (mutuariosDesc.documento_tipo && !mutuariosDesc.documento_tipo.allowNull) {
      await queryInterface.changeColumn("mutuarios", "documento_tipo", {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }

    if (mutuariosDesc.documento_numero && !mutuariosDesc.documento_numero.allowNull) {
      await queryInterface.changeColumn("mutuarios", "documento_numero", {
        type: Sequelize.STRING(14),
        allowNull: true,
      });
    }

    if (mutuariosDesc.nuit && !mutuariosDesc.nuit.allowNull) {
      await queryInterface.changeColumn("mutuarios", "nuit", {
        type: Sequelize.STRING(9),
        allowNull: true,
      });
    }

    if (mutuariosDesc.data_nascimento && !mutuariosDesc.data_nascimento.allowNull) {
      await queryInterface.changeColumn("mutuarios", "data_nascimento", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("mutuarios", "documento_tipo", {
      type: Sequelize.STRING(50),
      allowNull: false,
    });
    await queryInterface.changeColumn("mutuarios", "documento_numero", {
      type: Sequelize.STRING(14),
      allowNull: false,
    });
    await queryInterface.changeColumn("mutuarios", "nuit", {
      type: Sequelize.STRING(9),
      allowNull: false,
    });
    await queryInterface.changeColumn("mutuarios", "data_nascimento", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },
};
