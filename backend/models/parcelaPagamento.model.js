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
        indexes: [
            // Query mais quente do sistema: alertas de vencimento/atraso
            // (alertaPagamento.controller.js) e relatórios filtram sempre
            // por empresa + estado, muitas vezes com dataVencimento também.
            { fields: ["empresa_id", "estado", "data_vencimento"] },
            { fields: ["credito_id"] },
        ],
    }
);

module.exports = ParcelaPagamento;