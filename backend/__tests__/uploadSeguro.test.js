/**
 * Uploads: o ficheiro é mesmo do tipo que diz ser?
 *
 * A pergunta que motivou isto: "o upload de comprovativo aceita um .exe
 * renomeado para .pdf?" Aceitava. O fileFilter olhava só para
 * file.mimetype, que é o cabeçalho que o próprio cliente escreve no
 * multipart, e o nome gravado herdava a extensão de originalname.
 *
 * Aqui testam-se as duas metades da correção em separado, porque são duas
 * regras: de onde vem a extensão, e se os bytes batem certo com o tipo.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  DOCUMENTOS,
  IMAGENS,
  criarFileFilter,
  validarAssinatura,
} = require("../utils/uploadSeguro");

let pastaTemp;

beforeAll(() => {
  pastaTemp = fs.mkdtempSync(path.join(os.tmpdir(), "upload-seguro-"));
});

afterAll(() => {
  fs.rmSync(pastaTemp, { recursive: true, force: true });
});

function escrever(nome, conteudo) {
  const destino = path.join(pastaTemp, nome);
  fs.writeFileSync(destino, conteudo);
  return destino;
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("extensão do ficheiro gravado", () => {
  /*
    O storage do multer não é facilmente instanciável fora dele, por isso
    testa-se aqui a decisão que interessa: o mapa é a fonte da extensão, e
    o nome enviado pelo cliente não entra na conta.
  */
  test("a extensão sai do mapa do servidor, não do nome enviado", () => {
    expect(DOCUMENTOS["application/pdf"]).toBe(".pdf");
    expect(DOCUMENTOS["image/png"]).toBe(".png");

    // Não há entrada nenhuma que produza um executável, seja qual for o
    // nome que o cliente inventar.
    const extensoes = Object.values({ ...DOCUMENTOS, ...IMAGENS });
    expect(extensoes).not.toContain(".exe");
    expect(extensoes.every((ext) => ext.startsWith("."))).toBe(true);
  });

  test("um mimetype não permitido é recusado pelo filtro", () => {
    const filtro = criarFileFilter(DOCUMENTOS, "Formato não permitido.");
    const cb = jest.fn();

    filtro({}, { mimetype: "application/x-msdownload" }, cb);

    expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
  });
});

describe("validarAssinatura", () => {
  test("recusa um executável que se diz PDF", () => {
    // "MZ" é a assinatura de um executável do Windows. O cliente declara
    // application/pdf; os bytes dizem outra coisa.
    const caminho = escrever("falso.pdf", Buffer.from("MZ\x90\x00\x03\x00\x00\x00", "binary"));
    const req = { file: { path: caminho, mimetype: "application/pdf" } };
    const res = mockRes();
    const next = jest.fn();

    validarAssinatura(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("aceita um PDF verdadeiro", () => {
    const caminho = escrever("real.pdf", Buffer.from("%PDF-1.7\n%âãÏÓ\n", "binary"));
    const req = { file: { path: caminho, mimetype: "application/pdf" } };
    const res = mockRes();
    const next = jest.fn();

    validarAssinatura(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("aceita um PNG verdadeiro", () => {
    const caminho = escrever(
      "real.png",
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
    );
    const req = { file: { path: caminho, mimetype: "image/png" } };
    const res = mockRes();
    const next = jest.fn();

    validarAssinatura(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test("recusa um PNG que afinal é JPEG", () => {
    // Confusão entre formatos permitidos também conta: o que se grava tem
    // de corresponder ao que se declarou, senão a extensão mente.
    const caminho = escrever("confuso.png", Buffer.from([0xff, 0xd8, 0xff, 0xe0]));
    const req = { file: { path: caminho, mimetype: "image/png" } };
    const res = mockRes();
    const next = jest.fn();

    validarAssinatura(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("deixa passar quando não houve upload nenhum", () => {
    const next = jest.fn();

    validarAssinatura({}, mockRes(), next);

    expect(next).toHaveBeenCalled();
  });

  test("não bloqueia SVG, que não tem assinatura fiável", () => {
    // Decisão consciente: SVG é XML e pode começar de várias formas. A
    // defesa do SVG é o Content-Disposition: attachment no mount estático,
    // não a assinatura.
    const caminho = escrever("marca.svg", '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    const req = { file: { path: caminho, mimetype: "image/svg+xml" } };
    const next = jest.fn();

    validarAssinatura(req, mockRes(), next);

    expect(next).toHaveBeenCalled();
  });
});
