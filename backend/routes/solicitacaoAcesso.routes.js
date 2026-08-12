const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const { publicLimiter } = require("../middleware/rateLimit.middleware");

const {
  criarSolicitacaoAcesso,
  listarSolicitacoesAcesso,
  atualizarSolicitacaoAcesso,
} = require("../controllers/solicitacaoAcesso.controller");

/*
  ==========================================================
  ROTAS DE SOLICITAÇÃO DE ACESSO (LEADS DE EMPRESA)
  ==========================================================
  POST  /api/solicitacoes-acesso      -> pública, formulário da landing page
  GET   /api/solicitacoes-acesso      -> SUPERADMIN, listar
  PATCH /api/solicitacoes-acesso/:id  -> SUPERADMIN, mudar estado
*/

router.post("/", publicLimiter, criarSolicitacaoAcesso);

router.get("/", authMiddleware, authorizeRoles("SUPERADMIN"), listarSolicitacoesAcesso);
router.patch("/:id", authMiddleware, authorizeRoles("SUPERADMIN"), atualizarSolicitacaoAcesso);

module.exports = router;
