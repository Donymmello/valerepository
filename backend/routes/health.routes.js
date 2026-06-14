const express = require('express');
const router = express.Router();
const { healthCheck, ping } = require('../controllers/health.controller');
const requestIdMiddleware = require('../middleware/requestId.middleware');

/**
 * Rotas de Health Check
 * GET  /api/health/ping  - Verificação rápida (sem DB)
 * POST /api/health       - Health check completo com DB
 */

router.get('/ping', requestIdMiddleware, ping);

router.post('/', requestIdMiddleware, healthCheck);

module.exports = router;
