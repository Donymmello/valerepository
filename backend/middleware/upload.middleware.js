const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, "upload/anexos");
    },

    filename(req, file,cb) {
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

    if (permitidos,includes(file.mimetype)) {
        return cb(null, true);
    }

    cb(new Error("Tipo de ficheiro não suportado"));
};

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});