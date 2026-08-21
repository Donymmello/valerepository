const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  exportarMeusPedidos,
  exportarMeuExtratoPedido,
  exportarMeuExtratoPedidoPdf,
  exportarComprovativoDesembolsoPdf,
  exportarComprovativoReembolsoPdf,
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

router.get(
  "/meu-extrato/:pedidoId/pdf",
  authMiddleware,
  authorizeRoles("USER", "MUTUARIO"),
  exportarMeuExtratoPedidoPdf
);

router.get(
  "/comprovativo/desembolso/:desembolsoId",
  authMiddleware,
  authorizeRoles("USER", "MUTUARIO"),
  exportarComprovativoDesembolsoPdf
);

router.get(
  "/comprovativo/reembolso/:reembolsoId",
  authMiddleware,
  authorizeRoles("USER", "MUTUARIO"),
  exportarComprovativoReembolsoPdf
);

module.exports = router;