const {DataTypes} = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo RequisitoCredito:
  representa os requisitos necessários para a aprovação de um pedido de crédito.
*/  

const RequisitoCredito = sequelize.define("RequisitoCredito", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  empresaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "empresa_id",
  },
  nome: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  obrigatorio: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  ativo : {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
}, 
{
  // A MAGIA ESTÁ AQUI:
  underscored: true, // Traduz created_at -> created_at e updatedAt -> updatedAt na BD
  timestamps: true,  // Garante que o Sequelize gere os carimbos de data automaticamente
  tableName: "requisitos_credito",
  createdAt: "created_at",
  updatedAt: "updated_at"
});

module.exports = RequisitoCredito;