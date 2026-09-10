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

    // Os 3 campos abaixo só ficam preenchidos quando o pedido vem da
    // landing page já com um plano escolhido (ver TrialSection.jsx e
    // controllers/solicitacaoAcesso.controller.js). Um pedido de
    // "prefiro falar com alguém" antigo, sem plano, fica com os 3 a
    // null. valorEstimado é sempre calculado no backend a partir de
    // config/planos.js, nunca confiado no valor enviado pelo cliente.
    plano: {
      type: DataTypes.ENUM("STARTER", "BUSINESS", "ENTERPRISE"),
      allowNull: true,
    },

    cicloFaturacao: {
      type: DataTypes.ENUM("MENSAL", "ANUAL"),
      allowNull: true,
      field: "ciclo_faturacao",
    },

    valorEstimado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "valor_estimado",
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
