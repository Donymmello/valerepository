const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createNotificacao,
  getMinhasNotificacoes,
  getNotificacaoById,
  marcarComoLida,
  marcarTodasComoLidas,
  deleteNotificacao,
} = require("../controllers/notificacao.controller");

/*
  ==========================================================
  ROTAS DE NOTIFICAÇÃO
  ==========================================================
*/

// Criar notificação
router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  createNotificacao
);

// Listar notificações do utilizador autenticado
router.get("/minhas", authMiddleware, getMinhasNotificacoes);

// Buscar uma notificação específica
router.get("/:id", authMiddleware, getNotificacaoById);

// Marcar uma como lida
router.patch("/:id/lida", authMiddleware, marcarComoLida);

// Marcar todas como lidas
router.patch("/marcar-todas/lidas", authMiddleware, marcarTodasComoLidas);

// Apagar uma notificação
router.delete("/:id", authMiddleware, deleteNotificacao);

module.exports = router;