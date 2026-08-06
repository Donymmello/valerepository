const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const uploadComprovativo = require("../middleware/uploadComprovativo.middleware");
const controller = require("../controllers/comprovativo.controller");

router.post("/portal/credito/:creditoId/parcela/:parcelaId/enviar", authMiddleware, uploadComprovativo.single("comprovativo"), controller.enviarComprovativo);
router.get("/portal/credito/:creditoId", authMiddleware, controller.getMeusComprovativos);

router.get("/", authMiddleware, authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"), controller.getComprovativos);
router.get("/credito/:creditoId", authMiddleware, authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"), controller.getComprovativos);
router.get("/:id/download", authMiddleware, controller.downloadComprovativo);
router.get("/:id", authMiddleware, authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"), controller.obterComprovativo);
router.patch("/:id/validar", authMiddleware, authorizeRoles("ADMIN", "GESTOR"), controller.validarComprovativo);

module.exports = router;
