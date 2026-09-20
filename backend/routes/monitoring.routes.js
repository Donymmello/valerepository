/**
 * Monitoring Routes
 * Dashboard e métricas agregadas
 */

const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const { getMonitoringDashboard } = require('../controllers/monitoring.controller');

const router = express.Router();

/**
 * GET /api/monitoring/dashboard
 * Retorna dashboard com todas as métricas.
 *
 * Estava sem autenticação nenhuma: qualquer pessoa na internet obtinha o
 * inventário de endpoints exercitados, com os caminhos concretos (logo,
 * ids reais de pedidos/anexos de todas as empresas), taxas de erro e
 * memória/CPU do processo. SUPERADMIN porque as métricas são globais,
 * não têm dono por empresa.
 */
router.get(
  '/dashboard',
  authMiddleware,
  authorizeRoles('SUPERADMIN'),
  getMonitoringDashboard
);

module.exports = router;
