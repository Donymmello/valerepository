const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Pedido de acesso à plataforma feito por uma empresa interessada,
  a partir do formulário público da landing page. Não cria nada
  sozinho, fica registado para o SUPERADMIN rever e, se fizer
  sentido, criar a Empresa manualmente (bootstrap-admin).
*/
const SolicitacaoAcesso = sequelize.define(
  "SolicitacaoAcesso",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    nomeEmpresa: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nome_empresa",
    },

    nomeContacto: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nome_contacto",
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { isEmail: true },
    },

    telefone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    mensagem: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM("PENDENTE", "CONTACTADO", "CONVERTIDO", "REJEITADO"),
      defaultValue: "PENDENTE",
    },
  },
  {
    tableName: "solicitacoes_acesso",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = SolicitacaoAcesso;
