const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo AprovacaoPedido:
  guarda cada etapa de aprovação do pedido.
  Exemplo:
  - nível 1
  - nível 2
  - nível 3
*/
const AprovacaoPedido = sequelize.define(
  "AprovacaoPedido",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    pedidoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "pedido_id",
    },

    nivel: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    aprovadorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "aprovador_id",
    },

    decisao: {
      type: DataTypes.ENUM("PENDENTE", "APROVADO", "REJEITADO"),
      allowNull: false,
      defaultValue: "PENDENTE",
    },

    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    dataDecisao: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "data_decisao",
    },
  },
  {
    // A MAGIA ESTÁ AQUI:
    underscored: true, // Traduz created_at -> created_at e updatedAt -> updatedAt na BD
    timestamps: true,  // Garante que o Sequelize gere os carimbos de data automaticamente
    tableName: "aprovacoes_pedido",
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = AprovacaoPedido;