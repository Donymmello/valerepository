const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const authMiddleware = require("../middleware/auth.middleware");

const anexoController = require(
  "../controllers/anexo.controller"
);

router.post(
  "/upload/:id",
  authMiddleware,
  upload.single("arquivo"),
  anexoController.upload
);

router.get(
  "/requisito/:id",
  authMiddleware,
  anexoController.listar
);

router.get(
  "/:id/download",
  authMiddleware,
  anexoController.download
);

module.exports = router;