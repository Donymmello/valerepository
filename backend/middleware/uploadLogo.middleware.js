const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");

/*
  ==========================================================
  MIDDLEWARE DE UPLOAD DE LOGO DA EMPRESA
  ==========================================================
  Pasta própria (upload/logos), separada de comprovativos/anexos
  porque o logo é servido publicamente (ver server.js: /uploads/logos),
  ao contrário dos outros dois que só saem por download autenticado.
  Nunca apontar o express.static para a pasta "upload" inteira, só
  para esta subpasta, senão comprovativos e anexos ficam expostos.
*/

const UPLOAD_DIR = "upload/logos";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/*
  A extensão do ficheiro gravado sai DESTE mapa, nunca do nome que o
  cliente enviou. Antes era path.extname(file.originalname), e o
  fileFilter só olhava para file.mimetype, que é o cabeçalho que o
  próprio cliente escreve no multipart. Dava para enviar
  filename="x.html" com Content-Type: image/png: o ficheiro ficava
  gravado como .html na pasta pública e o express.static servia-o como
  text/html na mesma origem do frontend, ou seja XSS armazenado com
  acesso ao token que está no localStorage. Com o mapa, o pior que
  acontece é um .png com lixo lá dentro.
*/
const EXTENSAO_POR_MIME = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString("hex");
    cb(null, `${hash}${EXTENSAO_POR_MIME[file.mimetype]}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (EXTENSAO_POR_MIME[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error("Formato não permitido. Use PNG, JPG, WEBP ou SVG."), false);
  }
};

const uploadLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB, é só um logo
});

module.exports = uploadLogo;
