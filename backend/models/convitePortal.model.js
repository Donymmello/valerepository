const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo ConvitePortal:
  token de convite gerado por um utilizador interno (ADMIN/GESTOR) de uma
  Empresa, usado para controlar o registo público de mutuários no portal.
  Sem convite válido, o registo autónomo não é permitido (controlo de KYC).

  maxUsos/totalUsos substituem o antigo campo booleano "usado" (removido
  na migration 20260906130000): um convite individual (o default,
  comportamento antigo preservado) tem maxUsos=1; um convite de grupo
  (ex: link partilhado num grupo de WhatsApp) tem maxUsos > 1 ou null
  (sem limite). Válido enquanto maxUsos === null || totalUsos < maxUsos.
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

    // null = convite de grupo sem limite de registos. Um número = uso
    // único (1, o default) ou convite de grupo com limite (>1).
    maxUsos: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      field: "max_usos",
    },

    totalUsos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "total_usos",
    },

    // Último utilizador a registar-se com este convite. Num convite de
    // grupo não é "o" utilizador do convite, é só uma referência rápida
    // para depuração, o histórico completo de quem usou fica no
    // LogAuditoria (ação CRIAR_CONVITE_PORTAL / REGISTAR_MUTUARIO_*).
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
