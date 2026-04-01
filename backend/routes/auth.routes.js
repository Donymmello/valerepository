const express = require("express");
const router = express.Router();

// Importa as funções do controller de autenticação
const {
  register,
  login,
  getMe,
} = require("../controllers/auth.controller");

// Importa o middleware de autenticação
const authMiddleware = require("../middleware/auth.middleware");



/*
  ==========================================================
  ROTAS DE AUTENTICAÇÃO
  ==========================================================
  POST /api/auth/register -> cria utilizador
  POST /api/auth/login    -> faz login
  GET  /api/auth/me       -> retorna utilizador autenticado
*/

// Registar novo utilizador
router.post("/register", register);

// Fazer login
router.post("/login", login);

// Buscar dados do utilizador autenticado
router.get("/me", authMiddleware, getMe);

module.exports = router;