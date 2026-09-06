/*
  ==========================================================
  MIDDLEWARE DE LIMITE / FUNCIONALIDADE POR PLANO
  ==========================================================
  Bloqueia uma rota se o plano da empresa não incluir a funcionalidade
  pedida (ver backend/config/planos.js). Usa a mesma cache de Empresa já
  partilhada pelo auth.middleware.js (utils/empresaCache.js), sem query
  extra na maioria dos pedidos.

  Uso:
    exigirFuncionalidadePlano("permiteImportacaoExcel", "mensagem opcional")
*/

const { obterEmpresaCacheada } = require("../utils/empresaCache");
const { obterLimitesPlano } = require("../config/planos");

const exigirFuncionalidadePlano = (chave, mensagem) => {
  return async (req, res, next) => {
    try {
      const empresa = await obterEmpresaCacheada(req.user?.empresaId);
      const limites = obterLimitesPlano(empresa?.plano);

      if (!limites[chave]) {
        return res.status(403).json({
          message: mensagem || "Esta funcionalidade não está incluída no teu plano atual.",
          motivo: "FUNCIONALIDADE_FORA_DO_PLANO",
        });
      }

      return next();
    } catch (error) {
      console.error("[PlanoLimiteMiddleware Error]:", error.message);
      return res.status(500).json({ message: "Erro ao verificar o plano da empresa." });
    }
  };
};

module.exports = { exigirFuncionalidadePlano };
