const jwt = require("jsonwebtoken");
const { Empresa } = require("../models");
const { avaliarAcessoEmpresa, MENSAGENS } = require("../utils/empresaAccess");

/**
 * MIDDLEWARE DE AUTENTICAÇÃO
 * Protege rotas privadas garantindo a integridade do token JWT.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Token não fornecido." });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
      return res.status(401).json({ message: "Formato de token inválido." });
    }

    const [scheme, token] = parts;

    // Validação case-insensitive usando regex para evitar falhas se enviaremos 'bearer'
    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ message: "Token mal formatado." });
    }

    // Verifica e decodifica o token usando a variável de ambiente
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // SUPERADMIN não pertence a nenhuma empresa — sem estado de subscrição a validar.
    // Verificamos em cada pedido (não só no login) porque o SUPERADMIN pode suspender
    // uma empresa a meio de uma sessão já com token válido.
    if (decoded.role !== "SUPERADMIN" && decoded.empresaId) {
      const empresa = await Empresa.findByPk(decoded.empresaId, {
        attributes: ["id", "estado", "trialEndsAt"],
      });

      const acesso = avaliarAcessoEmpresa(empresa);

      if (!acesso.permitido) {
        if (acesso.trialExpirouAgora) {
          await empresa.update({ estado: "SUSPENSA" });
        }
        return res.status(403).json({ message: MENSAGENS[acesso.motivo], motivo: acesso.motivo });
      }
    }

    // Injeta os dados decodificados (id, role, etc.) no objeto da requisição
    req.user = decoded;

    req.tenant = {
      id: decoded.empresaId,
    };

    return next();
  } catch (error) {
    // Segurança Senior: Logs internos para a equipa, mensagens genéricas para o cliente
    console.error("[AuthMiddleware Error]:", error.message);
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
};

module.exports = authMiddleware;