/*
  ===========================================================
  REGRAS DE NEGÓCIO DO PEDIDO DE CRÉDITO
  ===========================================================
*/

/*
  Perfis reais do sistema
*/
const PERFIS = {
  ADMIN: "ADMIN",
  GESTOR: "GESTOR",
  ANALISTA: "ANALISTA",
  DIRETOR: "DIRETOR",
  USER: "USER",
};

/*
  Status possíveis do pedido
*/
const STATUS_PEDIDO = {
  RASCUNHO: "RASCUNHO",
  SUBMETIDO: "SUBMETIDO",
  EM_ANALISE: "EM_ANALISE",
  EM_VALIDACAO: "EM_VALIDACAO",
  APROVADO: "APROVADO",
  REJEITADO: "REJEITADO",
  DESEMBOLSADO: "DESEMBOLSADO",
  ENCERRADO: "ENCERRADO",
};

/*
  ===========================================================
  MATRIZ DE PERFIS POR AÇÃO
  ===========================================================
*/
const PERFIS_POR_ACAO = {
  CRIAR_PEDIDO: [
    PERFIS.ADMIN,
    PERFIS.GESTOR,
    PERFIS.ANALISTA,
    PERFIS.USER,
  ],

  EDITAR_PEDIDO: [
    PERFIS.ADMIN,
    PERFIS.GESTOR,
    PERFIS.ANALISTA,
  ],

  APROVAR_PEDIDO: [
    PERFIS.ADMIN,
    PERFIS.GESTOR,
    PERFIS.ANALISTA,
    PERFIS.DIRETOR,
  ],

  REJEITAR_PEDIDO: [
    PERFIS.ADMIN,
    PERFIS.GESTOR,
    PERFIS.ANALISTA,
    PERFIS.DIRETOR,
  ],

  VALIDAR_REQUISITO: [
    PERFIS.ADMIN,
    PERFIS.GESTOR,
    PERFIS.ANALISTA,
  ],

  DESEMBOLSAR_PEDIDO: [
    PERFIS.ADMIN,
    PERFIS.GESTOR,
  ],

  REGISTAR_REEMBOLSO: [
    PERFIS.ADMIN,
    PERFIS.GESTOR,
  ],

  ENCERRAR_PEDIDO: [
    PERFIS.ADMIN,
    PERFIS.GESTOR,
  ],

  IMPORTAR_EXCEL: [
    PERFIS.ADMIN,
    PERFIS.GESTOR,
  ],

  EXPORTAR_EXCEL: [
    PERFIS.ADMIN,
    PERFIS.GESTOR,
    PERFIS.ANALISTA,
    PERFIS.DIRETOR,
  ],
};

/*
  ===========================================================
  STATUS PERMITIDOS POR AÇÃO
  ===========================================================
*/
const STATUS_PERMITIDOS_POR_ACAO = {
  CRIAR_PEDIDO: [],
  EDITAR_PEDIDO: [STATUS_PEDIDO.RASCUNHO, STATUS_PEDIDO.SUBMETIDO],

  APROVAR_PEDIDO: [
    STATUS_PEDIDO.SUBMETIDO,
    STATUS_PEDIDO.EM_ANALISE,
    STATUS_PEDIDO.EM_VALIDACAO,
  ],

  REJEITAR_PEDIDO: [
    STATUS_PEDIDO.SUBMETIDO,
    STATUS_PEDIDO.EM_ANALISE,
    STATUS_PEDIDO.EM_VALIDACAO,
  ],

  VALIDAR_REQUISITO: [
    STATUS_PEDIDO.SUBMETIDO,
    STATUS_PEDIDO.EM_ANALISE,
    STATUS_PEDIDO.EM_VALIDACAO,
  ],

  DESEMBOLSAR_PEDIDO: [STATUS_PEDIDO.APROVADO],
  REGISTAR_REEMBOLSO: [STATUS_PEDIDO.DESEMBOLSADO],
  ENCERRAR_PEDIDO: [STATUS_PEDIDO.DESEMBOLSADO],
};

/*
  ===========================================================
  TRANSIÇÕES VÁLIDAS DE STATUS
  ===========================================================
*/
const TRANSICOES_VALIDAS = {
  [STATUS_PEDIDO.RASCUNHO]: [
    STATUS_PEDIDO.SUBMETIDO,
    STATUS_PEDIDO.REJEITADO,
  ],

  [STATUS_PEDIDO.SUBMETIDO]: [
    STATUS_PEDIDO.EM_ANALISE,
    STATUS_PEDIDO.REJEITADO,
  ],

  [STATUS_PEDIDO.EM_ANALISE]: [
    STATUS_PEDIDO.EM_VALIDACAO,
    STATUS_PEDIDO.REJEITADO,
  ],

  [STATUS_PEDIDO.EM_VALIDACAO]: [
    STATUS_PEDIDO.APROVADO,
    STATUS_PEDIDO.REJEITADO,
  ],

  [STATUS_PEDIDO.APROVADO]: [
    STATUS_PEDIDO.DESEMBOLSADO,
  ],

  [STATUS_PEDIDO.REJEITADO]: [],

  [STATUS_PEDIDO.DESEMBOLSADO]: [
    STATUS_PEDIDO.ENCERRADO,
  ],

  [STATUS_PEDIDO.ENCERRADO]: [],
};

/*
  ===========================================================
  AUXILIAR: OBTER PERFIL DO UTILIZADOR
  ===========================================================
*/
function obterPerfilUser(user) {
  if (!user) return null;
  return user.role || user.perfil || null;
}

/*
  ===========================================================
  VERIFICA PERMISSÃO GENÉRICA POR AÇÃO
  ===========================================================
*/
function userTemPermissaoParaAcao(user, acao) {
  const perfil = obterPerfilUser(user);
  const perfisPermitidos = PERFIS_POR_ACAO[acao] || [];
  return perfisPermitidos.includes(perfil);
}

/*
  ===========================================================
  VERIFICA SE O STATUS ATUAL PERMITE A AÇÃO
  ===========================================================
*/
function statusPermiteAcao(pedido, acao) {
  const statusAtual = pedido?.status;
  const statusPermitidos = STATUS_PERMITIDOS_POR_ACAO[acao] || [];

  if (!statusPermitidos.length) {
    return true;
  }

  return statusPermitidos.includes(statusAtual);
}

/*
  ===========================================================
  VERIFICA SE UMA TRANSIÇÃO DE STATUS É VÁLIDA
  ===========================================================
*/
function podeTransitarStatus(statusAtual, novoStatus) {
  const proximosStatus = TRANSICOES_VALIDAS[statusAtual] || [];
  return proximosStatus.includes(novoStatus);
}

/*
  ===========================================================
  REGRA FORTE DE APROVAÇÃO POR ETAPA
  ===========================================================
  Etapa 1 -> ANALISTA / GESTOR / ADMIN
  Etapa 2 -> GESTOR / ADMIN
  Etapa 3 -> DIRETOR / ADMIN
*/
function userPodeAprovarNaEtapa(user, pedido) {
  const perfil = obterPerfilUser(user);
  const etapaAtual = Number(pedido?.etapaAtual || 0);

  if (etapaAtual === 1) {
    return [
      PERFIS.ADMIN,
      PERFIS.GESTOR,
      PERFIS.ANALISTA,
    ].includes(perfil);
  }

  if (etapaAtual === 2) {
    return [
      PERFIS.ADMIN,
      PERFIS.GESTOR,
    ].includes(perfil);
  }

  if (etapaAtual === 3) {
    return [
      PERFIS.ADMIN,
      PERFIS.DIRETOR,
    ].includes(perfil);
  }

  return false;
}

/*
  ===========================================================
  REGRAS PRONTAS POR AÇÃO
  ===========================================================
*/
function podeCriarPedido(user) {
  return userTemPermissaoParaAcao(user, "CRIAR_PEDIDO");
}

function podeEditarPedido(user, pedido) {
  return (
    userTemPermissaoParaAcao(user, "EDITAR_PEDIDO") &&
    statusPermiteAcao(pedido, "EDITAR_PEDIDO")
  );
}

function podeAprovarPedido(user, pedido) {
  return (
    userTemPermissaoParaAcao(user, "APROVAR_PEDIDO") &&
    statusPermiteAcao(pedido, "APROVAR_PEDIDO") &&
    userPodeAprovarNaEtapa(user, pedido)
  );
}

function podeRejeitarPedido(user, pedido) {
  return (
    userTemPermissaoParaAcao(user, "REJEITAR_PEDIDO") &&
    statusPermiteAcao(pedido, "REJEITAR_PEDIDO") &&
    userPodeAprovarNaEtapa(user, pedido)
  );
}

function podeValidarRequisito(user, pedido) {
  return (
    userTemPermissaoParaAcao(user, "VALIDAR_REQUISITO") &&
    statusPermiteAcao(pedido, "VALIDAR_REQUISITO")
  );
}

function podeDesembolsarPedido(user, pedido) {
  return (
    userTemPermissaoParaAcao(user, "DESEMBOLSAR_PEDIDO") &&
    statusPermiteAcao(pedido, "DESEMBOLSAR_PEDIDO")
  );
}

function podeRegistrarReembolso(user, pedido) {
  return (
    userTemPermissaoParaAcao(user, "REGISTAR_REEMBOLSO") &&
    statusPermiteAcao(pedido, "REGISTAR_REEMBOLSO")
  );
}

function podeEncerrarPedido(user, pedido) {
  return (
    userTemPermissaoParaAcao(user, "ENCERRAR_PEDIDO") &&
    statusPermiteAcao(pedido, "ENCERRAR_PEDIDO")
  );
}

module.exports = {
  PERFIS,
  STATUS_PEDIDO,
  TRANSICOES_VALIDAS,
  userTemPermissaoParaAcao,
  statusPermiteAcao,
  podeTransitarStatus,
  userPodeAprovarNaEtapa,
  podeCriarPedido,
  podeEditarPedido,
  podeAprovarPedido,
  podeRejeitarPedido,
  podeValidarRequisito,
  podeDesembolsarPedido,
  podeRegistrarReembolso,
  podeEncerrarPedido,
};