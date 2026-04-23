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
    pedidoId: {
      type: DataTypes.INTEGER,
        allowNull: false,
        field: 'pedido_id',
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
    tableName: 'reembolsos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = Reembolso;