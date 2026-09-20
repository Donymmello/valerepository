const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createDesembolso,
  getDesembolsoByPedido,
  getAllDesembolsos,
  obterComprovativoDesembolsoPdf,
} = require("../controllers/desembolso.controller");

router.post(
    "/",
    authMiddleware,
    authorizeRoles("ADMIN", "GESTOR", "DIRETOR"),
    createDesembolso
);

/*
  Leituras restritas ao backoffice: o controller so filtra por empresaId
  (ver o comentario em desembolso.controller.js, que assumia que so staff
  chegava aqui). GET / devolvia a lista completa de desembolsos da
  empresa a qualquer utilizador autenticado, o que dava logo os ids para
  ir buscar o comprovativo e o extrato de outros clientes.
*/
router.get(
    "/pedido/:pedidoId",
    authMiddleware,
    authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
    getDesembolsoByPedido
);

router.get(
    "/",
    authMiddleware,
    authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
    getAllDesembolsos
);

router.get(
    "/:desembolsoId/comprovativo",
    authMiddleware,
    authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
    obterComprovativoDesembolsoPdf
);

module.exports = router;