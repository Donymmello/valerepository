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

    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    mensagem: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    tipo: {
      type: DataTypes.ENUM("ALERTA_PRAZO", "APROVACAO", "REJEICAO", "SISTEMA"),
      allowNull: false,
      defaultValue: "SISTEMA",
    },

    lida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "notificacoes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Notificacao;