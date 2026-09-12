/**
 * Testes unitários do upload de logo da empresa (ver
 * controllers/empresa.controller.js: uploadLogoEmpresa). Models, fs e
 * utils são mockados (unit test), sem BD/disco real disponível neste
 * projeto para testes automatizados.
 */

jest.mock("../models", () => ({
  Empresa: { findByPk: jest.fn() },
}));
jest.mock("../utils/logAuditoria");
jest.mock("../utils/empresaCache", () => ({
  invalidarCacheEmpresa: jest.fn(),
}));
jest.mock("fs", () => ({
  unlink: jest.fn((_path, cb) => cb && cb()),
}));

const fs = require("fs");
const { Empresa } = require("../models");
const { uploadLogoEmpresa } = require("../controllers/empresa.controller");

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

function mockEmpresa(overrides = {}) {
  return {
    id: 1,
    nome: "Financeira X",
    logo: null,
    update: jest.fn(function (novosCampos) {
      Object.assign(this, novosCampos);
      return Promise.resolve(this);
    }),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("uploadLogoEmpresa", () => {
  test("400 quando não vem ficheiro nenhum", async () => {
    const req = { file: null, user: { id: 1, empresaId: 1 } };
    const res = mockRes();

    await uploadLogoEmpresa(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Empresa.findByPk).not.toHaveBeenCalled();
  });

  test("404 e apaga o ficheiro enviado quando a empresa não existe", async () => {
    Empresa.findByPk.mockResolvedValue(null);
    const req = {
      file: { filename: "abc123.png", path: "upload/logos/abc123.png" },
      user: { id: 1, empresaId: 999 },
      protocol: "https",
      get: () => "tshemba.vektramz.com",
    };
    const res = mockRes();

    await uploadLogoEmpresa(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(fs.unlink).toHaveBeenCalledWith("upload/logos/abc123.png", expect.any(Function));
  });

  test("guarda a URL absoluta (https + host) na Empresa e não apaga nada (sem logo anterior)", async () => {
    const empresa = mockEmpresa({ logo: null });
    Empresa.findByPk.mockResolvedValue(empresa);
    const req = {
      file: { filename: "novo-logo.png", path: "upload/logos/novo-logo.png" },
      user: { id: 1, empresaId: 1 },
      protocol: "https",
      get: () => "tshemba.vektramz.com",
    };
    const res = mockRes();

    await uploadLogoEmpresa(req, res);

    expect(empresa.update).toHaveBeenCalledWith({
      logo: "https://tshemba.vektramz.com/api/uploads/logos/novo-logo.png",
    });
    expect(fs.unlink).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("apaga o logo antigo quando era um upload nosso", async () => {
    const empresa = mockEmpresa({
      logo: "https://tshemba.vektramz.com/api/uploads/logos/antigo.png",
    });
    Empresa.findByPk.mockResolvedValue(empresa);
    const req = {
      file: { filename: "novo.png", path: "upload/logos/novo.png" },
      user: { id: 1, empresaId: 1 },
      protocol: "https",
      get: () => "tshemba.vektramz.com",
    };
    const res = mockRes();

    await uploadLogoEmpresa(req, res);

    expect(fs.unlink).toHaveBeenCalledWith(
      expect.stringContaining("antigo.png"),
      expect.any(Function)
    );
  });

  test("não tenta apagar uma URL externa colada manualmente antes (não é upload nosso)", async () => {
    const empresa = mockEmpresa({ logo: "https://outrositio.com/logo-da-empresa.png" });
    Empresa.findByPk.mockResolvedValue(empresa);
    const req = {
      file: { filename: "novo.png", path: "upload/logos/novo.png" },
      user: { id: 1, empresaId: 1 },
      protocol: "https",
      get: () => "tshemba.vektramz.com",
    };
    const res = mockRes();

    await uploadLogoEmpresa(req, res);

    expect(fs.unlink).not.toHaveBeenCalled();
  });
});
