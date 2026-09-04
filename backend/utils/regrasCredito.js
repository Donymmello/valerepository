/*
  Este ficheiro tinha uma lista de 6 funções "por criar" que nunca foram
  atualizadas à medida que o resto do sistema evoluiu, ficou a dar a
  entender que nada disto existia, quando na verdade 2 dos 4 estados de
  Credito já são geridos automaticamente, só que por fora desta camada
  de regras (o que também não deixa de ser um problema à parte, ver
  nota em ESTADO_CREDITO abaixo). Estado real de cada uma:

  - podeMarcarIncumprimento(), a decisão já existe, mas não é uma
    permissão de utilizador: é automática, por threshold de dias em
    atraso, correndo todo dia no agendador. Ver
    verificarIncumprimentoEmpresa() em services/credito.service.js.
  - "podeLiquidarCredito", idem: automático quando o saldo chega a
    zero (services/credito.service.js, atualizarSaldo/registarReembolso),
    não uma ação que um utilizador escolhe fazer.
  - podeRenegociarCredito(), podeAmortizarCredito(),
    podeCancelarCredito(), podeReestruturarCredito(), estas sim
    continuam por construir. REESTRUTURADO existe no ENUM e é lido em
    relatorio.controller.js, mas não há nenhum fluxo no sistema que
    escreva esse estado, é um valor "morto" até um destes fluxos ser
    implementado.
*/


const PERFIS = {
  ADMIN: "ADMIN",
  GESTOR: "GESTOR",
  ANALISTA: "ANALISTA",
  DIRETOR: "DIRETOR",
  USER: "USER",
};

// Tem de ficar sempre igual ao ENUM em models/credito.model.js, não há
// nenhuma verificação automática disso, é responsabilidade de quem editar
// um dos dois lembrar-se do outro.
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