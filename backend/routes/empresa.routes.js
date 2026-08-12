const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  getMinhaEmpresa,
  atualizarMinhaEmpresa,
  listarUtilizadoresEmpresa,
  atualizarEstadoUtilizador,
} = require("../controllers/empresa.controller");

/*
  ==========================================================
  ROTAS DE EMPRESA (TENANT)
  ==========================================================
  GET   /api/empresas/me                -> perfil da própria empresa
  PUT   /api/empresas/me                -> atualizar perfil (ADMIN)
  GET   /api/empresas/users             -> listar utilizadores internos (ADMIN/GESTOR)
  PATCH /api/empresas/users/:id/ativo   -> ativar/desativar utilizador interno (ADMIN)
*/

router.get(
  "/me",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getMinhaEmpresa
);

router.put(
  "/me",
  authMiddleware,
  authorizeRoles("ADMIN"),
  atualizarMinhaEmpresa
);

router.get(
  "/users",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR"),
  listarUtilizadoresEmpresa
);

router.patch(
  "/users/:id/ativo",
  authMiddleware,
  authorizeRoles("ADMIN"),
  atualizarEstadoUtilizador
);

module.exports = router;
