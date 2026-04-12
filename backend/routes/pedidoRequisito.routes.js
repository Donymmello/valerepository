const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  adicionarPedidoRequisito,
  getRequisitosByPedido,
  validarRequisitoPedido,
} = require("../controllers/pedidoRequisito.controller");

router.post(
  "/pedido/:pedidoId",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA"),
  adicionarPedidoRequisito
);

router.get(
  "/pedido/:pedidoId",
  authMiddleware,
  getRequisitosByPedido
);

router.patch(
  "/:id/validar",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA"),
  validarRequisitoPedido
);

module.exports = router;