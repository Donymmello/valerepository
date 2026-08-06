const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Empresa = sequelize.define(
  "Empresa",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },

    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    nuit: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    telefone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    plano: {
      type: DataTypes.ENUM(
        "STARTER",
        "BUSINESS",
        "ENTERPRISE"
      ),
      defaultValue: "STARTER",
    },

    estado: {
      type: DataTypes.ENUM(
        "ATIVA",
        "SUSPENSA",
        "CANCELADA"
      ),
      defaultValue: "ATIVA",
    },
  },
  {
    tableName: "empresas",
    underscored: true,
    timestamps: true,
  }
);

module.exports = Empresa;