const jwt = require("jsonwebtoken");

/*
  ==========================================================
  MIDDLEWARE DE AUTENTICAÇÃO OPCIONAL
  ==========================================================
  Diferente do authMiddleware normal, este NUNCA bloqueia o
  pedido. Se vier um token válido, popula req.user. Se não
  vier token (ou for inválido), simplesmente segue em frente
  com req.user undefined.

  Usado em rotas públicas que têm comportamento extra quando
  o utilizador está autenticado (ex: simular crédito).
*/
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(); // sem token, segue como visitante anónimo
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return next(); // formato inválido, ignora e segue como anónimo
    }

    const token = parts[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    // Token inválido/expirado: não bloqueia, apenas segue sem req.user
    next();
  }
};

module.exports = optionalAuthMiddleware;