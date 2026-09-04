// models/credito.model.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");


  const Credito = sequelize.define(
    "Credito",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // Sem unique:true aqui, era um índice único GLOBAL, que impedia
      // duas empresas diferentes de usarem o mesmo número de contrato
      // (mesmo bug já corrigido em codigo_mutuario/numero_pedido, ver
      // migration 20260824130000). A unicidade real é por empresa,
      // aplicada no índice composto abaixo (indexes: empresa_id + numero_contrato).
      numeroContrato: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },

      pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      simulacaoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      desembolsoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      mutuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      empresaId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "empresa_id",
          },

      valorOriginal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      saldoAtual: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      totalPago: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },

      prazo: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      taxa: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },

      prestacao: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      jurosTotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      montanteTotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },

      estado: {
        type: DataTypes.ENUM(
          "ATIVO",
          "LIQUIDADO",
          "INCUMPRIMENTO",
          "REESTRUTURADO"
        ),
        defaultValue: "ATIVO",
      },

      dataInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      dataFimPrevista: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      dataLiquidacao: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      observacoes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // true para créditos criados pela importação de "saldo de
      // abertura" (ver credito.service.js, criarCreditoImportado), um
      // crédito que já existia antes deste sistema (caderno/Excel do
      // cliente) e entrou com o saldo devedor de hoje, não com o
      // histórico completo de parcelas desde o início. Serve para
      // suporte/relatórios saberem que aquele contrato não nasceu no
      // fluxo normal pedido -> aprovação -> desembolso.
      importado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "creditos",
      underscored: true,
      timestamps: true,
      indexes: [
        // Unicidade por empresa (substitui o unique:true global de numeroContrato).
        {
          unique: true,
          fields: ["empresa_id", "numero_contrato"],
          name: "creditos_empresa_id_numero_contrato_unique",
        },
        // A esmagadora maioria das queries filtra por empresa + estado
        // (ex.: listar créditos ATIVOS da empresa), ver credito.controller.js.
        { fields: ["empresa_id", "estado"] },
        { fields: ["mutuario_id"] },
        { fields: ["pedido_id"] },
      ],
    }
  );

  module.exports = Credito;
