const cache = require("./cache");

/*
  ==========================================================
  CACHE PARTILHADA DA LINHA DE EMPRESA (TENANT)
  ==========================================================
  Antes disto, cada sítio que precisava de um campo de Empresa fazia a
  sua própria query com `attributes: [...]`, a mesma linha, buscada de
  formas diferentes, sem reuso nenhum entre si:
    - estado/trialEndsAt, em auth.middleware.js, em TODO pedido autenticado
    - taxaJurosMin/taxaJurosMax, em 6 sítios (simulador, criar pedido,
      portal do mutuário, aprovação, 2x no importador de Excel)
    - nome, em 5 sítios de branding de PDF/notificação externa

  Isto centraliza num único ponto de leitura + invalidação: uma cache
  com TTL curto (60s) da linha inteira de Empresa. TTL curto porque
  estado/trialEndsAt são security-sensitive (suspender uma empresa deve
  ter efeito quase imediato), usar o mesmo TTL para nome/taxas é uma
  escolha conservadora (perde-se algum cache hit que um TTL maior desses
  campos, quase estáticos, permitiria), mas mantém uma única política de
  invalidação em vez de duas.

  Quem escreve em Empresa (auth.middleware.js ao auto-suspender por
  trial expirado, auth.controller.js no login, superadmin.controller.js,
  empresa.controller.js) tem de chamar invalidarCacheEmpresa() depois do
  update, sem isso, a mudança só aparece depois da TTL expirar.

  O require de "../models" é feito dentro da função, não no topo do
  ficheiro, de propósito. Este módulo é usado também por
  notificacaoExterna.service.js, que por sua vez é carregado a partir de
  models/index.js (para ligar o hook afterCreate/afterBulkCreate de
  Notificacao) ANTES desse ficheiro terminar de montar o seu
  module.exports. Um require("../models") no topo aqui apanharia esse
  module.exports ainda incompleto (Empresa viria undefined). Mesmo
  padrão já usado em notificacaoExterna.service.js e
  agendador.service.js por este motivo.
*/

const TTL_MS = 60 * 1000;
const chaveCache = (empresaId) => `empresa:${empresaId}`;

async function obterEmpresaCacheada(empresaId) {
  if (!empresaId) return null;

  const chave = chaveCache(empresaId);
  let empresa = cache.get(chave);

  if (!empresa) {
    const { Empresa } = require("../models");
    empresa = await Empresa.findByPk(empresaId, { raw: true });
    if (empresa) cache.set(chave, empresa, TTL_MS);
  }

  return empresa;
}

function invalidarCacheEmpresa(empresaId) {
  if (!empresaId) return;
  cache.delete(chaveCache(empresaId));
}

module.exports = { obterEmpresaCacheada, invalidarCacheEmpresa };
