const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo ConvitePortal:
  token de convite gerado por um utilizador interno (ADMIN/GESTOR) de uma
  Empresa, usado para controlar o registo público de mutuários no portal.
  Sem convite válido, o registo autónomo não é permitido (controlo de KYC).
*/
const ConvitePortal = sequelize.define(
  "ConvitePortal",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },

    empresaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "empresa_id",
      references: {
        model: "empresas",
        key: "id",
      },
    },

    criadoPor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "criado_por",
      references: {
        model: "users",
        key: "id",
      },
    },

    usado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    usadoPor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "usado_por",
      references: {
        model: "users",
        key: "id",
      },
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
  },
  {
    underscored: true,
    timestamps: true,
    tableName: "convites_portal",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = ConvitePortal;
