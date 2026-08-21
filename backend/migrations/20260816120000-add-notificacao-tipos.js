"use strict";

/*
  Adiciona "PEDIDO_CRIADO" e "ALERTA_PAGAMENTO" ao ENUM de
  notificacoes.tipo. Já eram usados no código (pedidoCredito.controller.js
  e alertaPagamento.controller.js) e já tinham suporte no frontend
  (Notificacoes.jsx, MinhasNotificacoes.jsx), mas nunca tinham sido
  adicionados ao ENUM real da coluna — qualquer notificação desses dois
  tipos falhava na validação do MySQL. Ver nota em models/notificacao.model.js.

  Idempotente — seguro correr mais de uma vez, tal como as anteriores.
*/

const TIPOS_ATUAIS = ["ALERTA_PRAZO", "ALERTA_PAGAMENTO", "APROVACAO", "REJEICAO", "SISTEMA", "REQUISITO", "PEDIDO_CRIADO"];
const TIPOS_ANTERIORES = ["ALERTA_PRAZO", "APROVACAO", "REJEICAO", "SISTEMA", "REQUISITO"];

module.exports = {
  async up(queryInterface, Sequelize) {
    const notificacoesDesc = await queryInterface.describeTable("notificacoes");
    const tipoAtual = notificacoesDesc.tipo?.type || "";

    if (!tipoAtual.includes("ALERTA_PAGAMENTO") || !tipoAtual.includes("PEDIDO_CRIADO")) {
      await queryInterface.changeColumn("notificacoes", "tipo", {
        type: Sequelize.ENUM(...TIPOS_ATUAIS),
        allowNull: false,
        defaultValue: "SISTEMA",
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("notificacoes", "tipo", {
      type: Sequelize.ENUM(...TIPOS_ANTERIORES),
      allowNull: false,
      defaultValue: "SISTEMA",
    });
  },
};
