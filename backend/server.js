const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const syncDatabase = require("./config/databaseSync");
require("dotenv").config();

// Importar middlewares de monitoramento
const requestIdMiddleware = require("./middleware/requestId.middleware");
const { errorHandlerMiddleware } = require("./middleware/errorHandler.middleware");
const { performanceMetricsMiddleware } = require("./middleware/performanceMetrics.middleware");
const logger = require("./utils/logger");

/*
  ==========================================================
  CRIAÇÃO DA APLICAÇÃO EXPRESS
  ==========================================================
  Aqui criamos a aplicação principal da API.
*/
const app = express();

/*
  ==========================================================
  MIDDLEWARES GLOBAIS - ORDEM IMPORTANTE
  ==========================================================
  1. RequestID - deve ser primeiro para rastrear tudo
  2. JSON parsing
  3. CORS
  4. Performance metrics
  5. Handlers específicos
  6. Error handler - deve ser último
*/
app.use(requestIdMiddleware); // ✅ Request ID
app.use(express.json());
app.use(cors());
app.use(performanceMetricsMiddleware); // ✅ Performance Metrics

/*
  ==========================================================
  IMPORTAÇÃO DAS ROTAS
  ==========================================================
  Aqui importamos as rotas de autenticação.
*/
const healthRoutes = require("./routes/health.routes");
const monitoringRoutes = require("./routes/monitoring.routes");
const authRoutes = require("./routes/auth.routes");
const pedidoCreditoRoutes = require("./routes/pedidoCredito.routes");
const mutuarioRoutes = require("./routes/mutuario.routes");
const aprovacaoPedidoRoutes = require("./routes/aprovacaoPedido.routes");
const notificacaoRoutes = require("./routes/notificacao.routes");
const logAuditoriaRoutes = require("./routes/logAuditoria.routes");
const desembolsoRoutes = require("./routes/desembolso.routes");
const reembolsoRoutes = require("./routes/reembolso.routes");
const extratoRoutes = require("./routes/extrato.routes");
const relatorioRoutes = require("./routes/relatorio.routes");
const alertaPrazoRoutes = require("./routes/alertaPrazo.routes");
const requisitoCreditoRoutes = require("./routes/requisitoCredito.routes");
const pedidoRequisitoRoutes = require("./routes/pedidoRequisito.routes");
const excellRoutes = require("./routes/excell.routes");
const portalExcelRoutes = require("./routes/portalExcel.routes");
const portalMutuarioRoutes = require("./routes/portalMutuario.routes");
const vincularMutuarioRoutes = require("./routes/vincularMutuario.routes");
const alertaPagamentoRoutes = require("./routes/alertaPagamento.routes");
const anexoRoutes = require("./routes/anexo.routes");
const simulacaoRoutes = require("./routes/simulacao.routes");
const comprovativoRoutes = require("./routes/comprovativo.routes");
const creditoRoutes = require("./routes/credito.routes");

/*
  ==========================================================
  REGISTO DAS ROTAS
  ==========================================================
  Tudo que começar por /api será tratado nas respetivas rotas.
*/
app.use("/api/health", healthRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pedidos-credito", pedidoCreditoRoutes);
app.use("/api/mutuarios", mutuarioRoutes);
app.use("/api/aprovacoes", aprovacaoPedidoRoutes);
app.use("/api/notificacoes", notificacaoRoutes);
app.use("/api/logs-auditoria", logAuditoriaRoutes);
app.use("/api/desembolsos", desembolsoRoutes);
app.use("/api/reembolsos", reembolsoRoutes);
app.use("/api/creditos", creditoRoutes);
app.use("/api/extrato", extratoRoutes);
app.use("/api/relatorios", relatorioRoutes);
app.use("/api/alertas-prazo", alertaPrazoRoutes);
app.use("/api/requisitos-credito", requisitoCreditoRoutes);
app.use("/api/pedido-requisitos", pedidoRequisitoRoutes);
app.use("/api", excellRoutes);
app.use("/api", portalMutuarioRoutes);
app.use("/api", vincularMutuarioRoutes);
app.use("/api/portal/export", portalExcelRoutes);
app.use("/api/alertas-pagamento", alertaPagamentoRoutes);
app.use("/api/anexos", anexoRoutes);
app.use("/api/simulacao", simulacaoRoutes);
app.use("/api/comprovativos", comprovativoRoutes);

/*
  ==========================================================
  ERROR HANDLER - Deve ser o último middleware
  ==========================================================
*/
app.use(errorHandlerMiddleware); // ✅ Error Handler com Stack Trace

/*
  ==========================================================
  PORTA DO SERVIDOR
  ==========================================================
*/
const PORT = process.env.PORT || 5000;

/*
  ==========================================================
  FUNÇÃO PRINCIPAL PARA INICIAR O SERVIDOR
  ==========================================================
  Esta função:
  1. testa a ligação com a base de dados
  2. sincroniza os models
  3. levanta o servidor Express
*/
async function startServer() {
  try {
    // Testa a ligação com a base de dados
    await sequelize.authenticate();
    logger.info("Ligação com MySQL estabelecida com sucesso.", {
      database: process.env.DB_NAME,
    });

    // Sincroniza os models com a base de dados
    await syncDatabase();
    

    // Inicia o servidor HTTP
    app.listen(PORT, () => {
      logger.info(`Servidor rodando`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        url: `http://localhost:${PORT}`,
      });
    });
  } catch (error) {
    logger.error("Erro ao iniciar servidor", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

startServer();