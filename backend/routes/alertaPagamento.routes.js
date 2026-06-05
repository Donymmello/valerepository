const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  verificarAlertasPagamento,
} = require("../controllers/alertaPagamento.controller");

router.post(
  "/verificar",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
  verificarAlertasPagamento
);

module.exports = router;