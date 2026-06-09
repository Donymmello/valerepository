const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  exportarMeusPedidos,
  exportarMeuExtratoPedido,
} = require("../controllers/portalExport.controller");

router.get(
  "/meus-pedidos",
  authMiddleware,
  authorizeRoles("USER", "MUTUARIO"),
  exportarMeusPedidos
);

router.get(
  "/meu-extrato/:pedidoId",
  authMiddleware,
  authorizeRoles("USER", "MUTUARIO"),
  exportarMeuExtratoPedido
);

module.exports = router;