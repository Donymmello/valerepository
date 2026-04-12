const express = require('express');
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
    createRequisito,
    getAllRequisitos,
    updateRequisito,
} = require("../controllers/requisitoCredito.controller");

router.post(
    "/",
    authMiddleware,
    authorizeRoles("ADMIN", "GESTOR"),
    createRequisito
);

router.get(
    "/",
    authMiddleware,
    authorizeRoles("ADMIN", "GESTOR", "ANALISTA", "DIRETOR"),
    getAllRequisitos
);

router.put(
    "/:id",
    authMiddleware,
    authorizeRoles("ADMIN", "GESTOR"),
    updateRequisito
);

module.exports = router;
