const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo Notificacao:
  usado para alertas do sistema.
*/
const Notificacao = sequelize.define(
  "Notificacao",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },

    /*
      Liga a notificação ao pedido, quando aplicável
    */
    pedidoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "pedido_id",
    },

    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    mensagem: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // PEDIDO_CRIADO e ALERTA_PAGAMENTO foram adicionados depois, o
    // frontend (Notificacoes.jsx, MinhasNotificacoes.jsx) já tinha rótulo
    // e cor prontos para os dois, mas o ENUM nunca tinha sido atualizado
    // aqui. pedidoCredito.controller.js usava PEDIDO_CRIADO (falhava
    // silenciosamente, tem try/catch) e alertaPagamento.controller.js
    // usava ALERTA_PAGAMENTO (rebentava a chamada inteira, sem try/catch
    // à volta do create, alertas de pagamento nunca chegaram a
    // funcionar). Ver migration 20260816120000-add-notificacao-tipos.js.
    tipo: {
      type: DataTypes.ENUM("ALERTA_PRAZO", "ALERTA_PAGAMENTO", "APROVACAO", "REJEICAO", "SISTEMA", "REQUISITO", "PEDIDO_CRIADO"),
      allowNull: false,
      defaultValue: "SISTEMA",
    },

    lida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    // A MAGIA ESTÁ AQUI:
    underscored: true, // Traduz created_at -> created_at e updatedAt -> updatedAt na BD
    timestamps: true,  // Garante que o Sequelize gere os carimbos de data automaticamente
    tableName: "notificacoes",
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      // getMinhasNotificacoes (notificacao.controller.js) filtra por
      // userId e ordena por created_at, composto cobre os dois.
      { fields: ["user_id", "created_at"] },
      { fields: ["pedido_id"] },
    ],
  }
);

module.exports = Notificacao;