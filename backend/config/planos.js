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

  precoMensal (MT) é a única fonte de verdade do preço no backend: usado
  para calcular o valor a cobrar no pedido de plano pago (ver
  controllers/solicitacaoAcesso.controller.js), nunca confiar num preço
  vindo do cliente. Tem de ficar sincronizado manualmente com os valores
  exibidos em frontend/src/pages/public/landing/Precos.jsx.
*/

const LIMITES_PLANO = {
  STARTER: { maxUtilizadoresInternos: 3, permiteImportacaoExcel: false, precoMensal: 2500 },
  BUSINESS: { maxUtilizadoresInternos: 10, permiteImportacaoExcel: false, precoMensal: 4000 },
  ENTERPRISE: { maxUtilizadoresInternos: null, permiteImportacaoExcel: true, precoMensal: 8000 },
};

// Nomes de marketing dos mesmos 3 valores do ENUM (ver models/empresa.model.js).
// O ENUM na BD ainda usa os nomes antigos (BUSINESS/ENTERPRISE) por não
// termos feito a migração de renomear (ver comentário acima).
const NOME_MARKETING_PLANO = {
  STARTER: "Starter",
  BUSINESS: "Profissional",
  ENTERPRISE: "Empresarial",
};

// Único array de ENUMs válidos, reutilizado por auth.controller.js
// (bootstrap-admin) e solicitacaoAcesso.controller.js (pedido de plano).
const PLANOS_VALIDOS = Object.keys(LIMITES_PLANO);

// Empresa sem plano reconhecido (dado inconsistente) cai no mais restrito,
// nunca no mais permissivo.
const LIMITE_DEFEITO = LIMITES_PLANO.STARTER;

function obterLimitesPlano(plano) {
  return LIMITES_PLANO[plano] || LIMITE_DEFEITO;
}

module.exports = { LIMITES_PLANO, obterLimitesPlano, NOME_MARKETING_PLANO, PLANOS_VALIDOS };
