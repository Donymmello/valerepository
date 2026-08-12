const express = require("express");
const router = express.Router();

// Importação manual de todas as rotas (Mantendo as tuas importações originais)
const healthRoutes = require("./health.routes");
const monitoringRoutes = require("./monitoring.routes");
const authRoutes = require("./auth.routes");
const pedidoCreditoRoutes = require("./pedidoCredito.routes");
const mutuarioRoutes = require("./mutuario.routes");
const aprovacaoPedidoRoutes = require("./aprovacaoPedido.routes");
const notificacaoRoutes = require("./notificacao.routes");
const logAuditoriaRoutes = require("./logAuditoria.routes");
const desembolsoRoutes = require("./desembolso.routes");
const reembolsoRoutes = require("./reembolso.routes");
const extratoRoutes = require("./extrato.routes");
const relatorioRoutes = require("./relatorio.routes");
const alertaPrazoRoutes = require("./alertaPrazo.routes");
const requisitoCreditoRoutes = require("./requisitoCredito.routes");
const pedidoRequisitoRoutes = require("./pedidoRequisito.routes");
const excellRoutes = require("./excell.routes");
const portalExcelRoutes = require("./portalExcel.routes");
const portalMutuarioRoutes = require("./portalMutuario.routes");
const vincularMutuarioRoutes = require("./vincularMutuario.routes");
const alertaPagamentoRoutes = require("./alertaPagamento.routes");
const anexoRoutes = require("./anexo.routes");
const simulacaoRoutes = require("./simulacao.routes");
const comprovativoRoutes = require("./comprovativo.routes");
const creditoRoutes = require("./credito.routes");
const empresaRoutes = require("./empresa.routes");
const superadminRoutes = require("./superadmin.routes");
const solicitacaoAcessoRoutes = require("./solicitacaoAcesso.routes");

// Registo dos Namespaces
router.use("/health", healthRoutes);
router.use("/monitoring", monitoringRoutes);
router.use("/auth", authRoutes);
router.use("/pedidos-credito", pedidoCreditoRoutes);
router.use("/mutuarios", mutuarioRoutes);
router.use("/aprovacoes", aprovacaoPedidoRoutes);
router.use("/notificacoes", notificacaoRoutes);
router.use("/logs-auditoria", logAuditoriaRoutes);
router.use("/desembolsos", desembolsoRoutes);
router.use("/reembolsos", reembolsoRoutes);
router.use("/creditos", creditoRoutes);
router.use("/extrato", extratoRoutes);
router.use("/relatorios", relatorioRoutes);
router.use("/alertas-prazo", alertaPrazoRoutes);
router.use("/requisitos-credito", requisitoCreditoRoutes);
router.use("/pedido-requisitos", pedidoRequisitoRoutes);
router.use("/portal/export", portalExcelRoutes);
router.use("/alertas-pagamento", alertaPagamentoRoutes);
router.use("/anexos", anexoRoutes);
router.use("/simulacao", simulacaoRoutes);
router.use("/comprovativos", comprovativoRoutes);
router.use("/empresas", empresaRoutes);
router.use("/superadmin", superadminRoutes);
router.use("/solicitacoes-acesso", solicitacaoAcessoRoutes);

// Rotas raiz /api (Sugestão Senior: Mudar para namespaces dedicados no futuro se possível)
router.use("/", excellRoutes);
router.use("/", portalMutuarioRoutes);
router.use("/", vincularMutuarioRoutes);

module.exports = router;