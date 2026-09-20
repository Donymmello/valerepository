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

/*
  Leituras com a mesma guarda de perfil dos writes abaixo: sem isto, um
  mutuario do portal (role USER, criado por convite) recebia a lista
  completa de mutuarios da empresa, com documentoNumero, nuit, morada e
  saldo em divida de toda a gente. O portal tem /portal/meu-mutuario
  para o mutuario ver o seu proprio registo.
*/
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getAllMutuarios
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getMutuarioById
);

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