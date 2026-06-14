const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs"); // 1. IMPORTANTE: Importar o módulo de sistema de arquivos

const storage = multer.diskStorage({
    destination(req, file, cb) {
        const dir = "upload/anexos";

        // 2. CORREÇÃO: Se a pasta não existir, o Node cria ela automaticamente
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        cb(null, dir);
    },

    filename(req, file, cb) {
        const nome =
          crypto.randomBytes(16).toString("hex") +
          path.extname(file.originalname);

        cb(null, nome);
    },
});

const fileFilter = (req, file, cb) => {
    const permitidos = [
        "application/pdf",
        "image/jpg",
        "image/png",
    ];

    if (permitidos.includes(file.mimetype)) {
        return cb(null, true);
    }

    cb(new Error("Tipo de ficheiro não suportado"));
};

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // Limite de 10MB
    },
});