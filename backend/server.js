const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
require("dotenv").config();

/*
  ==========================================================
  CRIAÇÃO DA APLICAÇÃO EXPRESS
  ==========================================================
  Aqui criamos a aplicação principal da API.
*/
const app = express();

/*
  ==========================================================
  MIDDLEWARES GLOBAIS
  ==========================================================
  express.json() -> permite receber JSON no body
  cors()         -> permite comunicação com frontend
*/
app.use(express.json());
app.use(cors());

/*
  ==========================================================
  IMPORTAÇÃO DAS ROTAS
  ==========================================================
  Aqui importamos as rotas de autenticação.
*/
const authRoutes = require("./routes/auth.routes");
const pedidoCreditoRoutes = require("./routes/pedidoCredito.routes");
const mutuarioRoutes = require("./routes/mutuario.routes");
const aprovacaoPedidoRoutes = require("./routes/aprovacaoPedido.routes");
const notificacaoRoutes = require("./routes/notificacao.routes");
const logAuditoriaRoutes = require("./routes/logAuditoria.routes");

/*
  ==========================================================
  REGISTO DAS ROTAS
  ==========================================================
  Tudo que começar por /api/auth será tratado em authRoutes.
*/
app.use("/api/auth", authRoutes);
app.use("/api/pedidos-credito", pedidoCreditoRoutes);
app.use("/api/mutuarios", mutuarioRoutes);
app.use("/api/aprovacoes", aprovacaoPedidoRoutes);
app.use("/api/notificacoes", notificacaoRoutes);
app.use("/api/logs-auditoria", logAuditoriaRoutes);

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
    console.log("Ligação com MySQL estabelecida com sucesso.");

    // Sincroniza os models com a base de dados
    await sequelize.sync({ alter: true });
    console.log("Models sincronizados com sucesso.");

    // Inicia o servidor HTTP
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar:", error);
  }
}

startServer();