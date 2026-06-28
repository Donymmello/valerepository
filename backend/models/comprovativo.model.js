const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo Comprovativo:
  Guarda os comprovativos de pagamento enviados pelo mutuário.
  Ligado directamente ao pedido — o mutuário envia antes do
  backoffice registar o reembolso, servindo como prova de pagamento.
*/
const Comprovativo = sequelize.define(
  "Comprovativo",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    pedidoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "pedido_id",
    },

    // Quem enviou (mutuário autenticado)
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },

    // Ficheiro físico
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    arquivo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "mime_type",
    },

    tamanho: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Estado da validação pelo backoffice
    estado: {
      type: DataTypes.ENUM("PENDENTE", "VALIDADO", "REJEITADO"),
      allowNull: false,
      defaultValue: "PENDENTE",
    },

    // Observações do backoffice ao validar/rejeitar
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Quem validou/rejeitou
    validadoPor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "validado_por",
    },

    dataValidacao: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "data_validacao",
    },

    // Referência ao reembolso criado com base neste comprovativo (opcional)
    reembolsoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "reembolso_id",
    },
  },
  {
    tableName: "comprovativos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Comprovativo;