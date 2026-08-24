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

    // Nota: NÃO é `unique: true` aqui — o código só precisa de ser único
    // dentro da mesma empresa (tenant), não em toda a plataforma. Ver o
    // índice composto abaixo, em `indexes`.
    codigoMutuario: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "codigo_mutuario",
    },

    nomeCompleto: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "nome_completo",
    },

    // Campos de identificação (KYC). Ficaram opcionais na BD porque o
    // registo do mutuário (RegisterMutuario.jsx) já não os exige — pede
    // só o essencial para reduzir fricção. São preenchidos depois em
    // "Completar Perfil" (ver portalMutuario.controller.js,
    // updateMeuMutuario), e continuam obrigatórios antes de submeter um
    // pedido de crédito (ver createMeuPedido).
    documentoTipo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "documento_tipo",
    },

    documentoNumero: {
      type: DataTypes.STRING(14),
      allowNull: true,
      field: "documento_numero",
    },

    nuit: {
      type: DataTypes.STRING(9),
      allowNull: true,
      field: "nuit"
    },

    dataNascimento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
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
    
    empresaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "empresa_id",
    },
  },
  {
    // A MAGIA ESTÁ AQUI:
    underscored: true, // Traduz created_at -> created_at e updatedAt -> updatedAt na BD
    timestamps: true,  // Garante que o Sequelize gere os carimbos de data automaticamente
    tableName: "mutuarios",
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["empresa_id", "codigo_mutuario"],
        name: "mutuarios_empresa_id_codigo_mutuario_unique",
      },
    ],
  }
);

module.exports = Mutuario;