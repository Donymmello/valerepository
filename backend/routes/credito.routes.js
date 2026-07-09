const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  buscarCreditosElegiveisReembolso,
  buscarCreditoComReembolsos,
  getAllCreditos,
} = require("../services/credito.service");

router.get(
    "/elegiveis-reembolso",
     authMiddleware,
     authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
     buscarCreditosElegiveisReembolso
);

router.get(
  "/:creditoId",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  buscarCreditoComReembolsos
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  getAllCreditos
);

module.exports = router;