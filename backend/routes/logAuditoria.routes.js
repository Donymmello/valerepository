const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  getAllLogsAuditoria,
  getLogAuditoriaById,
  getMeusLogsAuditoria,
} = require("../controllers/logAuditoria.controller");

/*
  ==========================================================
  ROTAS DE LOGS DE AUDITORIA
  ==========================================================
*/

// Ver todos os logs
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR"),
  getAllLogsAuditoria
);

// Ver meus logs
router.get(
  "/meus",
  authMiddleware,
  getMeusLogsAuditoria
);

// Ver log específico
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR"),
  getLogAuditoriaById
);

module.exports = router;