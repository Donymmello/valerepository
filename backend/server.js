const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const syncDatabase = require("./config/databaseSync");
require("dotenv").config();

// Middlewares e Rotas Globais
const requestIdMiddleware = require("./middleware/requestId.middleware");
const { errorHandlerMiddleware } = require("./middleware/errorHandler.middleware");
const { performanceMetricsMiddleware } = require("./middleware/performanceMetrics.middleware");
const apiRoutes = require("./routes/index");
const logger = require("./utils/logger");

const app = express();

// =========================================================================
// MIDDLEWARES GLOBAIS
// =========================================================================
app.use(requestIdMiddleware);
app.use(express.json());
app.use(cors());
app.use(performanceMetricsMiddleware);

// =========================================================================
// CENTRAL DE ROTAS
// =========================================================================
app.use("/api", apiRoutes);

// =========================================================================
// CAPTURADOR DE ROTAS NÃO ENCONTRADAS (404 JSON)
// =========================================================================
app.use((req, res, next) => {
  return res.status(404).json({
    message: `Não foi possível encontrar a rota ${req.originalUrl} neste servidor.`
  });
});

// =========================================================================
// ERROR HANDLER (Último da cadeia)
// =========================================================================
app.use(errorHandlerMiddleware);

// =========================================================================
// INICIALIZAÇÃO DO SERVIDOR
// =========================================================================
const PORT = process.env.PORT || 5000;

// O MySQL pode ainda não estar pronto a aceitar ligações quando este
// processo arranca (mesmo com o container já "a correr"). Tenta várias
// vezes com espera entre tentativas antes de desistir.
async function conectarComRetry(tentativas = 10, delayMs = 3000) {
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      await sequelize.authenticate();
      return;
    } catch (error) {
      if (tentativa === tentativas) throw error;
      logger.warn(`Falha ao ligar à base de dados (tentativa ${tentativa}/${tentativas}). Nova tentativa em ${delayMs / 1000}s.`, {
        error: error.message,
      });
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function startServer() {
  try {
    await conectarComRetry();
    logger.info("Ligação com MySQL estabelecida com sucesso.", { database: process.env.DB_NAME });

    await syncDatabase();

    app.listen(PORT, () => {
      logger.info(`Servidor rodando`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        url: `http://localhost:${PORT}`,
      });
    });
  } catch (error) {
    logger.error("Erro ao iniciar servidor", { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();