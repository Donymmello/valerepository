const multer = require("multer");

const { DOCUMENTOS, criarStorage, criarFileFilter } = require("../utils/uploadSeguro");

/*
  Upload de anexos de requisitos (documentos de KYC do mutuário).

  Tinha o mesmo par de defeitos do upload de comprovativos — extensão
  tirada do nome enviado pelo cliente e tipo validado só pelo cabeçalho
  multipart. Ambos fechados em utils/uploadSeguro.js.

  Tal como nos comprovativos, a rota tem de encadear validarAssinatura a
  seguir a este middleware.
*/

const UPLOAD_DIR = "upload/anexos";

module.exports = multer({
  storage: criarStorage(multer, UPLOAD_DIR, DOCUMENTOS),
  fileFilter: criarFileFilter(DOCUMENTOS, "Tipo de ficheiro não suportado. Use PDF, JPG ou PNG."),
  limits: { fileSize: 10 * 1024 * 1024 },
});
