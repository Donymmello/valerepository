/*
  ==========================================================
  CONTROLO DE ACESSO POR ESTADO DA EMPRESA (SUBSCRIÇÃO)
  ==========================================================
  Avalia se uma empresa (tenant) ainda tem acesso ao sistema,
  a partir de uma instância/objecto já carregado (não faz queries
  aqui, quem chama decide se precisa de ir buscar à BD).
*/

const ESTADOS_BLOQUEADOS = ["SUSPENSA", "CANCELADA"];

const MENSAGENS = {
  EMPRESA_NAO_ENCONTRADA: "Empresa não encontrada.",
  TRIAL_EXPIRADO: "O período de teste desta empresa expirou. Contacta o suporte para ativar um plano.",
  EMPRESA_SUSPENSA: "O acesso desta empresa está suspenso. Contacta o suporte.",
  EMPRESA_CANCELADA: "Esta empresa foi cancelada. Contacta o suporte.",
};

/**
 * @param {object|null} empresa - instância Sequelize (ou objeto) com pelo menos { estado, trialEndsAt }
 * @returns {{ permitido: boolean, motivo?: string, trialExpirouAgora?: boolean }}
 */
function avaliarAcessoEmpresa(empresa) {
  if (!empresa) {
    return { permitido: false, motivo: "EMPRESA_NAO_ENCONTRADA" };
  }

  // Expiração "preguiçosa": não há cron, por isso detetamos e persistimos
  // a expiração do trial assim que alguém dessa empresa tenta aceder.
  if (empresa.estado === "TESTE" && empresa.trialEndsAt && new Date(empresa.trialEndsAt) < new Date()) {
    return { permitido: false, motivo: "TRIAL_EXPIRADO", trialExpirouAgora: true };
  }

  if (ESTADOS_BLOQUEADOS.includes(empresa.estado)) {
    return {
      permitido: false,
      motivo: empresa.estado === "CANCELADA" ? "EMPRESA_CANCELADA" : "EMPRESA_SUSPENSA",
    };
  }

  return { permitido: true };
}

module.exports = { avaliarAcessoEmpresa, MENSAGENS };
