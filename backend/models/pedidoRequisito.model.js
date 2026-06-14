const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/*
  Modelo PedidoRequisito:
  representa a relação entre um pedido de crédito e os requisitos que foram cumpridos ou não.
*/

const PedidoRequisito = sequelize.define('PedidoRequisito', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'pedido_id',
    },

    requisitoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'requisito_id',
    },

    estado: {
        type: DataTypes.ENUM('PENDENTE', 'APROVADO', 'REJETADO'),
        allowNull: false,
        defaultValue: 'PENDENTE'
    },

    observacoes: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    validadoPor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'validado_por'
    },

    dataValidacao: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'data_validacao'
    },
},
    {
        tableName: 'pedidos_requisitos',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

module.exports = PedidoRequisito;