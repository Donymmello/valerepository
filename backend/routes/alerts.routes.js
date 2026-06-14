/**
 * Alerts Routes
 * Gestão de alertas e configuração de thresholds
 */

const express = require('express');
const {
  getActiveAlerts,
  getAlertHistory,
  getAlertStats,
  acknowledgeAlert,
  setThreshold,
  getThresholds,
} = require('../controllers/alerts.controller');

const router = express.Router();

/**
 * GET /api/alerts/active
 * Retorna alertas ativos (não reconhecidos)
 */
router.get('/active', getActiveAlerts);

/**
 * GET /api/alerts/history
 * Retorna histórico de alertas
 */
router.get('/history', getAlertHistory);

/**
 * GET /api/alerts/stats
 * Retorna estatísticas de alertas
 */
router.get('/stats', getAlertStats);

/**
 * GET /api/alerts/thresholds
 * Retorna configuração de thresholds
 */
router.get('/thresholds', getThresholds);

/**
 * POST /api/alerts/acknowledge/:alertId
 * Reconhece um alerta
 */
router.post('/acknowledge/:alertId', acknowledgeAlert);

/**
 * POST /api/alerts/thresholds/set
 * Configura um threshold
 */
router.post('/thresholds/set', setThreshold);

module.exports = router;
