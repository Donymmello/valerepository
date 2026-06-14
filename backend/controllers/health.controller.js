/**
 * Health Check Endpoint com Status Detalhado
 * POST /api/health - Status completo do sistema
 */

const { sequelize } = require('../models');
const logger = require('../utils/logger');
const os = require('os');

/**
 * Verifica conexão com banco de dados
 */
async function checkDatabase() {
  try {
    await sequelize.authenticate();
    return {
      status: 'healthy',
      responseTime: 'OK',
      database: 'MySQL',
      connection: 'Active',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      database: 'MySQL',
      connection: 'Failed',
    };
  }
}

/**
 * Verifica saúde do sistema (memória, CPU, uptime)
 */
function checkSystemHealth() {
  const memUsage = process.memoryUsage();
  const cpus = os.cpus();
  const uptime = Math.floor(process.uptime() / 60); // minutos

  return {
    uptime: `${uptime}m`,
    memory: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    },
    cpu: {
      cores: cpus.length,
      model: cpus[0].model,
    },
    environment: {
      nodeVersion: process.version,
      nodeEnv: process.env.NODE_ENV || 'development',
      pid: process.pid,
    },
  };
}

/**
 * Endpoint de health check
 */
async function healthCheck(req, res) {
  try {
    const dbHealth = await checkDatabase();
    const systemHealth = checkSystemHealth();

    const overallStatus = dbHealth.status === 'healthy' ? 'UP' : 'DOWN';

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      services: {
        database: dbHealth,
        system: systemHealth,
      },
    };

    logger.info(`Health check performed`, {
      requestId: req.requestId,
      status: overallStatus,
    });

    return res.status(200).json(response);
  } catch (error) {
    logger.error(`Health check failed`, {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
    });

    return res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      error: error.message,
    });
  }
}

/**
 * Endpoint leve de ping (sem checar banco)
 */
function ping(req, res) {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
}

module.exports = {
  healthCheck,
  ping,
};
