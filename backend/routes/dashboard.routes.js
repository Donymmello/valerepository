const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboard.controller");
const authMiddleware = require("../middleware/authMiddleware");

// Rota para obter estatísticas do dashboard (Apenas ADMIN)
router.get("/stats", authMiddleware, getDashboardStats);

module.exports = router;
