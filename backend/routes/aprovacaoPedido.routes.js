const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  getAprovacoesByPedido,
  decidirAprovacao,
  getMinhasAprovacoes,
  getAllAprovacoes,
} = require("../controllers/aprovacaoPedido.controller");

/*
  ==========================================================
  ROTAS DE APROVAÇÃO DE PEDIDOS
  ==========================================================
*/

// Histórico das aprovações de um pedido
router.get(
  "/pedido/:pedidoId",
  authMiddleware,
  getAprovacoesByPedido
);

// Aprovar ou rejeitar pedido
router.post(
  "/pedido/:pedidoId/decidir",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  decidirAprovacao
);

// Ver aprovações feitas pelo utilizador autenticado
router.get(
  "/minhas",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getMinhasAprovacoes
);

// Rota para obter todas as aprovações (para fins administrativos)
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN"),
  getAllAprovacoes
);

module.exports = router;