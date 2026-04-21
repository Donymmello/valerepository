const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const {
  associarUserMutuario,
  removerAssociacaoUserMutuario,
  getAssociacaoMutuario,
  getUsersNaoAssociados,
} = require("../controllers/vincularMutuario.controller");

/*
  ===========================================================
  ROTAS DE VÍNCULO USER <-> MUTUÁRIO
  ===========================================================
*/

router.get(
  "/mutuarios/users-disponiveis",
  authMiddleware,
  getUsersNaoAssociados
);

router.post(
  "/mutuarios/associar-user",
  authMiddleware,
  associarUserMutuario
);

router.delete(
  "/mutuarios/:mutuarioId/remover-user",
  authMiddleware,
  removerAssociacaoUserMutuario
);

router.get(
  "/mutuarios/:mutuarioId/associacao",
  authMiddleware,
  getAssociacaoMutuario
);

module.exports = router;