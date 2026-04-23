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

// Criar pedido de crédito
router.post("/", authMiddleware, createPedidoCredito);

// Listar todos os pedidos
router.get("/", authMiddleware, getAllPedidosCredito);

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

// Listar pedidos de um mutuário
router.get("/mutuario/:mutuarioId", authMiddleware, getPedidosByMutuario);

// Buscar pedido por ID
router.get("/:id", authMiddleware, getPedidoCreditoById);

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