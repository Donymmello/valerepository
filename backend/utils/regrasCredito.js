/*
podeRegistrarReembolso()
├── podeLiquidarCredito()
├── podeRenegociarCredito()
├── podeAmortizarCredito()
├── podeCancelarCredito()
├── podeMarcarIncumprimento()
├── podeReestruturarCredito()

depois criar isso
*/


const PERFIS = {
  ADMIN: "ADMIN",
  GESTOR: "GESTOR",
  ANALISTA: "ANALISTA",
  DIRETOR: "DIRETOR",
  USER: "USER",
};

const ESTADO_CREDITO = {
  ATIVO: "ATIVO",
  LIQUIDADO: "LIQUIDADO",
  INCUMPRIMENTO: "INCUMPRIMENTO",
  REESTRUTURADO: "REESTRUTURADO",
};

const PERFIS_POR_ACAO = {
  REGISTAR_REEMBOLSO: [
    PERFIS.ADMIN,
    PERFIS.GESTOR,
  ],
};

const ESTADOS_CREDITO_PERMITIDOS = {
  REGISTAR_REEMBOLSO: [
    ESTADO_CREDITO.ATIVO,
    ESTADO_CREDITO.INCUMPRIMENTO,
    ESTADO_CREDITO.REESTRUTURADO,
  ],
};

function obterPerfilUser(user) {
  if (!user) return null;

  return user.role || user.perfil || null;
}

function userTemPermissaoParaAcao(user, acao) {
  const perfil = obterPerfilUser(user);
  const perfisPermitidos = PERFIS_POR_ACAO[acao] || [];

  return perfisPermitidos.includes(perfil);
}

function estadoCreditoPermiteAcao(credito, acao) {
  const estadoAtual = credito?.estado;
  const estadosPermitidos = ESTADOS_CREDITO_PERMITIDOS[acao] || [];

  if (!estadosPermitidos.length) {
    return true;
  }

  return estadosPermitidos.includes(estadoAtual);
}

function podeRegistrarReembolso(user, credito) {
  return (
    userTemPermissaoParaAcao(user, "REGISTAR_REEMBOLSO") &&
    estadoCreditoPermiteAcao(credito, "REGISTAR_REEMBOLSO")
  );
}

module.exports = {
  PERFIS,
  ESTADO_CREDITO,
  podeRegistrarReembolso,
};