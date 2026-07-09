const express = require('express');
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  dashboardFinanceiro,
  getResumoGeral,
  getRelatorioPedidos,
  getRelatorioFinanceiroPedidos,
  getRelatorioDesembolsos,
  getRelatorioReembolsos,
} = require("../controllers/relatorio.controller");

/*
  ==========================================================
  ROTAS DE RELATÓRIOS
  ==========================================================
*/  

router.get(
  "/dashboard",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  dashboardFinanceiro
);

router.get(
  "/resumo-geral",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getResumoGeral
);

router.get(
  "/pedidos",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getRelatorioPedidos
);

router.get(
  "/financeiro-pedidos",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getRelatorioFinanceiroPedidos
);

router.get(
  "/desembolsos",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getRelatorioDesembolsos
);

router.get(
  "/reembolsos",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getRelatorioReembolsos
);

module.exports = router;
