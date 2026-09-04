/**
 * Testes de integração para os fluxos marcados como `test.todo` em
 * criticalFlows.test.js, casos que dependem de comportamento real da
 * base de dados e não são isoláveis num unit test com mocks (ex: uma
 * transação real, uma UNIQUE constraint real, um `findOne` de deteção
 * de duplicado).
 *
 * Diferença para criticalFlows.test.js: aqui os models NÃO são
 * mockados, corre contra o Sequelize real, ligado a um sqlite em
 * memória (ver config/db.js, ativado quando NODE_ENV=test). Só o
 * envio de email e o despacho externo de notificações (SMS/email via
 * Resend/Africa's Talking) são mockados, porque são efeitos externos
 * ao sistema, não comportamento a testar aqui.
 */

jest.mock("../services/notificacaoExterna.service", () => ({
  despacharNotificacaoExterna: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../utils/emailService", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

process.env.JWT_SECRET = process.env.JWT_SECRET || "segredo-de-teste-nao-usar-em-producao";

// O default do jest (5000ms) é apertado demais para sequelize.sync({force:true})
// contra um sqlite em memória dentro de Docker, cria/recria todas as
// tabelas e índices do sistema (incluindo os compostos novos), e varia
// bastante consoante a máquina. Aplica-se ao ficheiro todo (beforeAll,
// afterAll e cada teste), não só ao sync.
jest.setTimeout(30000);

const {
  sequelize,
  Empresa,
  User,
  Mutuario,
  ConvitePortal,
  EmailVerificationToken,
} = require("../models");
const {
  registerMutuarioRequestOTP,
  verifyOTPAndRegister,
} = require("../controllers/auth.controller");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function idUnico() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

async function criarEmpresaComAdmin() {
  const sufixo = idUnico();
  const empresa = await Empresa.create({
    nome: `Empresa Teste ${sufixo}`,
    slug: `empresa-teste-${sufixo}`,
  });
  const admin = await User.create({
    empresaId: empresa.id,
    nome: "Admin Teste",
    email: `admin-${sufixo}@teste.com`,
    passwordHash: "hash-fake",
    role: "ADMIN",
  });
  return { empresa, admin };
}

async function criarConviteValido(empresaId, criadoPor) {
  return ConvitePortal.create({
    token: `convite-${idUnico()}`,
    empresaId,
    criadoPor,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
}

beforeAll(async () => {
  // Trava de segurança: sync({force:true}) apaga e recria TODAS as
  // tabelas. Isto só pode correr contra o sqlite em memória de teste
  // (ver config/db.js), nunca contra a BD real. Já aconteceu de
  // NODE_ENV=test não chegar a este processo (o .env do Docker define
  // NODE_ENV=development, e isso ganha se o comando não forçar
  // NODE_ENV=test explicitamente, ver package.json, script "test").
  // Esta verificação existe para nunca mais isso passar despercebido.
  if (sequelize.getDialect() !== "sqlite") {
    throw new Error(
      `Recusado: authIntegration.test.js só pode correr contra sqlite em memória, não contra '${sequelize.getDialect()}'. ` +
      `Confirma que NODE_ENV=test está definido (o script "test" do package.json já força isto, não corras "jest" diretamente sem ele).`
    );
  }

  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("Fluxo de registo por OTP (integração, BD real)", () => {
  test("pedir OTP, verificar OTP e completar registo cria User + Mutuário reais", async () => {
    const { empresa, admin } = await criarEmpresaComAdmin();
    const convite = await criarConviteValido(empresa.id, admin.id);
    const email = `novo.mutuario-${idUnico()}@teste.com`;

    const resOtp = mockRes();
    await registerMutuarioRequestOTP(
      {
        body: {
          token: convite.token,
          nome: "utilizadorteste",
          email,
          password: "senha1234",
          nomeCompleto: "Novo Mutuário Teste",
          telefone: "841234567",
        },
      },
      resOtp
    );

    expect(resOtp.status).toHaveBeenCalledWith(200);

    const tokenRow = await EmailVerificationToken.findOne({ where: { email } });
    expect(tokenRow).not.toBeNull();
    expect(tokenRow.otp).toMatch(/^\d{6}$/);
    expect(tokenRow.temporaryData.nomeCompleto).toBe("Novo Mutuário Teste");
    expect(tokenRow.verified).toBe(false);

    const resVerify = mockRes();
    await verifyOTPAndRegister({ body: { email, otp: tokenRow.otp } }, resVerify);

    expect(resVerify.status).toHaveBeenCalledWith(201);
    const payload = resVerify.json.mock.calls[0][0];
    expect(typeof payload.token).toBe("string");
    expect(payload.mutuario.nomeCompleto).toBe("Novo Mutuário Teste");

    const userCriado = await User.findOne({ where: { email } });
    expect(userCriado).not.toBeNull();
    expect(userCriado.role).toBe("USER");
    expect(userCriado.empresaId).toBe(empresa.id);

    const mutuarioCriado = await Mutuario.findOne({ where: { userId: userCriado.id } });
    expect(mutuarioCriado).not.toBeNull();
    expect(mutuarioCriado.nomeCompleto).toBe("Novo Mutuário Teste");
    expect(mutuarioCriado.empresaId).toBe(empresa.id);

    const conviteAtualizado = await ConvitePortal.findByPk(convite.id);
    expect(conviteAtualizado.usado).toBe(true);
    expect(conviteAtualizado.usadoPor).toBe(userCriado.id);

    const tokenAtualizado = await EmailVerificationToken.findByPk(tokenRow.id);
    expect(tokenAtualizado.verified).toBe(true);
  });

  test("OTP errado é rejeitado com 400 e nada é criado na BD", async () => {
    const { empresa, admin } = await criarEmpresaComAdmin();
    const convite = await criarConviteValido(empresa.id, admin.id);
    const email = `otp-errado-${idUnico()}@teste.com`;

    await registerMutuarioRequestOTP(
      {
        body: {
          token: convite.token,
          nome: "outrouser",
          email,
          password: "senha1234",
          nomeCompleto: "Outro Mutuário",
          telefone: "841112233",
        },
      },
      mockRes()
    );

    const resVerify = mockRes();
    await verifyOTPAndRegister({ body: { email, otp: "000000" } }, resVerify);

    expect(resVerify.status).toHaveBeenCalledWith(400);
    const userCriado = await User.findOne({ where: { email } });
    expect(userCriado).toBeNull();
  });

  test("convite já usado é rejeitado na verificação (segunda tentativa com o mesmo convite)", async () => {
    const { empresa, admin } = await criarEmpresaComAdmin();
    const convite = await criarConviteValido(empresa.id, admin.id);
    const email1 = `primeiro-${idUnico()}@teste.com`;
    const email2 = `segundo-${idUnico()}@teste.com`;

    // Primeiro registo completa-se normalmente e consome o convite.
    await registerMutuarioRequestOTP(
      {
        body: {
          token: convite.token, nome: "primeiro", email: email1, password: "senha1234",
          nomeCompleto: "Primeiro", telefone: "840000010",
        },
      },
      mockRes()
    );
    const tokenRow1 = await EmailVerificationToken.findOne({ where: { email: email1 } });
    await verifyOTPAndRegister({ body: { email: email1, otp: tokenRow1.otp } }, mockRes());

    // Segunda tentativa pede OTP com o mesmo convite (já usado), a etapa 1
    // já deve rejeitar, sem chegar a criar token nenhum.
    const resOtp2 = mockRes();
    await registerMutuarioRequestOTP(
      {
        body: {
          token: convite.token, nome: "segundo", email: email2, password: "senha1234",
          nomeCompleto: "Segundo", telefone: "840000011",
        },
      },
      resOtp2
    );

    expect(resOtp2.status).toHaveBeenCalledWith(400);
    const tokenRow2 = await EmailVerificationToken.findOne({ where: { email: email2 } });
    expect(tokenRow2).toBeNull();
  });
});

describe("Bloqueio de registos duplicados (integração, BD real)", () => {
  test("bloqueia com 409 se já existe um utilizador com o mesmo email", async () => {
    const { empresa, admin } = await criarEmpresaComAdmin();
    const convite = await criarConviteValido(empresa.id, admin.id);
    const emailExistente = `duplicado-${idUnico()}@teste.com`;

    await User.create({
      empresaId: empresa.id,
      nome: "Já Existe",
      email: emailExistente,
      passwordHash: "hash-fake",
      role: "USER",
    });

    const res = mockRes();
    await registerMutuarioRequestOTP(
      {
        body: {
          token: convite.token, nome: "novo", email: emailExistente, password: "senha1234",
          nomeCompleto: "Tentativa Duplicada", telefone: "840000000",
        },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toMatch(/já existe um utilizador/i);
  });

  test("bloqueia com 409 se já existe um mutuário com o mesmo nuit, na mesma empresa", async () => {
    const { empresa, admin } = await criarEmpresaComAdmin();
    const convite = await criarConviteValido(empresa.id, admin.id);
    const nuit = `NUIT${idUnico()}`;

    await Mutuario.create({
      codigoMutuario: `MUT-${idUnico()}`,
      empresaId: empresa.id,
      nomeCompleto: "Mutuário Existente",
      nuit,
    });

    const res = mockRes();
    await registerMutuarioRequestOTP(
      {
        body: {
          token: convite.token, nome: "novo2", email: `novo2-${idUnico()}@teste.com`, password: "senha1234",
          nomeCompleto: "Tentativa Duplicada NUIT", telefone: "840000001", nuit,
        },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toMatch(/nuit/i);
  });

  // Corrigido: a deteção de duplicado em registerMutuarioRequestOTP passou a
  // isolar por empresaId (igual a validarIntegridadeMutuario, em
  // mutuario.controller.js). Este teste substituiu o antigo "ACHADO" que
  // documentava o bug, agora confirma que o mesmo nuit em empresas
  // (tenants) diferentes NÃO bloqueia, porque são pessoas/relações
  // diferentes. Ver RECUPERACAO_BD.md secção 26/29.
  test("permite o mesmo nuit em empresas diferentes (dedupe isolado por tenant)", async () => {
    const { empresa: empresaA } = await criarEmpresaComAdmin();
    const { empresa: empresaB, admin: adminB } = await criarEmpresaComAdmin();
    const conviteB = await criarConviteValido(empresaB.id, adminB.id);
    const nuit = `NUIT${idUnico()}`;

    await Mutuario.create({
      codigoMutuario: `MUT-${idUnico()}`,
      empresaId: empresaA.id,
      nomeCompleto: "Existente Noutra Empresa",
      nuit,
    });

    const res = mockRes();
    await registerMutuarioRequestOTP(
      {
        body: {
          token: conviteB.token, nome: "novo3", email: `novo3-${idUnico()}@teste.com`, password: "senha1234",
          nomeCompleto: "Pessoa Diferente, Empresa Diferente", telefone: "840000002", nuit,
        },
      },
      res
    );

    // Empresas diferentes, mesmo nuit, não é duplicado real, tem de passar.
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("continua a bloquear com 409 o mesmo nuit dentro da mesma empresa", async () => {
    const { empresa, admin } = await criarEmpresaComAdmin();
    const convite = await criarConviteValido(empresa.id, admin.id);
    const nuit = `NUIT${idUnico()}`;

    await Mutuario.create({
      codigoMutuario: `MUT-${idUnico()}`,
      empresaId: empresa.id,
      nomeCompleto: "Existente Na Mesma Empresa",
      nuit,
    });

    const res = mockRes();
    await registerMutuarioRequestOTP(
      {
        body: {
          token: convite.token, nome: "novo4", email: `novo4-${idUnico()}@teste.com`, password: "senha1234",
          nomeCompleto: "Tentativa Duplicada Mesma Empresa", telefone: "840000003", nuit,
        },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(409);
  });
});
