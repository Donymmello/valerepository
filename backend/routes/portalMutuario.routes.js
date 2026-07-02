const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const authMiddleware = require("../middleware/auth.middleware");
const {
  getMeuMutuario,
  getMeusPedidos,
  getMeuPedidoById,
  createMeuPedido,
  anexarReqPedido,
  getMeuExtratoPedido,
  getMeuReqAnexos,
  getMeusCreditos,
  getMeuCreditoById,
  updateMeuMutuario,
} = require("../controllers/portalMutuario.controller");

/*
  ===========================================================
  ROTAS DO PORTAL DO MUTUÁRIO
  ===========================================================
*/

router.get(
  "/portal/meu-mutuario",
  authMiddleware,
  getMeuMutuario
);

router.put(
  "/portal/meu-mutuario",
  authMiddleware,
  updateMeuMutuario
);

router.get(
  "/portal/meus-pedidos",
  authMiddleware,
  getMeusPedidos
);

router.get(
  "/portal/meus-pedidos/:id",
  authMiddleware,
  getMeuPedidoById
);

router.post(
  "/portal/meus-pedidos",
  authMiddleware,
  createMeuPedido
);

router.post(
  "/portal/meus-pedidos/upload/:id/requisitos",
  authMiddleware,
  upload.single("arquivo"),
  anexarReqPedido
);

router.get(
  "/portal/meus-pedidos/:id/extrato",
  authMiddleware,
  getMeuExtratoPedido
);

router.get(
  "/portal/meus-creditos",
  authMiddleware,
  getMeusCreditos
);

router.get(
  "/portal/meus-creditos/:id",
  authMiddleware,
  getMeuCreditoById
);

module.exports = router;
