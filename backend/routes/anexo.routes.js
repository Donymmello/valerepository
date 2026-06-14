const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const authMiddleware = require("../middleware/auth.middleware");

const {
  listar,
  anexar,
  download,
} = require("../controllers/anexo.controller");

router.post(
  "/anexar/:id",
  authMiddleware,
  upload.single("arquivo"),
  anexar
);

router.get(
  "/requisito/:id",
  authMiddleware,
  listar
);

router.get(
  "/:id/download",
  authMiddleware,
  download
);

module.exports = router;