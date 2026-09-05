const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { sequelize } = require("./models");
const syncDatabase = require("./config/databaseSync");
require("dotenv").config();

// Middlewares e Rotas Globais
const requestIdMiddleware = require("./middleware/requestId.middleware");
const { errorHandlerMiddleware } = require("./middleware/errorHandler.middleware");
const { performanceMetricsMiddleware } = require("./middleware/performanceMetrics.middleware");
const { apiLimiter } = require("./middleware/rateLimit.middleware");
const apiRoutes = require("./routes/index");
const logger = require("./utils/logger");
const { iniciarAgendador } = require("./services/agendador.service");

const app = express();

// Em produção o backend só é alcançado através do Caddy (reverse proxy da
// VPS), nunca diretamente da internet (ver docker-compose.yml, porta só em
// 127.0.0.1). "1" = confiar apenas no primeiro hop (o próprio Caddy) para
// os headers X-Forwarded-*, não em qualquer proxy encadeado depois dele.
// Sem isto, o Express ignora X-Forwarded-For por omissão e o
// express-rate-limit rejeita o pedido (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR),
// derrubando toda a API atrás do rate limiter (login incluído).
app.set("trust proxy", 1);

// =========================================================================
// MIDDLEWARES GLOBAIS
// =========================================================================
// Origens permitidas: FRONTEND_URL sempre; extras via CORS_EXTRA_ORIGINS (separadas por vírgula).
const origensPermitidas = [process.env.FRONTEND_URL, ...(process.env.CORS_EXTRA_ORIGINS || "").split(",")]
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(requestIdMiddleware);
app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin(origem, callback) {
      // Requisições sem "origin" (ex.: chamadas server-to-server, curl, Postman) são permitidas.
      if (!origem || origensPermitidas.includes(origem)) {
        return callback(null, true);
      }
      const erro = new Error("Origem não permitida pela política de CORS.");
      erro.statusCode = 403;
      return callback(erro);
    },
    credentials: true,
  })
);
app.use(performanceMetricsMiddleware);
// Limite de pedidos por IP em toda a API, ver middleware/rateLimit.middleware.js.
app.use("/api", apiLimiter);

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

    iniciarAgendador();

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