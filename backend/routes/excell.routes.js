const express = require("express");
const router =express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
    exportarMutuarios,
    exportarPedidos,
    importarMutuarios,

} = require("../controllers/excell.controller");

router.get(
  "/export/mutuarios",
  authMiddleware,
  exportarMutuarios
);

/**
 * EXPORTAÇÃO DE PEDIDOS
 * Deixamos já preparada a rota, mesmo que a implementação venha depois.
 */
router.get(
  "/export/pedidos",
  authMiddleware,
  exportarPedidos
);

/**
 * IMPORTAÇÃO DE MUTUÁRIOS
 * Esta rota deverá receber um ficheiro Excel no futuro.
 * Como importar dados é mais sensível, limitamos a admin/gestor.
 */
router.post(
  "/import/mutuarios",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR"),
  importarMutuarios
);

module.exports = router;