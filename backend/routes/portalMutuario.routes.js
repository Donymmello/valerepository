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
  getMeusRequisitos,
  getMeuExtratoPedido,
  getMeuReqAnexos,
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

module.exports = router;