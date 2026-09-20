/**
 * O multer grava o ficheiro em disco antes de o controller correr, por
 * isso um pedido rejeitado a seguir (403/404/409) deixava lixo em
 * upload/. Este middleware apaga-o quando a resposta sai com erro.
 *
 * Usa ficheiros reais numa pasta temporária: o que se quer verificar é
 * precisamente o efeito no sistema de ficheiros, um mock de fs só
 * provaria que a função foi chamada.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { EventEmitter } = require("events");

const { limparUploadOrfaoMiddleware } = require("../middleware/limparUploadOrfao.middleware");

let pastaTemp;

beforeAll(() => {
  pastaTemp = fs.mkdtempSync(path.join(os.tmpdir(), "upload-orfao-"));
});

afterAll(() => {
  fs.rmSync(pastaTemp, { recursive: true, force: true });
});

function criarFicheiro(nome) {
  const destino = path.join(pastaTemp, nome);
  fs.writeFileSync(destino, "conteudo");

  return { path: destino, filename: nome };
}

/*
  Corre o middleware e dispara o "finish" como o Express faz quando a
  resposta termina. O unlink é assíncrono, daí o await do tick a seguir.
*/
async function correr({ file, files, statusCode }) {
  const res = new EventEmitter();
  res.statusCode = statusCode;

  const next = jest.fn();
  limparUploadOrfaoMiddleware({ file, files }, res, next);
  expect(next).toHaveBeenCalled();

  res.emit("finish");
  await new Promise((resolve) => setImmediate(resolve));
}

describe("limparUploadOrfaoMiddleware", () => {
  test("apaga o ficheiro quando a resposta sai com erro", async () => {
    const ficheiro = criarFicheiro("rejeitado.pdf");

    await correr({ file: ficheiro, statusCode: 404 });

    expect(fs.existsSync(ficheiro.path)).toBe(false);
  });

  test("mantem o ficheiro quando o pedido corre bem", async () => {
    const ficheiro = criarFicheiro("aceite.pdf");

    await correr({ file: ficheiro, statusCode: 201 });

    expect(fs.existsSync(ficheiro.path)).toBe(true);
  });

  test("ignora uploads em memoria (sem .path)", async () => {
    // Importação de Excel usa memoryStorage: não há nada para apagar e
    // não pode rebentar por causa disso.
    await expect(
      correr({ file: { buffer: Buffer.from("x"), originalname: "folha.xlsx" }, statusCode: 400 })
    ).resolves.toBeUndefined();
  });

  test("nao rebenta quando nao houve upload nenhum", async () => {
    await expect(correr({ statusCode: 500 })).resolves.toBeUndefined();
  });
});
