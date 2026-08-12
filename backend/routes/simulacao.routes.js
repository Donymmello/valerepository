const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const optionalAuthMiddleware = require("../middleware/optionalAuth.middleware");
const { publicLimiter } = require("../middleware/rateLimit.middleware");

const {
  simular,
  calcular,
  listarMinhasSimulacoes,
  reclamarSimulacao,
} = require("../controllers/simulacao.controller");

/*
  Pública (visitante ou autenticado).
  Se vier token válido, a simulação já fica associada ao user.
*/
router.post("/simular", publicLimiter, optionalAuthMiddleware, simular);

router.post("/calcular", publicLimiter, calcular);

/*
  Protegida: histórico de simulações do user autenticado.
*/
router.get("/minhas", authMiddleware, listarMinhasSimulacoes);

/*
  Protegida: associa uma simulação anónima ao user que acabou
  de se registar/logar. Chamado pelo frontend logo após o
  registo, passando o id da simulação feita antes do login.
*/
router.patch("/:id/reclamar", authMiddleware, reclamarSimulacao);

module.exports = router;