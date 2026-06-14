/**
 * Monitoring Routes
 * Dashboard e métricas agregadas
 */

const express = require('express');
const { getMonitoringDashboard } = require('../controllers/monitoring.controller');

const router = express.Router();

/**
 * GET /api/monitoring/dashboard
 * Retorna dashboard com todas as métricas
 */
router.get('/dashboard', getMonitoringDashboard);

module.exports = router;
