const jwt = require("jsonwebtoken");

/*
  ==========================================================
  MIDDLEWARE DE AUTENTICAÇÃO
  ==========================================================
  Este middleware protege rotas privadas.

  O que ele faz:
  1. Lê o token enviado no header Authorization
  2. Verifica se o token existe
  3. Valida o token
  4. Coloca os dados do utilizador em req.user
  5. Permite continuar para a próxima função
*/
const authMiddleware = (req, res, next) => {
  try {
    // Lê o header Authorization
    const authHeader = req.headers.authorization;

    // Verifica se o token foi enviado
    if (!authHeader) {
      return res.status(401).json({
        message: "Token não fornecido.",
      });
    }

    /*
      Normalmente o token vem assim:
      Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
    */
    const parts = authHeader.split(" ");

    // Verifica se o formato do header está correto
    if (parts.length !== 2) {
      return res.status(401).json({
        message: "Formato de token inválido.",
      });
    }

    const [scheme, token] = parts;

    // Verifica se começa com Bearer
    if (scheme !== "Bearer") {
      return res.status(401).json({
        message: "Token mal formatado.",
      });
    }

    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guarda os dados do token no request
    req.user = decoded;

    // Continua para a próxima função
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token inválido ou expirado.",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;