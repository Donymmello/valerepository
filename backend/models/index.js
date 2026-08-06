const sequelize = require("../config/db");


const User = require("./user.model");
const Mutuario = require("./mutuario.model");
const PedidoCredito = require("./pedidoCredito.model");
const Credito = require("./credito.model");
const ParcelaPagamento = require("./parcelaPagamento.model");
const Comprovativo = require("./comprovativo.model");
const Anexo = require("./anexo.model");
const Simulacao = require("./simulacao.model");
const AprovacaoPedido = require("./aprovacaoPedido.model");
const Notificacao = require("./notificacao.model");
const LogAuditoria = require("./logAuditoria.model");
const Desembolso = require("./desembolso.model");
const Reembolso = require("./reembolso.model");
const RequisitoCredito = require("./requisitoCredito.model");
const PedidoRequisito = require("./pedidoRequisito.model");
const Empresa = require("./empresa.model");
const PasswordResetToken = require("./passwordResetToken")(sequelize);
const EmailVerificationToken = require("./emailVerificationToken")(sequelize);

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
  Um pedido pode ter várias notificações.
*/
PedidoCredito.hasMany(Notificacao, {
  foreignKey: "pedidoId",
  as: "notificacoesPedido",
});

Notificacao.belongsTo(PedidoCredito, {
  foreignKey: "pedidoId",
  as: "pedido",
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

Reembolso.belongsTo(ParcelaPagamento, {
  foreignKey: "parcelaId",
  as: "parcela",
});

/*
  Um pedido pode ter vários requisitos.
*/
PedidoCredito.hasMany(PedidoRequisito, {
  foreignKey: "pedidoId",
  as: "requisitosPedido",
});

PedidoRequisito.belongsTo(PedidoCredito, {
  foreignKey: "pedidoId",
  as: "pedido",
});

/*
  Um requisito pode aparecer em vários pedidos.
*/
RequisitoCredito.hasMany(PedidoRequisito, {
  foreignKey: "requisitoId",
  as: "itensPedido",
});

PedidoRequisito.belongsTo(RequisitoCredito, {
  foreignKey: "requisitoId",
  as: "requisito",
});

/*
  Um utilizador pode validar vários requisitos de pedido.
*/
User.hasMany(PedidoRequisito, {
  foreignKey: "validadoPor",
  as: "requisitosValidados",
});

PedidoRequisito.belongsTo(User, {
  foreignKey: "validadoPor",
  as: "validador",
});

PedidoRequisito.hasMany(Anexo, {
  foreignKey: "pedidoRequisitoId",
  as: "anexos",
});

Anexo.belongsTo(PedidoRequisito, {
  foreignKey: "pedidoRequisitoId",
  as: "pedidoRequisito",
});

Credito.belongsTo(PedidoCredito, {
  foreignKey: "pedidoId",
  as: "pedido",
});

PedidoCredito.hasMany(Credito, {
  foreignKey: "pedidoId",
  as: "creditos",
});

Mutuario.hasMany(Credito, {
  foreignKey: "mutuarioId",
  as: "creditos",
});

Credito.belongsTo(Mutuario, {
  foreignKey: "mutuarioId",
  as: "mutuario",
});

Credito.hasMany(ParcelaPagamento, {
  foreignKey: "creditoId",
  as: "parcelas",
});

Credito.hasMany(Reembolso, {
  foreignKey: "creditoId",
  as: "reembolsos",
});

ParcelaPagamento.belongsTo(Credito, {
  foreignKey: "creditoId",
  as: "credito",
});

Reembolso.belongsTo(Credito, {
  foreignKey: "creditoId",
  as: "credito",
});

PedidoCredito.hasMany(Desembolso, {
  foreignKey: "pedidoId",
  as: "desembolsos",
});

Desembolso.belongsTo(PedidoCredito, {
  foreignKey: "pedidoId",
  as: "pedido",
});

User.hasMany(Comprovativo, { foreignKey: "userId", as: "comprovativosEnviados" });
Comprovativo.belongsTo(User, { foreignKey: "userId", as: "remetente" });
User.hasMany(Comprovativo, { foreignKey: "validadoPor", as: "comprovativosValidados" });
Comprovativo.belongsTo(User, { foreignKey: "validadoPor", as: "validador" });

Credito.hasMany(Comprovativo, { foreignKey: "creditoId", as: "comprovativos" });
Comprovativo.belongsTo(Credito, { foreignKey: "creditoId", as: "credito" });
ParcelaPagamento.hasMany(Comprovativo, { foreignKey: "parcelaId", as: "comprovativos" });
Comprovativo.belongsTo(ParcelaPagamento, { foreignKey: "parcelaId", as: "parcela" });

Empresa.hasMany(User, {
    foreignKey: "empresaId",
    as: "utilizadores",
});

User.belongsTo(Empresa, {
    foreignKey: "empresaId",
    as: "empresa",
});


module.exports = {
  sequelize,
  User,
  Mutuario,
  PedidoCredito,
  Credito,
  AprovacaoPedido,
  Notificacao,
  LogAuditoria,
  Desembolso,
  Reembolso,
  RequisitoCredito,
  PedidoRequisito,
  ParcelaPagamento,
  Comprovativo,
  Anexo,
  Simulacao,
  Empresa,
  PasswordResetToken,
  EmailVerificationToken,
};
