const multer = require("multer");
const path = require("path");
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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${hash}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];

  if (allowed.includes(file.mimetype)) {
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
