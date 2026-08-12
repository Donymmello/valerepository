const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo User:
  representa os utilizadores que entram no sistema.
*/
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    empresaId: {
      type: DataTypes.INTEGER,
      allowNull: true, // null apenas para role SUPERADMIN (utilizador da plataforma, não pertence a nenhuma empresa)
      field: "empresa_id",

      references: {
        model: "empresas", // Nome da tabela referenciada
        key: "id",
      },
    },

    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
    },

    role: {
      type: DataTypes.ENUM("SUPERADMIN", "ADMIN", "GESTOR", "ANALISTA", "DIRETOR", "MUTUARIO", "USER"),
      allowNull: false,
      defaultValue: "USER",
    },

    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    // A MAGIA ESTÁ AQUI:
    underscored: true, // Traduz created_at -> created_at e updatedAt -> updatedAt na BD
    timestamps: true,  // Garante que o Sequelize gere os carimbos de data automaticamente
    tableName: "users",
    createdAt: "created_at",
    updatedAt: "updated_at",

    validate: {
      // Só o utilizador da plataforma (SUPERADMIN) pode não pertencer a nenhuma empresa.
      // Todos os outros roles são sempre de uma empresa (tenant) específica.
      empresaObrigatoriaExcetoSuperadmin() {
        if (this.role !== "SUPERADMIN" && !this.empresaId) {
          throw new Error("empresaId é obrigatório para utilizadores que não sejam SUPERADMIN.");
        }
        if (this.role === "SUPERADMIN" && this.empresaId) {
          throw new Error("Um utilizador SUPERADMIN não deve estar associado a nenhuma empresa.");
        }
      },
    },
  }
);

module.exports = User;