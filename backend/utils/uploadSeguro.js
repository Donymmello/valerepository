const crypto = require("crypto");
const fs = require("fs");

/*
  ==========================================================
  UPLOAD SEGURO — PARTILHADO POR TODOS OS MULTER DO PROJETO
  ==========================================================
  Havia três middlewares de upload (anexos, comprovativos, logótipos) com
  o mesmo par de defeitos copiado entre eles:

    1. o nome gravado usava path.extname(file.originalname), ou seja a
       extensão vinha do cliente. Um .exe ficava gravado como .exe;
    2. o fileFilter só olhava para file.mimetype, que é o cabeçalho que o
       próprio cliente escreve no multipart. Renomear malware.exe para
       recibo.pdf e declarar "application/pdf" passava à vontade.

  Aqui os dois fecham-se de uma vez:

    - a extensão sai de um mapa do servidor, nunca do nome enviado;
    - os primeiros bytes do ficheiro gravado são comparados com a
      assinatura do formato declarado, e o pedido é recusado se não
      baterem certo.

  O ficheiro rejeitado não fica em disco: o middleware de limpeza de
  órfãos (middleware/limparUploadOrfao.middleware.js) apaga o que o multer
  gravou sempre que a resposta sai com erro.
*/

// Assinaturas ("magic numbers") dos formatos aceites. null = formato de
// texto sem assinatura fiável, ver nota no SVG mais abaixo.
const ASSINATURAS = {
  "application/pdf": [Buffer.from("%PDF", "ascii")],
  "image/jpeg": [Buffer.from([0xff, 0xd8, 0xff])],
  "image/jpg": [Buffer.from([0xff, 0xd8, 0xff])],
  "image/png": [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  "image/webp": [Buffer.from("RIFF", "ascii")],
  "image/svg+xml": null,
};

const DOCUMENTOS = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
};

const IMAGENS = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

function criarStorage(multer, diretorio, extensaoPorMime) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(diretorio)) {
        fs.mkdirSync(diretorio, { recursive: true });
      }
      cb(null, diretorio);
    },
    filename: (req, file, cb) => {
      const hash = crypto.randomBytes(16).toString("hex");
      // A extensão vem DAQUI, do mapa do servidor. Nunca de originalname.
      cb(null, `${hash}${extensaoPorMime[file.mimetype]}`);
    },
  });
}

function criarFileFilter(extensaoPorMime, mensagem) {
  return (req, file, cb) => {
    if (extensaoPorMime[file.mimetype]) {
      return cb(null, true);
    }
    cb(new Error(mensagem), false);
  };
}

/*
  Corre DEPOIS do multer, porque só depois de o ficheiro estar em disco é
  que há bytes para ler. Compara o início do ficheiro com a assinatura do
  tipo que o cliente declarou.

  Não substitui o fileFilter — completa-o. O filter decide se o tipo é
  aceitável; isto decide se o conteúdo é mesmo desse tipo.
*/
function validarAssinatura(req, res, next) {
  const ficheiro = req.file;

  if (!ficheiro?.path) return next();

  const assinaturas = ASSINATURAS[ficheiro.mimetype];

  // SVG é XML, texto puro: não tem assinatura fiável (pode abrir com
  // comentário, BOM, declaração XML...). Fica sem esta verificação de
  // propósito. A defesa do SVG é outra: é servido com
  // Content-Disposition: attachment, ver server.js.
  if (assinaturas === null || assinaturas === undefined) return next();

  let inicio;
  try {
    const descritor = fs.openSync(ficheiro.path, "r");
    inicio = Buffer.alloc(12);
    fs.readSync(descritor, inicio, 0, 12, 0);
    fs.closeSync(descritor);
  } catch (erro) {
    return res.status(400).json({ message: "Não foi possível ler o ficheiro enviado." });
  }

  const bate = assinaturas.some((assinatura) => inicio.subarray(0, assinatura.length).equals(assinatura));

  if (!bate) {
    return res.status(400).json({
      message:
        "O conteúdo do ficheiro não corresponde ao formato declarado. " +
        "Envia um PDF, JPG ou PNG verdadeiro.",
    });
  }

  next();
}

module.exports = {
  DOCUMENTOS,
  IMAGENS,
  criarStorage,
  criarFileFilter,
  validarAssinatura,
};
