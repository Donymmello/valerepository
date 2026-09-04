const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo Desembolso:
  guarda os detalhes do desembolso do crédito aprovado.     
*/

const Desembolso = sequelize.define(
  "Desembolso",
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
    empresaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "empresa_id",
    },
    valorDesembolsado: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "valor_desembolsado",
    },
    dataDesembolso: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "data_desembolso",
    },
    meioPagamento: {
      type: DataTypes.ENUM("TRANSFERENCIA", "CHEQUE", "DINHEIRO"),
      allowNull: false,
      field: "meio_pagamento",
    },
    numeroTransacao: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "numero_transacao",
    },
    // Sem unique:true de coluna, mesmo bug do numeroContrato em
    // Credito (índice único GLOBAL numa plataforma multi-tenant).
    // Unicidade real é por empresa, ver indexes abaixo.
    referencia: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "referencia",
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "created_by",
    },
  },
  {
    // A MAGIA ESTÁ AQUI:
    underscored: true, // Traduz created_at -> created_at e updatedAt -> updatedAt na BD
    timestamps: true,  // Garante que o Sequelize gere os carimbos de data automaticamente
    tableName: "desembolsos",
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ["empresa_id", "referencia"],
        name: "desembolsos_empresa_id_referencia_unique",
      },
      { fields: ["empresa_id"] },
      { fields: ["pedido_id"] },
    ],
  }
);

module.exports = Desembolso;