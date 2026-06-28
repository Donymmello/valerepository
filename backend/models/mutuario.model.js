const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo Mutuario:
  representa a pessoa/beneficiário do crédito.
  Pode ou não estar ligado diretamente a um utilizador do sistema.
*/
const Mutuario = sequelize.define(
  "Mutuario",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    codigoMutuario: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "codigo_mutuario",
    },

    nomeCompleto: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "nome_completo",
    },

    documentoTipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "documento_tipo",
    },

    documentoNumero: {
      type: DataTypes.STRING(14),
      allowNull: false,
      field: "documento_numero",
    },

    nuit: {
      type: DataTypes.STRING(9),
      allowNull: false,
      field: "nuit"
    },

    dataNascimento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "data_nascimento",
    },

    provincia: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    distrito: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    localResidencia: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "local_residencia",
    },

    telefone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_id",
    },
  },
  {
    tableName: "mutuarios",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Mutuario;