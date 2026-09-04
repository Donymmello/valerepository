const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  listarEmpresas,
  obterEmpresa,
  atualizarEmpresaSuperadmin,
} = require("../controllers/superadmin.controller");

/*
  ==========================================================
  ROTAS SUPERADMIN, GESTÃO DE EMPRESAS (TENANTS)
  ==========================================================
  GET   /api/superadmin/empresas      -> listar todas as empresas
  GET   /api/superadmin/empresas/:id  -> detalhe de uma empresa
  PATCH /api/superadmin/empresas/:id  -> mudar plano/estado
*/

router.get("/empresas", authMiddleware, authorizeRoles("SUPERADMIN"), listarEmpresas);
router.get("/empresas/:id", authMiddleware, authorizeRoles("SUPERADMIN"), obterEmpresa);
router.patch("/empresas/:id", authMiddleware, authorizeRoles("SUPERADMIN"), atualizarEmpresaSuperadmin);

module.exports = router;
