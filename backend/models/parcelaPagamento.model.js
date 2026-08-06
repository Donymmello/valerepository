const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ParcelaPagamento = sequelize.define(
    "ParcelaPagamento",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        creditoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        empresaId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "empresa_id",
        },
        numeroParcela: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        valorPrevisto: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        dataVencimento: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        estado: {
            type: DataTypes.ENUM("PENDENTE", "PAGO", "ATRASADO"),
            allowNull: false,
            defaultValue: "PENDENTE",
        },
        valorPago: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            defaultValue: 0,
        },

        saldoParcela: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false
        },
        dataPagamento: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        observacoes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "parcelas_pagamento",
        underscored: true,
    }
);

module.exports = ParcelaPagamento;