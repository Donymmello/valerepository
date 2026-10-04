/**
 * Rotação do refresh token com deteção de reutilização.
 *
 * Corre contra o Sequelize real (sqlite em memória, ver config/db.js com
 * NODE_ENV=test), porque o que está a ser testado é precisamente o
 * comportamento da base de dados: o UPDATE condicional que serializa dois
 * pedidos simultâneos, e a revogação em bloco por familiaId.
 *
 * O caminho feliz básico (login emite, /auth/refresh troca) já está em
 * authIntegration.test.js; aqui só o que a rotação trouxe de novo.
 */

jest.mock("../services/notificacaoExterna.service", () => ({
  despacharNotificacaoExterna: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../utils/emailService", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

process.env.JWT_SECRET = process.env.JWT_SECRET || "segredo-de-teste-nao-usar-em-producao";

jest.setTimeout(30000);

const bcrypt = require("bcryptjs");
const { sequelize, Empresa, User, RefreshToken } = require("../models");
const { login, refreshAccessToken } = require("../controllers/auth.controller");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const SENHA = "senhaDeTeste123";

/**
 * Corre `fn` com Date.now() adiantado em `ms`. Só Date.now(): o Sequelize
 * carimba os registos com `new Date()`, que fica a andar normalmente, por
 * isso o que já está guardado não se move e só o controlador vê o salto.
 */
async function comRelogioAdiantado(ms, fn) {
  const agora = Date.now();
  const spy = jest.spyOn(Date, "now").mockReturnValue(agora + ms);
  try {
    return await fn();
  } finally {
    spy.mockRestore();
  }
}

async function criarUtilizadorELogin() {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  const empresa = await Empresa.create({
    nome: `Empresa ${sufixo}`,
    slug: `empresa-${sufixo}`,
  });
  const user = await User.create({
    empresaId: empresa.id,
    nome: "Admin Teste",
    email: `admin-${sufixo}@teste.com`,
    passwordHash: await bcrypt.hash(SENHA, 10),
    role: "ADMIN",
  });

  const res = mockRes();
  await login({ body: { email: user.email, password: SENHA } }, res);
  expect(res.status).toHaveBeenCalledWith(200);

  return { user, refreshToken: res.json.mock.calls[0][0].refreshToken };
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("Rotação do refresh token", () => {
  test("cada troca devolve um refresh token novo e revoga o anterior", async () => {
    const { refreshToken } = await criarUtilizadorELogin();

    const res = mockRes();
    await refreshAccessToken({ body: { refreshToken } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const { refreshToken: novo } = res.json.mock.calls[0][0];

    expect(typeof novo).toBe("string");
    expect(novo).not.toBe(refreshToken);

    const antigo = await RefreshToken.findOne({ where: { token: refreshToken } });
    expect(antigo.revoked).toBe(true);
  });

  test("o token novo fica na mesma família do que substituiu", async () => {
    const { refreshToken } = await criarUtilizadorELogin();

    const res = mockRes();
    await refreshAccessToken({ body: { refreshToken } }, res);
    const novo = res.json.mock.calls[0][0].refreshToken;

    const [antes, depois] = await Promise.all([
      RefreshToken.findOne({ where: { token: refreshToken } }),
      RefreshToken.findOne({ where: { token: novo } }),
    ]);

    expect(depois.familiaId).toBe(antes.familiaId);
  });

  test("cada login abre uma família própria", async () => {
    const { user } = await criarUtilizadorELogin();

    const res = mockRes();
    await login({ body: { email: user.email, password: SENHA } }, res);
    const segundo = res.json.mock.calls[0][0].refreshToken;

    const tokens = await RefreshToken.findAll({ where: { userId: user.id } });
    const familias = new Set(tokens.map((t) => t.familiaId));

    expect(tokens).toHaveLength(2);
    expect(familias.size).toBe(2);
    expect(tokens.some((t) => t.token === segundo)).toBe(true);
  });

  test("dois pedidos em simultâneo com o mesmo token: ambos passam e convergem", async () => {
    const { refreshToken } = await criarUtilizadorELogin();

    // A corrida real entre separadores. Ambos trazem o mesmo token; só um
    // ganha o UPDATE condicional, o outro cai na janela de graça e recebe
    // o sucessor em vez de derrubar a sessão.
    const [resA, resB] = [mockRes(), mockRes()];
    await Promise.all([
      refreshAccessToken({ body: { refreshToken } }, resA),
      refreshAccessToken({ body: { refreshToken } }, resB),
    ]);

    expect(resA.status).toHaveBeenCalledWith(200);
    expect(resB.status).toHaveBeenCalledWith(200);

    const tokenA = resA.json.mock.calls[0][0].refreshToken;
    const tokenB = resB.json.mock.calls[0][0].refreshToken;
    expect(tokenA).toBe(tokenB);

    const vivo = await RefreshToken.findOne({ where: { token: tokenA } });
    expect(vivo.revoked).toBe(false);
  });

  test("token já gasto, fora da janela de graça: família inteira revogada", async () => {
    const { user, refreshToken } = await criarUtilizadorELogin();

    const resPrimeira = mockRes();
    await refreshAccessToken({ body: { refreshToken } }, resPrimeira);
    const sucessor = resPrimeira.json.mock.calls[0][0].refreshToken;

    // Adianta dez minutos o relógio que o controlador usa para medir a
    // janela de graça. Mexer no updated_at guardado obrigaria a escrever
    // datas no formato do dialeto; isto é equivalente e não sabe nada
    // sobre a base de dados. O `new Date()` que valida a expiração do
    // token fica intacto, por isso o token continua dentro da validade:
    // o 401 vem da reutilização, não de ter expirado.
    const resReutilizacao = mockRes();
    await comRelogioAdiantado(10 * 60 * 1000, () =>
      refreshAccessToken({ body: { refreshToken } }, resReutilizacao)
    );
    expect(resReutilizacao.status).toHaveBeenCalledWith(401);

    // O sucessor era o token do utilizador legítimo e cai também: não há
    // como saber qual das cópias é a boa, por isso a sessão termina.
    const registoSucessor = await RefreshToken.findOne({ where: { token: sucessor } });
    expect(registoSucessor.revoked).toBe(true);

    const vivos = await RefreshToken.count({ where: { userId: user.id, revoked: false } });
    expect(vivos).toBe(0);
  });

  test("a revogação em cascata não toca nas famílias dos outros utilizadores", async () => {
    const vitima = await criarUtilizadorELogin();
    const outro = await criarUtilizadorELogin();

    await refreshAccessToken({ body: { refreshToken: vitima.refreshToken } }, mockRes());

    const resReutilizacao = mockRes();
    await comRelogioAdiantado(10 * 60 * 1000, () =>
      refreshAccessToken({ body: { refreshToken: vitima.refreshToken } }, resReutilizacao)
    );
    expect(resReutilizacao.status).toHaveBeenCalledWith(401);

    const naoAfetado = await RefreshToken.findOne({ where: { token: outro.refreshToken } });
    expect(naoAfetado.revoked).toBe(false);

    const resOutro = mockRes();
    await refreshAccessToken({ body: { refreshToken: outro.refreshToken } }, resOutro);
    expect(resOutro.status).toHaveBeenCalledWith(200);
  });
});
