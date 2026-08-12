const rateLimit = require("express-rate-limit");

/*
  ==========================================================
  RATE LIMITING — ENDPOINTS PÚBLICOS
  ==========================================================
  ponytail: janelas fixas em memória (default do express-rate-limit).
  Chega para um único processo/instância. Se um dia correres vários
  processos do backend atrás de um load balancer, isto passa a ser
  por processo (não partilhado) — troca a store por Redis nessa altura.
*/

// Login, registo, OTP, bootstrap — tentativas repetidas são o alvo mais óbvio.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas tentativas. Tenta novamente dentro de alguns minutos." },
});

// Simulador e pedido de acesso — só para não deixar alguém encher a tabela.
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados pedidos. Tenta novamente dentro de alguns minutos." },
});

module.exports = { authLimiter, publicLimiter };
