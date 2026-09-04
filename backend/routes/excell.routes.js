const express = require("express");
const router = express.Router();
const multer = require("multer");

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

/*
  Configuração do multer em memória
  O ficheiro não será gravado em disco
*/
const upload = multer({
  storage: multer.memoryStorage(),
});

const {
    exportarMutuarios,
    exportarPedidos,
    exportarDesembolsos,
    exportarReembolsos,
    exportarRelatorioFinanceiro,
    importarMutuarios,
    importarPedidos,
    importarCreditos,

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

/*
*Export de desembolsos e reembolsos
*/
router.get(
  "/export/desembolsos",
  authMiddleware,
  exportarDesembolsos
);

router.get(
  "/export/reembolsos",
  authMiddleware,
  exportarReembolsos
);

/*

*/
router.get(
  "/export/relatorio-financeiro",
  authMiddleware,
  exportarRelatorioFinanceiro
)

/**
 * IMPORTAÇÃO DE MUTUÁRIOS
 * Esta rota deverá receber um ficheiro Excel no futuro.
 * Como importar dados é mais sensível, limitamos a admin/gestor.
 */
router.post(
  "/import/mutuarios",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR"),
  upload.single("file"),
  importarMutuarios
);

router.post(
  "/import/pedidos",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR"),
  upload.single("file"),
  importarPedidos
);

/**
 * IMPORTAÇÃO DE CRÉDITOS EXISTENTES ("saldo de abertura")
 * Cria diretamente o crédito (pedido-invólucro + desembolso + crédito),
 * não passa pelo fluxo normal de aprovação, só ADMIN/GESTOR, mesmo
 * critério dos outros dois importadores.
 */
router.post(
  "/import/creditos",
  authMiddleware,
  authorizeRoles("ADMIN", "GESTOR"),
  upload.single("file"),
  importarCreditos
);

module.exports = router;