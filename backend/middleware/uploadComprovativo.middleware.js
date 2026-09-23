const multer = require("multer");

const { DOCUMENTOS, criarStorage, criarFileFilter } = require("../utils/uploadSeguro");

/*
  ==========================================================
  MIDDLEWARE DE UPLOAD DE COMPROVATIVOS
  ==========================================================
  Pasta separada de upload/anexos, e nunca servida por express.static: os
  comprovativos só saem por download autenticado (ver
  controllers/comprovativo.controller.js).

  A validação de tipo está em utils/uploadSeguro.js, partilhada com os
  outros uploads. As rotas que usam isto têm de encadear também o
  validarAssinatura, que confirma os bytes depois da gravação.
*/

const UPLOAD_DIR = "upload/comprovativos";

const uploadComprovativo = multer({
  storage: criarStorage(multer, UPLOAD_DIR, DOCUMENTOS),
  fileFilter: criarFileFilter(DOCUMENTOS, "Formato não permitido. Use PDF, JPG ou PNG."),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = uploadComprovativo;
