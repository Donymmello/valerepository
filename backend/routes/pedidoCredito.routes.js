const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createPedidoCredito,
  getAllPedidosCredito,
  getPedidosElegiveisDesembolso,
  getPedidosElegiveisReembolso,
  getPedidoCreditoById,
  getPedidosByMutuario,
  updatePedidoCredito,
  updateStatusPedidoCredito,
  deletePedidoCredito,
} = require("../controllers/pedidoCredito.controller");

/*
  ==========================================================
  ROTAS DE PEDIDO DE CRÉDITO
  ==========================================================
*/

// Criar pedido de crédito (apenas backoffice; mutuário usa /portal/meus-pedidos)
router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA"),
  createPedidoCredito
);

// Listar todos os pedidos (apenas backoffice; mutuário usa /portal/meus-pedidos)
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getAllPedidosCredito
);

// Listar pedidos elegíveis para desembolso
router.get(
  "/elegiveis-desembolso",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "DIRETOR"),
  getPedidosElegiveisDesembolso
);

// Listar pedidos elegíveis para reembolso
router.get(
  "/elegiveis-reembolso",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "DIRETOR"),
  getPedidosElegiveisReembolso
);

// Listar pedidos de um mutuário (apenas backoffice)
router.get(
  "/mutuario/:mutuarioId",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getPedidosByMutuario
);

// Buscar pedido por ID (apenas backoffice; mutuário usa /portal/meus-pedidos/:id)
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getPedidoCreditoById
);

// Atualizar dados do pedido
router.put("/:id", authMiddleware, updatePedidoCredito);

// Atualizar apenas o status
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  updateStatusPedidoCredito
);

// Remover pedido
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR"),
  deletePedidoCredito
);

module.exports = router;