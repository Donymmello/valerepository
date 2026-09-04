/**
 * Testes de regressão para as regras de negócio (permissões por perfil +
 * máquina de estados do pedido/crédito), utils/regrasPedido.js e
 * utils/regrasCredito.js. Funções puras, sem dependência de BD/models.
 *
 * Importa: são estas funções que decidem quem pode aprovar, desembolsar
 * ou registar reembolso, e em que estado isso é permitido, um bug aqui
 * é tanto um risco financeiro (desembolsar/reembolsar fora de hora) como
 * de segurança (perfil errado a conseguir uma ação).
 */

const {
  STATUS_PEDIDO,
  podeTransitarStatus,
  userPodeAprovarNaEtapa,
  podeCriarPedido,
  podeEditarPedido,
  podeAprovarPedido,
  podeDesembolsarPedido,
  podeEncerrarPedido,
} = require("../utils/regrasPedido");

const { podeRegistrarReembolso } = require("../utils/regrasCredito");

describe("regrasPedido, transições de estado", () => {
  test("RASCUNHO só pode ir para SUBMETIDO ou REJEITADO", () => {
    expect(podeTransitarStatus(STATUS_PEDIDO.RASCUNHO, STATUS_PEDIDO.SUBMETIDO)).toBe(true);
    expect(podeTransitarStatus(STATUS_PEDIDO.RASCUNHO, STATUS_PEDIDO.REJEITADO)).toBe(true);
    expect(podeTransitarStatus(STATUS_PEDIDO.RASCUNHO, STATUS_PEDIDO.APROVADO)).toBe(false);
  });

  test("não é possível saltar etapas: SUBMETIDO não pode ir direto para APROVADO", () => {
    expect(podeTransitarStatus(STATUS_PEDIDO.SUBMETIDO, STATUS_PEDIDO.APROVADO)).toBe(false);
  });

  test("DESEMBOLSADO só pode ir para ENCERRADO, nunca pode voltar atrás", () => {
    expect(podeTransitarStatus(STATUS_PEDIDO.DESEMBOLSADO, STATUS_PEDIDO.ENCERRADO)).toBe(true);
    expect(podeTransitarStatus(STATUS_PEDIDO.DESEMBOLSADO, STATUS_PEDIDO.APROVADO)).toBe(false);
  });

  test("estados finais (REJEITADO, ENCERRADO) não têm transições válidas", () => {
    expect(podeTransitarStatus(STATUS_PEDIDO.REJEITADO, STATUS_PEDIDO.SUBMETIDO)).toBe(false);
    expect(podeTransitarStatus(STATUS_PEDIDO.ENCERRADO, STATUS_PEDIDO.DESEMBOLSADO)).toBe(false);
  });
});

describe("regrasPedido, aprovação por etapa", () => {
  test("etapa 1 aceita ANALISTA, GESTOR e ADMIN, mas não DIRETOR nem USER", () => {
    const pedido = { etapaAtual: 1 };
    expect(userPodeAprovarNaEtapa({ role: "ANALISTA" }, pedido)).toBe(true);
    expect(userPodeAprovarNaEtapa({ role: "GESTOR" }, pedido)).toBe(true);
    expect(userPodeAprovarNaEtapa({ role: "ADMIN" }, pedido)).toBe(true);
    expect(userPodeAprovarNaEtapa({ role: "DIRETOR" }, pedido)).toBe(false);
    expect(userPodeAprovarNaEtapa({ role: "USER" }, pedido)).toBe(false);
  });

  test("etapa 2 só aceita GESTOR e ADMIN, ANALISTA perde acesso", () => {
    const pedido = { etapaAtual: 2 };
    expect(userPodeAprovarNaEtapa({ role: "GESTOR" }, pedido)).toBe(true);
    expect(userPodeAprovarNaEtapa({ role: "ADMIN" }, pedido)).toBe(true);
    expect(userPodeAprovarNaEtapa({ role: "ANALISTA" }, pedido)).toBe(false);
  });

  test("etapa 3 só aceita DIRETOR e ADMIN, nem GESTOR passa a etapa final", () => {
    const pedido = { etapaAtual: 3 };
    expect(userPodeAprovarNaEtapa({ role: "DIRETOR" }, pedido)).toBe(true);
    expect(userPodeAprovarNaEtapa({ role: "ADMIN" }, pedido)).toBe(true);
    expect(userPodeAprovarNaEtapa({ role: "GESTOR" }, pedido)).toBe(false);
  });

  test("etapa desconhecida/0 nunca autoriza ninguém (fail-closed)", () => {
    expect(userPodeAprovarNaEtapa({ role: "ADMIN" }, { etapaAtual: 0 })).toBe(false);
    expect(userPodeAprovarNaEtapa({ role: "ADMIN" }, {})).toBe(false);
  });
});

describe("regrasPedido, ações compostas (permissão + estado)", () => {
  test("podeCriarPedido: USER pode, DIRETOR não pode (perfil só aprova, não origina pedidos)", () => {
    expect(podeCriarPedido({ role: "USER" })).toBe(true);
    expect(podeCriarPedido({ role: "DIRETOR" })).toBe(false);
  });

  test("podeEditarPedido: bloqueado fora de RASCUNHO/SUBMETIDO mesmo para quem tem perfil certo", () => {
    const editor = { role: "GESTOR" };
    expect(podeEditarPedido(editor, { status: STATUS_PEDIDO.RASCUNHO })).toBe(true);
    expect(podeEditarPedido(editor, { status: STATUS_PEDIDO.APROVADO })).toBe(false);
  });

  test("podeAprovarPedido exige perfil certo, estado certo E etapa certa ao mesmo tempo", () => {
    const pedidoEtapa2 = { status: STATUS_PEDIDO.EM_ANALISE, etapaAtual: 2 };
    // GESTOR: perfil ok, estado ok, etapa ok -> passa
    expect(podeAprovarPedido({ role: "GESTOR" }, pedidoEtapa2)).toBe(true);
    // ANALISTA: perfil está na lista geral de APROVAR_PEDIDO, mas a etapa 2 não aceita ANALISTA
    expect(podeAprovarPedido({ role: "ANALISTA" }, pedidoEtapa2)).toBe(false);
    // GESTOR num pedido já APROVADO (fora do STATUS_PERMITIDOS_POR_ACAO) -> bloqueado
    expect(podeAprovarPedido({ role: "GESTOR" }, { status: STATUS_PEDIDO.APROVADO, etapaAtual: 2 })).toBe(false);
  });

  test("podeDesembolsarPedido só no status APROVADO, só ADMIN/GESTOR", () => {
    expect(podeDesembolsarPedido({ role: "GESTOR" }, { status: STATUS_PEDIDO.APROVADO })).toBe(true);
    expect(podeDesembolsarPedido({ role: "GESTOR" }, { status: STATUS_PEDIDO.EM_ANALISE })).toBe(false);
    expect(podeDesembolsarPedido({ role: "ANALISTA" }, { status: STATUS_PEDIDO.APROVADO })).toBe(false);
  });

  test("podeEncerrarPedido só no status DESEMBOLSADO", () => {
    expect(podeEncerrarPedido({ role: "ADMIN" }, { status: STATUS_PEDIDO.DESEMBOLSADO })).toBe(true);
    expect(podeEncerrarPedido({ role: "ADMIN" }, { status: STATUS_PEDIDO.APROVADO })).toBe(false);
  });
});

describe("regrasCredito, permissão para registar reembolso", () => {
  test("ADMIN e GESTOR podem, ANALISTA/DIRETOR/USER não podem", () => {
    const credito = { estado: "ATIVO" };
    expect(podeRegistrarReembolso({ role: "ADMIN" }, credito)).toBe(true);
    expect(podeRegistrarReembolso({ role: "GESTOR" }, credito)).toBe(true);
    expect(podeRegistrarReembolso({ role: "ANALISTA" }, credito)).toBe(false);
    expect(podeRegistrarReembolso({ role: "DIRETOR" }, credito)).toBe(false);
    expect(podeRegistrarReembolso({ role: "USER" }, credito)).toBe(false);
  });

  test("permite em ATIVO, INCUMPRIMENTO e REESTRUTURADO", () => {
    const user = { role: "ADMIN" };
    expect(podeRegistrarReembolso(user, { estado: "ATIVO" })).toBe(true);
    expect(podeRegistrarReembolso(user, { estado: "INCUMPRIMENTO" })).toBe(true);
    expect(podeRegistrarReembolso(user, { estado: "REESTRUTURADO" })).toBe(true);
  });

  test("bloqueia crédito já LIQUIDADO, não faz sentido reembolsar o que já está pago", () => {
    expect(podeRegistrarReembolso({ role: "ADMIN" }, { estado: "LIQUIDADO" })).toBe(false);
  });

  test("lida com user/credito em falta sem rebentar (retorna false, não lança erro)", () => {
    expect(() => podeRegistrarReembolso(null, { estado: "ATIVO" })).not.toThrow();
    expect(podeRegistrarReembolso(null, { estado: "ATIVO" })).toBe(false);
    expect(podeRegistrarReembolso({ role: "ADMIN" }, null)).toBe(false);
  });
});
