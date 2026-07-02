const multer = require("multer");
const path = require("path");
const fs = require("fs");

/*
  ==========================================================
  MIDDLEWARE DE UPLOAD DE COMPROVATIVOS
  ==========================================================
  Pasta separada de uploads/anexos para melhor organização.
  Reutiliza a mesma lógica do upload.middleware existente.
*/

const UPLOAD_DIR = "upload/comprovativos";

// Garante que a pasta existe ao arrancar
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const crypto = require("crypto");
    const hash = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${hash}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato não permitido. Use PDF, JPG ou PNG."), false);
  }
};

const uploadComprovativo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = uploadComprovativo;