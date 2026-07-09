/**
 * Monitoring Dashboard Controller
 * Agregador de métricas: Performance, Health
 */

const logger = require('../utils/logger');
const { getMetricsStats } = require('../middleware/performanceMetrics.middleware');
const { sequelize } = require('../models');

/**
 * Dashboard completo de monitoramento
 */
async function getMonitoringDashboard(req, res) {
  try {
    const performanceMetrics = getMetricsStats();

    // Verificar DB connection
    let dbStatus = 'unknown';
    try {
      await sequelize.authenticate();
      dbStatus = 'healthy';
    } catch (err) {
      dbStatus = 'unhealthy';
    }

    const dashboard = {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      summary: {
        apiStatus: Object.keys(performanceMetrics).length > 0 ? 'UP' : 'NO_TRAFFIC',
        databaseStatus: dbStatus,
      },
      metrics: {
        performance: performanceMetrics,
      },
      system: {
        memory: process.memoryUsage(),
        uptime: `${Math.floor(process.uptime() / 60)}m`,
        cpuUsage: process.cpuUsage(),
      },
    };

    logger.info(`Monitoring dashboard requested`, {
      requestId: req.requestId,
      userId: req.user?.id,
    });

    return res.status(200).json(dashboard);
  } catch (error) {
    logger.error(`Error fetching monitoring dashboard`, {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Error fetching monitoring dashboard',
      requestId: req.requestId,
    });
  }
}

module.exports = {
  getMonitoringDashboard,
};
