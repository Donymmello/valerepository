/*
  ==========================================================
  MIDDLEWARE DE AUTORIZAÇÃO POR PERFIL
  ==========================================================
  Este middleware verifica se o utilizador autenticado
  tem uma role permitida para aceder à rota.

  Exemplo de uso:
  authorizeRoles("ADMIN", "DIRETOR")
*/
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Verifica se existe utilizador autenticado
    if (!req.user) {
      return res.status(401).json({
        message: "Utilizador não autenticado.",
      });
    }

    // Verifica se a role do utilizador está na lista permitida
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Acesso negado. Sem permissão para esta ação.",
      });
    }

    next();
  };
};

module.exports = authorizeRoles;