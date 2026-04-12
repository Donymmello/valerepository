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
  tableName: "requisitos_credito",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

module.exports = RequisitoCredito;