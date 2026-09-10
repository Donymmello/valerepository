/**
 * Testes unitários do pedido de plano pago (pagamento manual), ver
 * controllers/solicitacaoAcesso.controller.js. Models e emailService são
 * mockados (unit test), sem BD real disponível neste projeto para testes
 * automatizados fora do sqlite em memória (ver authIntegration.test.js).
 */

jest.mock("../models", () => ({
  SolicitacaoAcesso: { create: jest.fn() },
}));
jest.mock("../utils/emailService", () => ({
  sendInstrucoesPagamentoEmail: jest.fn().mockResolvedValue({ success: true }),
  sendNotificacaoPedidoPlanoDono: jest.fn().mockResolvedValue({ success: true }),
}));

const { SolicitacaoAcesso } = require("../models");
const { sendInstrucoesPagamentoEmail, sendNotificacaoPedidoPlanoDono } = require("../utils/emailService");
const { criarSolicitacaoAcesso } = require("../controllers/solicitacaoAcesso.controller");

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("criarSolicitacaoAcesso", () => {
  test("400 quando falta nomeEmpresa/nomeContacto/email", async () => {
    const req = { body: { nomeEmpresa: "Financeira X" } };
    const res = mockRes();

    await criarSolicitacaoAcesso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(SolicitacaoAcesso.create).not.toHaveBeenCalled();
  });

  test("400 quando o plano enviado não é um dos 3 ENUMs válidos", async () => {
    const req = {
      body: { nomeEmpresa: "Financeira X", nomeContacto: "Ana", email: "ana@x.com", plano: "PLANO_INEXISTENTE" },
    };
    const res = mockRes();

    await criarSolicitacaoAcesso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(SolicitacaoAcesso.create).not.toHaveBeenCalled();
  });

  test("sem plano: regista o pedido sem calcular valor e sem enviar emails (fluxo legado)", async () => {
    SolicitacaoAcesso.create.mockResolvedValue({ id: 42 });
    const req = {
      body: { nomeEmpresa: "Financeira X", nomeContacto: "Ana", email: "ana@x.com" },
    };
    const res = mockRes();

    await criarSolicitacaoAcesso(req, res);

    expect(SolicitacaoAcesso.create).toHaveBeenCalledWith(
      expect.objectContaining({ plano: null, cicloFaturacao: null, valorEstimado: null })
    );
    expect(sendInstrucoesPagamentoEmail).not.toHaveBeenCalled();
    expect(sendNotificacaoPedidoPlanoDono).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("com plano STARTER mensal: calcula 1500 MT e envia os 2 emails com a referência SOL-000042", async () => {
    SolicitacaoAcesso.create.mockResolvedValue({ id: 42 });
    const req = {
      body: {
        nomeEmpresa: "Financeira X", nomeContacto: "Ana", email: "ana@x.com",
        plano: "STARTER", cicloFaturacao: "MENSAL",
      },
    };
    const res = mockRes();

    await criarSolicitacaoAcesso(req, res);

    expect(SolicitacaoAcesso.create).toHaveBeenCalledWith(
      expect.objectContaining({ plano: "STARTER", cicloFaturacao: "MENSAL", valorEstimado: 1500 })
    );
    expect(sendInstrucoesPagamentoEmail).toHaveBeenCalledWith(
      "ana@x.com",
      expect.objectContaining({ nomePlano: "Starter", valor: 1500, referencia: "SOL-000042" })
    );
    expect(sendNotificacaoPedidoPlanoDono).toHaveBeenCalledWith(
      expect.objectContaining({ nomePlano: "Starter", valor: 1500, referencia: "SOL-000042" })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("com plano BUSINESS anual: cobra 10x o mensal (2 meses grátis), nunca confia num valor vindo do cliente", async () => {
    SolicitacaoAcesso.create.mockResolvedValue({ id: 7 });
    const req = {
      body: {
        nomeEmpresa: "Financeira Y", nomeContacto: "Bruno", email: "bruno@y.com",
        plano: "BUSINESS", cicloFaturacao: "ANUAL", valorEstimado: 1,
      },
    };
    const res = mockRes();

    await criarSolicitacaoAcesso(req, res);

    expect(SolicitacaoAcesso.create).toHaveBeenCalledWith(
      expect.objectContaining({ valorEstimado: 35000 })
    );
  });

  test("ciclo de faturação inválido/omitido cai em MENSAL por omissão", async () => {
    SolicitacaoAcesso.create.mockResolvedValue({ id: 1 });
    const req = {
      body: { nomeEmpresa: "Z", nomeContacto: "C", email: "c@z.com", plano: "ENTERPRISE", cicloFaturacao: "SEMESTRAL" },
    };
    const res = mockRes();

    await criarSolicitacaoAcesso(req, res);

    expect(SolicitacaoAcesso.create).toHaveBeenCalledWith(
      expect.objectContaining({ cicloFaturacao: "MENSAL", valorEstimado: 7500 })
    );
  });

  test("falha ao enviar email não impede o 201 (pedido já está gravado)", async () => {
    SolicitacaoAcesso.create.mockResolvedValue({ id: 5 });
    sendInstrucoesPagamentoEmail.mockRejectedValueOnce(new Error("Resend indisponível"));
    const req = {
      body: { nomeEmpresa: "Financeira X", nomeContacto: "Ana", email: "ana@x.com", plano: "STARTER" },
    };
    const res = mockRes();

    await criarSolicitacaoAcesso(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
