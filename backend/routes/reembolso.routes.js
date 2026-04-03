const express = require("express");
const router = express.Router();    

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createReembolso,
  getReembolsoByPedido,
  getAllReembolsos,
} = require("../controllers/reembolso.controller"); 

router.post(
    "/",
    authMiddleware,
    authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
    createReembolso
);

router.get(
    "/pedido/:pedidoId",
    authMiddleware,
    getReembolsoByPedido
);

router.get(
    "/",
    authMiddleware,
    getAllReembolsos
);

module.exports = router;