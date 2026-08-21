/**
 * Testes de regressão para fluxos críticos.
 *
 * Reescrita: o ficheiro anterior tinha 30 testes, todos
 * `expect(true).toBe(true)` com `// TODO` — passavam sempre,
 * sem testar nada. Esta versão só afirma coisas que o código
 * realmente faz. Onde a funcionalidade descrita não existe (ou
 * foi propositadamente removida), fica um `test.todo(...)` com
 * o motivo — não um teste falso a fingir que passa.
 *
 * Sem BD real disponível neste projeto para testes automatizados,
 * por isso os controllers são testados com os models mockados
 * (unit test), não como teste de integração ponta-a-ponta.
 */

jest.mock("bcryptjs");
jest.mock("../utils/logAuditoria");
jest.mock("../models", () => ({
  sequelize: { transaction: jest.fn((cb) => cb({})) },
  User: { findOne: jest.fn(), findAll: jest.fn().mockResolvedValue([]) },
  Mutuario: { findByPk: jest.fn() },
  // findByPk usado em createPedidoCredito para ler a taxaJurosMin da
  // empresa (ver pedidoCredito.controller.js) — mock tinha ficado
  // desatualizado desde que essa funcionalidade foi adicionada, o que
  // fazia os dois testes abaixo rebentar com "findByPk is not a function".
  Empresa: { update: jest.fn(), findByPk: jest.fn().mockResolvedValue({ taxaJurosMin: 18 }) },
  PedidoCredito: { create: jest.fn(), findOne: jest.fn() },
  Notificacao: { bulkCreate: jest.fn() },
  ConvitePortal: {},
  PasswordResetToken: {},
  EmailVerificationToken: {},
}));

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const bcrypt = require("bcryptjs");
const { User, Mutuario, PedidoCredito, Notificacao } = require("../models");
const { login } = require("../controllers/auth.controller");
const { createPedidoCredito, updatePedidoCredito } = require("../controllers/pedidoCredito.controller");
const { generateOTP, getExpirationTime } = require("../utils/otpGenerator");
const requestIdMiddleware = require("../middleware/requestId.middleware");
const { performanceMetricsMiddleware, getMetricsStats, resetMetrics } = require("../middleware/performanceMetrics.middleware");
const { ping } = require("../controllers/health.controller");
const { errorHandlerMiddleware } = require("../middleware/errorHandler.middleware");
const logger = require("../utils/logger");

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Authentication Flow", () => {
  test("login rejeita utilizador inexistente (404)", async () => {
    User.findOne.mockResolvedValue(null);
    const req = { body: { email: "x@x.com", password: "123456" } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("login rejeita password errada (401)", async () => {
    User.findOne.mockResolvedValue({ id: 1, ativo: true, passwordHash: "hash", role: "ADMIN" });
    bcrypt.compare.mockResolvedValue(false);
    const req = { body: { email: "x@x.com", password: "errada" } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("login com credenciais válidas gera token (200)", async () => {
    User.findOne.mockResolvedValue({
      id: 1, nome: "Ana", email: "x@x.com", ativo: true, role: "ADMIN", empresaId: 5,
      passwordHash: "hash", empresa: { id: 5, estado: "ATIVA", trialEndsAt: null },
    });
    bcrypt.compare.mockResolvedValue(true);
    const req = { body: { email: "x@x.com", password: "certa" } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(res.status).not.toHaveBeenCalledWith(403);
    const payload = res.json.mock.calls[0][0];
    expect(typeof payload.token).toBe("string");
    expect(payload.token.length).toBeGreaterThan(10);
  });

  test.todo("refresh de token expirado — não existe nenhum endpoint de refresh no backend");
});

describe("OTP", () => {
  test("generateOTP devolve sempre 6 dígitos numéricos", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateOTP()).toMatch(/^\d{6}$/);
    }
  });

  test("generateOTP varia entre chamadas", () => {
    const amostras = new Set(Array.from({ length: 20 }, () => generateOTP()));
    expect(amostras.size).toBeGreaterThan(1);
  });

  test("getExpirationTime(10) expira ~10 minutos no futuro por omissão", () => {
    const antes = Date.now();
    const expiresAt = getExpirationTime();
    const diffMin = (expiresAt.getTime() - antes) / 60000;
    expect(diffMin).toBeGreaterThan(9.9);
    expect(diffMin).toBeLessThan(10.1);
  });

  test("getExpirationTime respeita minutos customizados", () => {
    const antes = Date.now();
    const expiresAt = getExpirationTime(30);
    const diffMin = (expiresAt.getTime() - antes) / 60000;
    expect(diffMin).toBeGreaterThan(29.9);
    expect(diffMin).toBeLessThan(30.1);
  });

  test.todo(
    "pedir OTP / verificar OTP / auto-login — depende de EmailVerificationToken + envio de email reais; " +
    "precisa de teste de integração com BD, não é isolável em unit test sem mockar o próprio comportamento a testar"
  );
});

describe("Pedido Creation Flow", () => {
  const reqBase = {
    user: { id: 1, role: "ADMIN", empresaId: 5 },
    body: { mutuarioId: 9, valorSolicitado: 10000, prazo: 12, finalidade: "Negócio" },
  };

  test("rejeita quem não tem permissão para criar pedido (403)", async () => {
    const req = { ...reqBase, user: { id: 1, role: "DIRETOR", empresaId: 5 } };
    const res = mockRes();

    await createPedidoCredito(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("rejeita campos obrigatórios em falta (400)", async () => {
    const req = { user: reqBase.user, body: { mutuarioId: 9 } };
    const res = mockRes();

    await createPedidoCredito(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("prazoAvaliacao fica a 7 dias exatos da submissão", async () => {
    Mutuario.findByPk.mockResolvedValue({ id: 9, empresaId: 5 });
    PedidoCredito.create.mockImplementation(async (dados) => ({ id: 100, ...dados }));
    const req = { ...reqBase, body: { ...reqBase.body } };
    const res = mockRes();

    await createPedidoCredito(req, res);

    const dadosCriados = PedidoCredito.create.mock.calls[0][0];
    const diffDias = (dadosCriados.prazoAvaliacao - dadosCriados.dataSubmissao) / (1000 * 60 * 60 * 24);
    expect(diffDias).toBe(7);
    expect(dadosCriados.prazoValidacao).toEqual(dadosCriados.prazoAvaliacao);
  });

  test("cria notificação em massa para o backoffice ao criar pedido", async () => {
    Mutuario.findByPk.mockResolvedValue({ id: 9, empresaId: 5 });
    PedidoCredito.create.mockImplementation(async (dados) => ({ id: 100, ...dados }));
    User.findAll.mockResolvedValue([{ id: 42 }]);
    const req = { ...reqBase, body: { ...reqBase.body } };
    const res = mockRes();

    await createPedidoCredito(req, res);

    expect(Notificacao.bulkCreate).toHaveBeenCalled();
    const notificacoes = Notificacao.bulkCreate.mock.calls[0][0];
    expect(notificacoes[0]).toMatchObject({ userId: 42, pedidoId: 100 });
  });

  test("atualizar pedido nunca deixa mudar prazo/prazoAvaliacao/prazoValidacao", async () => {
    const pedidoFake = {
      id: 1, status: "SUBMETIDO", empresaId: 5, numeroPedido: "PED-1",
      valorSolicitado: 5000, update: jest.fn().mockResolvedValue(true),
    };
    PedidoCredito.findOne.mockResolvedValue(pedidoFake);
    const req = {
      params: { id: 1 },
      user: { id: 1, role: "ADMIN", empresaId: 5 },
      body: { valorSolicitado: 6000, prazoAvaliacao: "2099-01-01", prazoValidacao: "2099-01-01", prazo: 999 },
    };
    const res = mockRes();

    await updatePedidoCredito(req, res);

    expect(pedidoFake.update).toHaveBeenCalled();
    const dadosAtualizados = pedidoFake.update.mock.calls[0][0];
    expect(dadosAtualizados).not.toHaveProperty("prazoAvaliacao");
    expect(dadosAtualizados).not.toHaveProperty("prazoValidacao");
    expect(dadosAtualizados).not.toHaveProperty("prazo");
  });
});

describe("Alert System (thresholds de performance)", () => {
  // middleware/performanceMetrics.middleware.js tem o comentário:
  // "ponytail: Removed alertManager integration - use logs only"
  // — este subsistema foi removido de propósito. Não há limiares,
  // "acknowledge" nem configuração para testar.
  test.todo("alerta crítico para pedidos lentos (>5s) — subsistema de alertas removido, só ficaram logs");
  test.todo("alerta de aviso para memória alta (>70%) — subsistema de alertas removido");
  test.todo("alerta crítico para CPU alta (>80%) — subsistema de alertas removido");
  test.todo("marcar alerta como reconhecido — não existe conceito de alerta persistente");
  test.todo("configurar limiares de alerta — não existe configuração de limiares no código");
});

describe("Monitoring & Observability", () => {
  test("requestIdMiddleware gera um ID único por pedido", () => {
    const req1 = {};
    const res1 = { setHeader: jest.fn() };
    const req2 = {};
    const res2 = { setHeader: jest.fn() };

    requestIdMiddleware(req1, res1, () => {});
    requestIdMiddleware(req2, res2, () => {});

    expect(req1.requestId).toMatch(/^REQ-/);
    expect(req1.requestId).not.toBe(req2.requestId);
    expect(res1.setHeader).toHaveBeenCalledWith("X-Request-ID", req1.requestId);
  });

  test("performanceMetricsMiddleware regista duração do pedido", () => {
    resetMetrics();
    const req = { method: "GET", path: "/rota-teste", requestId: "REQ-1", user: null };
    const res = { statusCode: 200, json: jest.fn(function (data) { return data; }) };

    performanceMetricsMiddleware(req, res, () => {});
    res.json({ ok: true });

    const stats = getMetricsStats();
    expect(stats["GET /rota-teste"].totalRequests).toBe(1);
  });

  test("ping devolve OK sem tocar na base de dados", () => {
    const req = { requestId: "REQ-2" };
    const res = { json: jest.fn() };

    ping(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "OK", requestId: "REQ-2" }));
  });

  test.todo("logger de queries SQL — logging do Sequelize está desligado (config/db.js), não existe logger de queries à parte");
  test.todo("taxa de acerto/falha de cache — não existe nenhuma camada de cache no projeto");
});

describe("Data Integrity", () => {
  test("errorHandlerMiddleware apaga dados sensíveis antes de logar", () => {
    const logSpy = jest.spyOn(logger, "error").mockImplementation(() => {});
    const err = new Error("falhou");
    const req = {
      method: "POST", path: "/x", originalUrl: "/x", query: {},
      requestId: "REQ-3", user: null, startTime: Date.now(),
      body: { email: "a@b.com", password: "segredo123", token: "abc", nested: { pin: "1234" } },
    };
    const res = { headersSent: false, status: jest.fn().mockReturnThis(), json: jest.fn() };

    errorHandlerMiddleware(err, req, res, () => {});

    const logContext = logSpy.mock.calls[0][1].context;
    expect(logContext.body.password).toBe("***");
    expect(logContext.body.token).toBe("***");
    expect(logContext.body.nested.pin).toBe("***");
    expect(logContext.body.email).toBe("a@b.com"); // não sensível, não deve ser mascarado

    logSpy.mockRestore();
  });

  test.todo(
    "impedir registos duplicados (email/documento) — imposto por UNIQUE constraint na BD; " +
    "precisa de teste de integração contra uma BD real, .validate() sozinho não o apanha"
  );

  // "validar dados de entrada" e "impor constraints de negócio" já estão cobertos
  // acima, de forma real: ver "Pedido Creation Flow" (campos obrigatórios,
  // permissões por role, imutabilidade de prazo).
});
