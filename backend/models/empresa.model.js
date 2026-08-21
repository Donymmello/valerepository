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
        "TESTE",     // em período de trial (ver trialEndsAt)
        "ATIVA",     // plano pago, confirmado manualmente pelo SUPERADMIN
        "SUSPENSA",  // acesso bloqueado (trial expirado ou pagamento em atraso)
        "CANCELADA"
      ),
      defaultValue: "TESTE",
    },

    // Data em que o período de teste termina. Só é relevante enquanto
    // estado === "TESTE". Fica null assim que o SUPERADMIN confirma o
    // plano pago (estado passa a ATIVA) ou numa empresa criada já como ATIVA.
    trialEndsAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "trial_ends_at",
    },

    // Faixa de taxa de juros anual (%) que esta empresa pratica. Usada
    // como estimativa na submissão do pedido (taxaJurosMin) e como
    // limites para a taxa final escolhida pelo analista na aprovação
    // definitiva (nível 3) — ver aprovacaoPedido.controller.js.
    taxaJurosMin: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 15.0,
      field: "taxa_juros_min",
    },

    taxaJurosMax: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 30.0,
      field: "taxa_juros_max",
    },
  },
  {
    tableName: "empresas",
    underscored: true,
    timestamps: true,
  }
);

module.exports = Empresa;