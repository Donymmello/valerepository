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
  }
);

module.exports = LogAuditoria;