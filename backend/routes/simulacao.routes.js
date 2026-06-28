const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const optionalAuthMiddleware = require("../middleware/optionalAuth.middleware");

const {
  simular,
  listarMinhasSimulacoes,
  reclamarSimulacao,
} = require("../controllers/simulacao.controller");

/*
  Pública (visitante ou autenticado).
  Se vier token válido, a simulação já fica associada ao user.
*/
router.post("/simular", optionalAuthMiddleware, simular);

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