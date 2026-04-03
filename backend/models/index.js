const sequelize = require("../config/db");

const User = require("./user.model");
const Mutuario = require("./mutuario.model");
const PedidoCredito = require("./pedidoCredito.model");
const AprovacaoPedido = require("./aprovacaoPedido.model");
const Notificacao = require("./notificacao.model");
const LogAuditoria = require("./logAuditoria.model");
const Desembolso = require("./desembolso.model");
const Reembolso = require("./reembolso.model");

/*
  =========================
  RELACIONAMENTOS
  =========================
*/

/*
  Um utilizador pode estar ligado a um mutuário.
*/
User.hasOne(Mutuario, {
  foreignKey: "userId",
  as: "mutuario",
});

Mutuario.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
  Um mutuário pode ter muitos pedidos de crédito.
*/
Mutuario.hasMany(PedidoCredito, {
  foreignKey: "mutuarioId",
  as: "pedidosCredito",
});

PedidoCredito.belongsTo(Mutuario, {
  foreignKey: "mutuarioId",
  as: "mutuario",
});

/*
  Um utilizador pode criar muitos pedidos.
*/
User.hasMany(PedidoCredito, {
  foreignKey: "createdBy",
  as: "pedidosCriados",
});

PedidoCredito.belongsTo(User, {
  foreignKey: "createdBy",
  as: "criador",
});

/*
  Um pedido pode ter várias aprovações.
*/
PedidoCredito.hasMany(AprovacaoPedido, {
  foreignKey: "pedidoId",
  as: "aprovacoes",
});

AprovacaoPedido.belongsTo(PedidoCredito, {
  foreignKey: "pedidoId",
  as: "pedido",
});

/*
  Um utilizador pode aprovar muitos pedidos.
*/
User.hasMany(AprovacaoPedido, {
  foreignKey: "aprovadorId",
  as: "aprovacoesFeitas",
});

AprovacaoPedido.belongsTo(User, {
  foreignKey: "aprovadorId",
  as: "aprovador",
});

/*
  Um utilizador pode ter várias notificações.
*/
User.hasMany(Notificacao, {
  foreignKey: "userId",
  as: "notificacoes",
});

Notificacao.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
  Um utilizador pode ter vários logs.
*/
User.hasMany(LogAuditoria, {
  foreignKey: "userId",
  as: "logs",
});

LogAuditoria.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
  Um utilizador pode registar vários desembolsos.
*/
User.hasMany(Desembolso, {
  foreignKey: "createdBy",
  as: "desembolsosCriados",
});

Desembolso.belongsTo(User, {
  foreignKey: "createdBy",
  as: "criador",
});

/*
  Um pedido pode ter vários reembolsos.
*/
PedidoCredito.hasMany(Reembolso, {
  foreignKey: "pedidoId",
  as: "reembolsos",
});

Reembolso.belongsTo(PedidoCredito, {
  foreignKey: "pedidoId",
  as: "pedido",
});

/*
  Um utilizador pode registar vários reembolsos.
*/
User.hasMany(Reembolso, {
  foreignKey: "createdBy",
  as: "reembolsosCriados",
});

Reembolso.belongsTo(User, {
  foreignKey: "createdBy",
  as: "criador",
});


module.exports = {
  sequelize,
  User,
  Mutuario,
  PedidoCredito,
  AprovacaoPedido,
  Notificacao,
  LogAuditoria,
  Desembolso,
  Reembolso,
};