const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const PedidoRequisito = require("./pedidoRequisito.model");

const Anexo = sequelize.define(
    "Anexo",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        pedidoRequisitoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "pedido_requisito_id",
        },

        nome: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        arquivo: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "mime_type",
        },

        tamanho: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            fielf: "user_id",
        },
    },
    {
        // A MAGIA ESTÁ AQUI:
        underscored: true, // Traduz created_at -> created_at e updatedAt -> updatedAt na BD
        timestamps: true,  // Garante que o Sequelize gere os carimbos de data automaticamente
        tableName: "anexos",
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = Anexo;