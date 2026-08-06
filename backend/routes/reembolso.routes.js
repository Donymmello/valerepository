const express = require("express");
const router = express.Router();    

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  getAllReembolsos,
  getReembolsoByCredito,
  obterReembolso,
} = require("../controllers/reembolso.controller"); 

router.get(
    "/credito/:creditoId",
    authMiddleware,
    authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
    getReembolsoByCredito,
);

router.get(
    "/",
    authMiddleware,
    authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
    getAllReembolsos
);

router.get(
    "/:reembolsoId",
     authMiddleware,
     authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
     obterReembolso
);

module.exports = router;
