const { avaliarAcessoEmpresa } = require("../utils/empresaAccess");

describe("avaliarAcessoEmpresa", () => {
  test("empresa inexistente é bloqueada", () => {
    expect(avaliarAcessoEmpresa(null)).toEqual({
      permitido: false,
      motivo: "EMPRESA_NAO_ENCONTRADA",
    });
  });

  test("empresa ATIVA tem acesso", () => {
    const resultado = avaliarAcessoEmpresa({ estado: "ATIVA", trialEndsAt: null });
    expect(resultado.permitido).toBe(true);
  });

  test("empresa em TESTE dentro do prazo tem acesso", () => {
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const resultado = avaliarAcessoEmpresa({ estado: "TESTE", trialEndsAt: amanha });
    expect(resultado.permitido).toBe(true);
  });

  test("empresa em TESTE com prazo vencido é bloqueada e marcada para expirar", () => {
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const resultado = avaliarAcessoEmpresa({ estado: "TESTE", trialEndsAt: ontem });
    expect(resultado.permitido).toBe(false);
    expect(resultado.motivo).toBe("TRIAL_EXPIRADO");
    expect(resultado.trialExpirouAgora).toBe(true);
  });

  test("empresa em TESTE sem trialEndsAt definido não expira sozinha", () => {
    const resultado = avaliarAcessoEmpresa({ estado: "TESTE", trialEndsAt: null });
    expect(resultado.permitido).toBe(true);
  });

  test("empresa SUSPENSA é bloqueada", () => {
    const resultado = avaliarAcessoEmpresa({ estado: "SUSPENSA", trialEndsAt: null });
    expect(resultado.permitido).toBe(false);
    expect(resultado.motivo).toBe("EMPRESA_SUSPENSA");
  });

  test("empresa CANCELADA é bloqueada", () => {
    const resultado = avaliarAcessoEmpresa({ estado: "CANCELADA", trialEndsAt: null });
    expect(resultado.permitido).toBe(false);
    expect(resultado.motivo).toBe("EMPRESA_CANCELADA");
  });
});
