const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/*
  Modelo Reembolso:
  guarda os detalhes do reembolso de um crédito.
*/

const Reembolso = sequelize.define(
  'Reembolso',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    creditoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'credito_id'
    },

    parcelaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'parcela_id'
    },
    empresaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "empresa_id",
    },
    valorReembolsado: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'valor_reembolsado',
    },
    dataReembolso: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'data_reembolso',
    },
    meioPagamento: {
      type: DataTypes.ENUM('TRANSFERENCIA', 'CHEQUE', 'DINHEIRO'),
      allowNull: false,
      field: 'meio_pagamento',
    },
    numeroTransacao: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'numero_transacao',
    },
    referencia: {
      type: DataTypes.STRING(50),
      unique: true,
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
      field: 'created_by',
    },
  },
  {
    // A MAGIA ESTÁ AQUI:
    underscored: true, // Traduz created_at -> created_at e updatedAt -> updatedAt na BD
    timestamps: true,  // Garante que o Sequelize gere os carimbos de data automaticamente
    tableName: 'reembolsos',
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = Reembolso;