const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const uploadComprovativo = require("../middleware/uploadComprovativo.middleware");

const {
  enviarComprovativo,
  getComprovativos,
  getMeusComprovativos,
  downloadComprovativo,
  validarComprovativo,
} = require("../controllers/comprovativo.controller");

/*
  ==========================================================
  ROTAS DO PORTAL (MUTUÁRIO)
  ==========================================================
*/

// Enviar comprovativo de pagamento
router.post(
  "/portal/pedido/:pedidoId/enviar",
  authMiddleware,
  uploadComprovativo.single("comprovativo"),
  enviarComprovativo
);

// Listar comprovativos do meu pedido
router.get(
  "/portal/pedido/:pedidoId",
  authMiddleware,
  getMeusComprovativos
);

/*
  ==========================================================
  ROTAS DO BACKOFFICE
  ==========================================================
*/

// Listar comprovativos de um pedido (backoffice)
router.get(
  "/pedido/:pedidoId",
  authMiddleware,
  getComprovativos
);

// Download de um comprovativo
router.get(
  "/:id/download",
  authMiddleware,
  downloadComprovativo
);

// Validar/rejeitar comprovativo e registar reembolso
router.patch(
  "/:id/validar",
  authMiddleware,
  validarComprovativo
);

module.exports = router;