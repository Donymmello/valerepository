const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createDesembolso,
  getDesembolsoByPedido,
  getAllDesembolsos,
} = require("../controllers/desembolso.controller");

router.post(
    "/",
    authMiddleware,
    authorizeRoles("ADMIN", "GESTOR", "DIRETOR"),
    createDesembolso
);

router.get(
    "/pedido/:pedidoId",
    authMiddleware,
    getDesembolsoByPedido
);

router.get(
    "/",
    authMiddleware,
    getAllDesembolsos
);  

module.exports = router;