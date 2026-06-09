const express = require("express");
const router = express.Router();

// Importa as funções do controller de autenticação
const {
  bootstrapAdmin,
  registerInterno,
  registerMutuario,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

// Importa o middleware de autenticação
const authMiddleware = require("../middleware/auth.middleware");

/*
  ==========================================================
  ROTAS DE AUTENTICAÇÃO
  ==========================================================
  POST /api/auth/register-mutuario -> registo público do mutuário
  POST /api/auth/register-interno  -> registo interno (apenas admin)
  POST /api/auth/login             -> faz login
  GET  /api/auth/me                -> retorna utilizador autenticado
*/

// Rota para criar um admin inicial (apenas para desenvolvimento)
router.post("/bootstrap-admin", bootstrapAdmin);

// Registo público do mutuário autónomo
router.post("/register-mutuario", registerMutuario);

// Registo interno de utilizadores administrativos
router.post("/register-interno", authMiddleware, registerInterno);

// Fazer login
router.post("/login", login);

// Buscar dados do utilizador autenticado
router.get("/me", authMiddleware, getMe);

router.post("/forgot-password", authMiddleware, forgotPassword);

router.post("/reset-password", authMiddleware, resetPassword);

module.exports = router;