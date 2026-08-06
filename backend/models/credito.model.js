// models/credito.model.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");


  const Credito = sequelize.define(
    "Credito",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      numeroContrato: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },

      pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      simulacaoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      desembolsoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      mutuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      empresaId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "empresa_id",
          },

      valorOriginal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      saldoAtual: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      totalPago: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },

      prazo: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      taxa: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },

      prestacao: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      jurosTotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      montanteTotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      estado: {
        type: DataTypes.ENUM(
          "ATIVO",
          "LIQUIDADO",
          "INCUMPRIMENTO",
          "REESTRUTURADO"
        ),
        defaultValue: "ATIVO",
      },

      dataInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      dataFimPrevista: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      dataLiquidacao: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      observacoes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "creditos",
      underscored: true,
      timestamps: true,
    }
  );

  module.exports = Credito;
