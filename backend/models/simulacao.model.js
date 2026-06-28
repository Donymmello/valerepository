const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Simulacao = sequelize.define(
  "Simulacao",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // alterado: permite simulação anónima (sem login)
      field: "user_id",
    },

    valorSolicitado: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },

    prazo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    taxa: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: false,
    },

    prestacao: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },

    jurosTotal: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: "juros_total",
    },

    montanteTotal: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: "montante_total",
    },
  },
  {
    tableName: "simulacoes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Simulacao;