const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createMutuario,
  getAllMutuarios,
  getMutuarioById,
  updateMutuario,
  deleteMutuario,
} = require("../controllers/mutuario.controller");

/*
  ==========================================================
  ROTAS DE MUTUÁRIO
  ==========================================================
*/

// Criar mutuário
router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA"),
  createMutuario
);

// Listar todos
router.get("/", authMiddleware, getAllMutuarios);

// Buscar por id
router.get("/:id", authMiddleware, getMutuarioById);

// Atualizar
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA"),
  updateMutuario
);

// Remover
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR"),
  deleteMutuario
);

module.exports = router;