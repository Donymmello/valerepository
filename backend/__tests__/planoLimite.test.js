/**
 * Testes unitários do gate de funcionalidades por plano (config/planos.js +
 * middleware/planoLimite.middleware.js). A cache de Empresa
 * (utils/empresaCache.js) é mockada para controlar exatamente que plano
 * "está na base de dados" em cada cenário, sem precisar de uma empresa
 * real. O uso real (limite de utilizadores, bloqueio de importação) já é
 * coberto por authIntegration.test.js contra o sqlite em memória.
 */

jest.mock("../utils/empresaCache", () => ({
  obterEmpresaCacheada: jest.fn(),
}));

const { obterEmpresaCacheada } = require("../utils/empresaCache");
const { obterLimitesPlano, LIMITES_PLANO } = require("../config/planos");
const { exigirFuncionalidadePlano } = require("../middleware/planoLimite.middleware");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("config/planos.js", () => {
  test("STARTER: 3 utilizadores, sem importação", () => {
    expect(obterLimitesPlano("STARTER")).toEqual({ maxUtilizadoresInternos: 3, permiteImportacaoExcel: false });
  });

  test("BUSINESS: 10 utilizadores, sem importação", () => {
    expect(obterLimitesPlano("BUSINESS")).toEqual({ maxUtilizadoresInternos: 10, permiteImportacaoExcel: false });
  });

  test("ENTERPRISE: sem limite de utilizadores, com importação", () => {
    expect(obterLimitesPlano("ENTERPRISE")).toEqual({ maxUtilizadoresInternos: null, permiteImportacaoExcel: true });
  });

  test("plano desconhecido/nulo cai no mais restrito (STARTER), nunca no mais permissivo", () => {
    expect(obterLimitesPlano(undefined)).toEqual(LIMITES_PLANO.STARTER);
    expect(obterLimitesPlano("QUALQUER_COISA_INVALIDA")).toEqual(LIMITES_PLANO.STARTER);
  });
});

describe("middleware exigirFuncionalidadePlano", () => {
  beforeEach(() => {
    obterEmpresaCacheada.mockReset();
  });

  test("bloqueia com 403 quando o plano não inclui a funcionalidade", async () => {
    obterEmpresaCacheada.mockResolvedValue({ plano: "STARTER" });
    const middleware = exigirFuncionalidadePlano("permiteImportacaoExcel", "só no Empresarial");
    const req = { user: { empresaId: 1 } };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "só no Empresarial", motivo: "FUNCIONALIDADE_FORA_DO_PLANO" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("deixa passar (next) quando o plano inclui a funcionalidade", async () => {
    obterEmpresaCacheada.mockResolvedValue({ plano: "ENTERPRISE" });
    const middleware = exigirFuncionalidadePlano("permiteImportacaoExcel");
    const req = { user: { empresaId: 2 } };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("empresa não encontrada (cache devolve null) cai no plano mais restrito e bloqueia", async () => {
    obterEmpresaCacheada.mockResolvedValue(null);
    const middleware = exigirFuncionalidadePlano("permiteImportacaoExcel");
    const req = { user: { empresaId: 999 } };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
