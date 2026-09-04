const rateLimit = require("express-rate-limit");

/*
  ==========================================================
  RATE LIMITING, ENDPOINTS PÚBLICOS
  ==========================================================
  ponytail: janelas fixas em memória (default do express-rate-limit).
  Chega para um único processo/instância. Se um dia correres vários
  processos do backend atrás de um load balancer, isto passa a ser
  por processo (não partilhado), troca a store por Redis nessa altura.
*/

// Login, registo, OTP, bootstrap, tentativas repetidas são o alvo mais óbvio.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas tentativas. Tenta novamente dentro de alguns minutos." },
});

// Simulador e pedido de acesso, só para não deixar alguém encher a tabela.
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados pedidos. Tenta novamente dentro de alguns minutos." },
});

// Rede de segurança para TODA a API (montado uma vez em server.js, antes das
// rotas), cobre os endpoints autenticados do backoffice/portal, que antes
// não tinham limite nenhum. Continua a ser por IP (não por utilizador
// autenticado): manter simples e consistente com os limiters acima, que já
// usam a mesma abordagem. 300 pedidos/15min por IP é generoso para uso
// normal (a aplicação não faz polling, só pedidos ao carregar cada página),
// mas trava scraping/força-bruta genérico. Os limiters acima (authLimiter,
// publicLimiter) continuam a aplicar-se por cima deste, mais apertados, nas
// rotas sensíveis específicas, os contadores são independentes, por isso
// empilham sem conflito.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados pedidos. Tenta novamente dentro de alguns minutos." },
});

module.exports = { authLimiter, publicLimiter, apiLimiter };
