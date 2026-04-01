const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo PedidoCredito:
  tabela principal do processo de crédito.
*/
const PedidoCredito = sequelize.define(
  "PedidoCredito",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    numeroPedido: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "numero_pedido",
    },

    mutuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "mutuario_id",
    },

    valorSolicitado: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "valor_solicitado",
    },

    finalidade: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    pacoteFinanciamento: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: "pacote_financiamento",
    },

    status: {
      type: DataTypes.ENUM(
        "RASCUNHO",
        "SUBMETIDO",
        "EM_ANALISE",
        "EM_VALIDACAO",
        "APROVADO",
        "REJEITADO",
        "DESEMBOLSADO",
        "ENCERRADO"
      ),
      allowNull: false,
      defaultValue: "SUBMETIDO",
    },

    etapaAtual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "etapa_atual",
    },

    dataSubmissao: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "data_submissao",
    },

    prazoAvaliacao: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "prazo_avaliacao",
    },

    prazoValidacao: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "prazo_validacao",
    },

    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "created_by",
    },
  },
  {
    tableName: "pedidos_credito",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = PedidoCredito;