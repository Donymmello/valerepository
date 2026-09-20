/**
 * Regressão das correções de controlo de acesso (review de segurança).
 *
 * Duas partes:
 *
 * 1. Guardas de perfil nas rotas que estavam só com authMiddleware. Em vez
 *    de subir um servidor HTTP, vai-se buscar a cadeia de middleware ao
 *    próprio router do Express e corre-se o middleware de perfil com um
 *    req falso. É o mesmo middleware que corre em produção, por isso se
 *    alguém tirar o authorizeRoles de uma destas rotas, isto falha.
 *
 * 2. Predicado de acesso aos anexos, contra a BD real (sqlite em memória),
 *    porque a regra "staff da empresa OU o próprio mutuário" só se
 *    consegue verificar com registos verdadeiros a ligar pedido, mutuário
 *    e anexo.
 */

jest.mock("../services/notificacaoExterna.service", () => ({
  despacharNotificacaoExterna: jest.fn().mockResolvedValue(undefined),
}));

const {
  sequelize,
  Empresa,
  User,
  Mutuario,
  PedidoCredito,
  RequisitoCredito,
  PedidoRequisito,
  Anexo,
} = require("../models");
const { listar } = require("../controllers/anexo.controller");
const { anexarReqPedido } = require("../controllers/portalMutuario.controller");

jest.setTimeout(30000);

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.download = jest.fn().mockReturnValue(res);
  return res;
}

function idUnico() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

/*
  Corre a cadeia de uma rota do router com um utilizador de perfil `role`
  e devolve o res mockado. Salta o primeiro handler (authMiddleware), que
  precisaria de um JWT real: aqui o que interessa é o authorizeRoles a
  seguir. Se a rota não tiver middleware nenhum entre o auth e o
  controller, o expect do número de handlers falha — que é precisamente o
  bug que estas rotas tinham.
*/
async function correrGuardaDePerfil(router, metodo, caminho, role) {
  const camada = router.stack.find(
    (l) => l.route?.path === caminho && l.route.methods[metodo]
  );
  if (!camada) throw new Error(`Rota ${metodo.toUpperCase()} ${caminho} nao encontrada.`);

  const handlers = camada.route.stack.map((h) => h.handle);
  expect(handlers.length).toBeGreaterThanOrEqual(3); // auth + perfil + controller

  const res = mockRes();
  const next = jest.fn();
  await handlers[1]({ user: { id: 1, role, empresaId: 1 } }, res, next);

  return { res, next };
}

describe("Guardas de perfil nas rotas de backoffice", () => {
  const rotas = [
    ["../routes/mutuario.routes", "get", "/"],
    ["../routes/mutuario.routes", "get", "/:id"],
    ["../routes/excell.routes", "get", "/export/mutuarios"],
    ["../routes/excell.routes", "get", "/export/pedidos"],
    ["../routes/excell.routes", "get", "/export/desembolsos"],
    ["../routes/excell.routes", "get", "/export/reembolsos"],
    ["../routes/excell.routes", "get", "/export/relatorio-financeiro"],
    ["../routes/extrato.routes", "get", "/pedido/:pedidoId"],
    ["../routes/extrato.routes", "get", "/pedido/:pedidoId/pdf"],
    ["../routes/aprovacaoPedido.routes", "get", "/pedido/:pedidoId"],
    ["../routes/desembolso.routes", "get", "/"],
    ["../routes/desembolso.routes", "get", "/pedido/:pedidoId"],
    ["../routes/desembolso.routes", "get", "/:desembolsoId/comprovativo"],
    ["../routes/pedidoRequisito.routes", "get", "/pedido/:pedidoId"],
  ];

  test.each(rotas)("%s %s %s recusa role USER", async (modulo, metodo, caminho) => {
    const { res, next } = await correrGuardaDePerfil(require(modulo), metodo, caminho, "USER");

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test.each(rotas)("%s %s %s deixa passar ADMIN", async (modulo, metodo, caminho) => {
    const { res, next } = await correrGuardaDePerfil(require(modulo), metodo, caminho, "ADMIN");

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("dashboard de monitorizacao exige SUPERADMIN", async () => {
    const router = require("../routes/monitoring.routes");

    const comoAdmin = await correrGuardaDePerfil(router, "get", "/dashboard", "ADMIN");
    expect(comoAdmin.res.status).toHaveBeenCalledWith(403);

    const comoSuperadmin = await correrGuardaDePerfil(router, "get", "/dashboard", "SUPERADMIN");
    expect(comoSuperadmin.next).toHaveBeenCalled();
  });
});

describe("Acesso aos anexos de requisitos (integracao, BD real)", () => {
  let cenario;

  beforeAll(async () => {
    // Mesma trava dos outros testes de integração: sync({force:true})
    // apaga e recria tudo, só pode tocar no sqlite em memória.
    if (sequelize.getDialect() !== "sqlite") {
      throw new Error(
        `Recusado: controloAcesso.test.js so pode correr contra sqlite em memoria, nao contra '${sequelize.getDialect()}'.`
      );
    }
    await sequelize.sync({ force: true });

    const sufixo = idUnico();
    const empresa = await Empresa.create({ nome: `Empresa ${sufixo}`, slug: `empresa-${sufixo}` });

    const criarUser = (prefixo, role) => User.create({
      empresaId: empresa.id,
      nome: prefixo,
      email: `${prefixo}-${sufixo}@teste.com`,
      passwordHash: "hash-fake",
      role,
    });

    const staff = await criarUser("staff", "ADMIN");
    const userDono = await criarUser("dono", "USER");
    const userIntruso = await criarUser("intruso", "USER");

    const criarMutuario = (user, prefixo) => Mutuario.create({
      userId: user.id,
      empresaId: empresa.id,
      codigoMutuario: `${prefixo}-${sufixo}`,
      nomeCompleto: prefixo,
    });

    const mutuarioDono = await criarMutuario(userDono, "dono");
    await criarMutuario(userIntruso, "intruso");

    const pedido = await PedidoCredito.create({
      numeroPedido: `PED-${sufixo}`,
      mutuarioId: mutuarioDono.id,
      empresaId: empresa.id,
      valorSolicitado: 100000,
      finalidade: "Teste",
      etapaAtual: 1,
      prazo: 12,
      taxa: 2.5,
      prestacao: 10000,
      jurosTotal: 20000,
      montanteTotal: 120000,
      createdBy: staff.id,
    });

    const requisito = await RequisitoCredito.create({
      empresaId: empresa.id,
      nome: "Bilhete de identidade",
    });

    const pedidoRequisito = await PedidoRequisito.create({
      pedidoId: pedido.id,
      requisitoId: requisito.id,
      empresaId: empresa.id,
    });

    await Anexo.create({
      pedidoRequisitoId: pedidoRequisito.id,
      nome: "bilhete.pdf",
      arquivo: "abc123.pdf",
      mimeType: "application/pdf",
      tamanho: 1024,
      userId: userDono.id,
    });

    cenario = { empresa, staff, userDono, userIntruso, pedidoRequisito };
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const pedidoDe = (user, pedidoRequisitoId) => ({
    params: { id: String(pedidoRequisitoId) },
    user: { id: user.id, role: user.role, empresaId: user.empresaId },
  });

  test("staff da empresa lista os anexos", async () => {
    const res = mockRes();
    await listar(pedidoDe(cenario.staff, cenario.pedidoRequisito.id), res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ nome: "bilhete.pdf" }),
    ]));
  });

  test("o proprio mutuario lista os anexos do seu pedido", async () => {
    const res = mockRes();
    await listar(pedidoDe(cenario.userDono, cenario.pedidoRequisito.id), res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test("outro mutuario da MESMA empresa nao chega aos anexos alheios", async () => {
    // Este é o caso que passava antes: pertencer à empresa chegava.
    const res = mockRes();
    await listar(pedidoDe(cenario.userIntruso, cenario.pedidoRequisito.id), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  /*
    O upload do portal (portalMutuario.controller.js) não fazia verificação
    nenhuma sobre req.params.id: qualquer utilizador autenticado anexava um
    ficheiro ao requisito de outra pessoa (ou de outra empresa) e o staff
    dessa empresa era notificado para o ir abrir. Só o caso negativo é
    testado aqui — o positivo grava mesmo em disco e dispara notificações.
  */
  test("upload do portal recusa requisito que nao e do proprio mutuario", async () => {
    const res = mockRes();
    const req = pedidoDe(cenario.userIntruso, cenario.pedidoRequisito.id);
    req.file = { originalname: "falso.pdf", filename: "x.pdf", mimetype: "application/pdf", size: 10 };

    await anexarReqPedido(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(await Anexo.count({ where: { userId: cenario.userIntruso.id } })).toBe(0);
  });
});
