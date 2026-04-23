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
        field: "created_by",
    },
  },
    {   
    tableName: "desembolsos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Desembolso;