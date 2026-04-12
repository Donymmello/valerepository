const express = require('express');
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const { verificarAlertasPrazo
} = require("../controllers/alertaPrazo.controller");

/*
  ==========================================================
  ROTAS DE ALERTA DE PRAZO
  ==========================================================
*/

router.post(
    "/verificar",
    authMiddleware,
    authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
    verificarAlertasPrazo
);  

module.exports = router;