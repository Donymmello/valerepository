const express = require("express");
const router = express.Router();

// Importa as funções do controller de autenticação
const {
  bootstrapAdmin,
  registerInterno,
  criarConvitePortal,
  registerMutuario,
  registerMutuarioRequestOTP,
  verifyOTPAndRegister,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

// Importa o middleware de autenticação
const authMiddleware = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");

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
router.post("/bootstrap-admin", authLimiter, bootstrapAdmin);

// Registo público do mutuário autónomo
router.post("/register-mutuario", authLimiter, registerMutuario);

// Registo com OTP - Etapa 1: Solicitar OTP
router.post("/register-mutuario-otp", authLimiter, registerMutuarioRequestOTP);

// Registo com OTP - Etapa 2: Verificar OTP e completar
router.post("/verify-otp", authLimiter, verifyOTPAndRegister);

// Registo interno de utilizadores administrativos
router.post("/register-interno", authMiddleware, registerInterno);

// Criar convite de registo de portal (controlo de KYC; ADMIN/GESTOR)
router.post("/convite-portal", authMiddleware, criarConvitePortal);

// Fazer login
router.post("/login", authLimiter, login);

// Buscar dados do utilizador autenticado
router.get("/me", authMiddleware, getMe);

router.post("/forgot-password", authLimiter, forgotPassword);

router.post("/reset-password", authLimiter, resetPassword);

module.exports = router;