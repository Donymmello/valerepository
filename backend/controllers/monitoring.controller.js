/**
 * Monitoring Dashboard Controller
 * Agregador de métricas: Performance, Cache, Health
 */

const logger = require('../utils/logger');
const { getMetricsStats } = require('../middleware/performanceMetrics.middleware');
const cacheManager = require('../utils/cacheManager');
const { sequelize } = require('../models');

/**
 * Dashboard completo de monitoramento
 */
async function getMonitoringDashboard(req, res) {
  try {
    const performanceMetrics = getMetricsStats();
    const cacheMetrics = cacheManager.getStats();

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
        cacheStatus: 'healthy',
      },
      metrics: {
        performance: performanceMetrics,
        cache: cacheMetrics,
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
