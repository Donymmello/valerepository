/*
  ==========================================================
  LIMITES E FUNCIONALIDADES POR PLANO
  ==========================================================
  Mapeia o ENUM interno de Empresa.plano (STARTER/BUSINESS/ENTERPRISE,
  ver models/empresa.model.js) para os limites vendidos na página de
  preços (frontend/src/pages/public/landing/Precos.jsx). Os nomes de
  marketing são "Starter" / "Profissional" / "Empresarial", nesta mesma
  ordem, apenas o ENUM na base de dados ainda usa os nomes antigos
  (BUSINESS/ENTERPRISE) por não termos feito a migração de renomear.

  maxUtilizadoresInternos conta só ADMIN/GESTOR/ANALISTA/DIRETOR (a
  equipa da financeira), nunca MUTUARIO (os clientes da financeira, que
  não são "utilizadores" para efeitos de plano). null = sem limite.
*/

const LIMITES_PLANO = {
  STARTER: { maxUtilizadoresInternos: 3, permiteImportacaoExcel: false },
  BUSINESS: { maxUtilizadoresInternos: 10, permiteImportacaoExcel: false },
  ENTERPRISE: { maxUtilizadoresInternos: null, permiteImportacaoExcel: true },
};

// Empresa sem plano reconhecido (dado inconsistente) cai no mais restrito,
// nunca no mais permissivo.
const LIMITE_DEFEITO = LIMITES_PLANO.STARTER;

function obterLimitesPlano(plano) {
  return LIMITES_PLANO[plano] || LIMITE_DEFEITO;
}

module.exports = { LIMITES_PLANO, obterLimitesPlano };
