/*
  ==========================================================
  AGENDADOR DE VERIFICAÇÕES AUTOMÁTICAS (ALERTAS)
  ==========================================================
  Antes disto, tanto os alertas de prazo (pedidos) como os alertas de
  pagamento (parcelas a vencer/vencidas) só corriam se alguém entrasse
  manualmente numa página e carregasse num botão "Verificar". Para
  alertas de prazo isso pelo menos tinha um botão em /interno/alertas-prazo;
  para alertas de pagamento nem botão existia — o endpoint estava pronto
  mas nunca era chamado por ninguém, por isso nenhum mutuário alguma vez
  recebeu aviso de parcela a vencer ou vencida (nem in-app, nem por
  email/SMS, já que o despacho externo depende de uma Notificacao ser
  criada primeiro).

  Este serviço corre as duas verificações automaticamente, uma vez por
  dia, para todas as empresas com acesso ativo (mesmo critério de
  utils/empresaAccess.js — não vale a pena gastar SMS/email a avisar
  mutuários de uma empresa suspensa ou com trial expirado).

  Também marca créditos como INCUMPRIMENTO (30 dias de atraso numa
  parcela) e recupera de volta para ATIVO os que deixaram de qualificar
  — ver verificarIncumprimentoEmpresa em services/credito.service.js.
*/

const cron = require("node-cron");
const logger = require("../utils/logger");
const { avaliarAcessoEmpresa } = require("../utils/empresaAccess");

const HORARIO_DIARIO = process.env.CRON_ALERTAS_HORARIO || "0 7 * * *"; // 07:00 todos os dias
const FUSO_HORARIO = process.env.CRON_ALERTAS_TIMEZONE || "Africa/Maputo";

async function executarParaTodasEmpresas() {
  // Requires feitos aqui dentro (não no topo do ficheiro) para evitar
  // carregar models/controllers antes de estarem prontos — este serviço
  // é iniciado a partir de server.js, depois da ligação à BD.
  const { Empresa } = require("../models");
  const { executarVerificacaoPagamento } = require("../controllers/alertaPagamento.controller");
  const { executarVerificacaoPrazo } = require("../controllers/alertaPrazo.controller");
  const { verificarIncumprimentoEmpresa } = require("./credito.service");

  const empresas = await Empresa.findAll({
    attributes: ["id", "nome", "estado", "trialEndsAt"],
  });

  let totalPagamento = 0;
  let totalPrazo = 0;
  let totalIncumprimentoMarcados = 0;
  let totalIncumprimentoRecuperados = 0;

  for (const empresa of empresas) {
    const acesso = avaliarAcessoEmpresa(empresa);
    if (!acesso.permitido) continue;

    try {
      const alertasPagamento = await executarVerificacaoPagamento(empresa.id);
      totalPagamento += alertasPagamento.length;
    } catch (error) {
      logger.error("Falha ao verificar alertas de pagamento (agendador)", {
        empresaId: empresa.id,
        empresaNome: empresa.nome,
        error: error.message,
      });
    }

    try {
      const alertasPrazo = await executarVerificacaoPrazo(empresa.id);
      totalPrazo += alertasPrazo.length;
    } catch (error) {
      logger.error("Falha ao verificar alertas de prazo (agendador)", {
        empresaId: empresa.id,
        empresaNome: empresa.nome,
        error: error.message,
      });
    }

    try {
      const resultadoIncumprimento = await verificarIncumprimentoEmpresa(empresa.id);
      totalIncumprimentoMarcados += resultadoIncumprimento.marcados;
      totalIncumprimentoRecuperados += resultadoIncumprimento.recuperados;
    } catch (error) {
      logger.error("Falha ao verificar incumprimento de créditos (agendador)", {
        empresaId: empresa.id,
        empresaNome: empresa.nome,
        error: error.message,
      });
    }
  }

  logger.info("Agendador de alertas concluído", {
    empresasVerificadas: empresas.length,
    alertasPagamentoCriados: totalPagamento,
    alertasPrazoCriados: totalPrazo,
    creditosMarcadosIncumprimento: totalIncumprimentoMarcados,
    creditosRecuperadosDeIncumprimento: totalIncumprimentoRecuperados,
  });
}

function iniciarAgendador() {
  cron.schedule(
    HORARIO_DIARIO,
    () => {
      executarParaTodasEmpresas().catch((error) => {
        logger.error("Erro inesperado no agendador de alertas", { error: error.message, stack: error.stack });
      });
    },
    {
      name: "alertas-prazo-e-pagamento",
      timezone: FUSO_HORARIO,
      // Evita duas execuções sobrepostas se a verificação de todas as
      // empresas alguma vez demorar mais do que 24h (não deveria, mas é
      // barato garantir).
      noOverlap: true,
    }
  );

  logger.info("Agendador de alertas iniciado", { horario: HORARIO_DIARIO, timezone: FUSO_HORARIO });
}

module.exports = { iniciarAgendador, executarParaTodasEmpresas };
