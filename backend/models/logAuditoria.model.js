const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo LogAuditoria:
  registra ações importantes feitas no sistema.
*/
const LogAuditoria = sequelize.define(
  "LogAuditoria",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_id",
    },

    acao: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    entidade: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    entidadeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "entidade_id",
    },

    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    // A MAGIA ESTÁ AQUI:
    underscored: true, // Traduz created_at -> created_at e updatedAt -> updatedAt na BD
    timestamps: true,  // Garante que o Sequelize gere os carimbos de data automaticamente
    tableName: "logs_auditoria",
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      // getAllLogsAuditoria (logAuditoria.controller.js) faz JOIN a users
      // (scoping por empresa) e ordena por created_at.
      { fields: ["user_id", "created_at"] },
      { fields: ["entidade", "entidade_id"] },
    ],
  }
);

module.exports = LogAuditoria;