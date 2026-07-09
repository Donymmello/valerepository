/**
 * Performance Metrics Middleware
 * Tracks response time, memory and CPU per endpoint
 * ponytail: Removed alertManager integration - use logs only
 */

const logger = require('../utils/logger');
const os = require('os');

// Armazenar métricas (em produção usar Redis/prometheus)
const metricsStore = {
  endpoints: {},
};

/**
 * Calcula uso de CPU
 */
function getCPUUsage() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;

  cpus.forEach(cpu => {
    Object.values(cpu.times).forEach(time => totalTick += time);
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);

  return usage;
}

/**
 * Obtém uso de memória do processo
 */
function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  return {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    external: Math.round(memUsage.external / 1024 / 1024), // MB
    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
  };
}

/**
 * Middleware que rastreia performance
 */
function performanceMetricsMiddleware(req, res, next) {
  const endpoint = `${req.method} ${req.path}`;
  const startTime = Date.now();
  const startMem = process.memoryUsage().heapUsed;
  const startCpu = process.cpuUsage();

  // Interceptar res.json para capturar resposta
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const endMem = process.memoryUsage().heapUsed;
    const memDelta = (endMem - startMem) / 1024 / 1024; // MB
    const cpu = process.cpuUsage(startCpu);

    const metrics = {
      endpoint,
      statusCode: res.statusCode,
      duration,
      memory: {
        deltaHeap: memDelta,
        current: getMemoryUsage(),
      },
      cpu: {
        user: Math.round(cpu.user / 1000), // ms
        system: Math.round(cpu.system / 1000), // ms
      },
    };

    // Armazenar métrica
    if (!metricsStore.endpoints[endpoint]) {
      metricsStore.endpoints[endpoint] = [];
    }
    metricsStore.endpoints[endpoint].push(metrics);
    // Manter apenas últimas 100 requisições
    if (metricsStore.endpoints[endpoint].length > 100) {
      metricsStore.endpoints[endpoint].shift();
    }

    // Log de performance
    logger.debug(`Request completed`, {
      requestId: req.requestId,
      userId: req.user?.id || null,
      endpoint,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      memory: `${memDelta > 0 ? '+' : ''}${memDelta.toFixed(2)}MB`,
    });

    return originalJson.call(this, data);
  };

  next();
}

/**
 * Obter estatísticas de performance
 */
function getMetricsStats() {
  const stats = {};
  
  Object.entries(metricsStore.endpoints).forEach(([endpoint, metrics]) => {
    const durations = metrics.map(m => m.duration);
    const statuses = metrics.map(m => m.statusCode);

    stats[endpoint] = {
      totalRequests: metrics.length,
      avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p95Duration: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)],
      errorRate: (statuses.filter(s => s >= 400).length / statuses.length * 100).toFixed(2) + '%',
      lastMetric: metrics[metrics.length - 1],
    };
  });

  return stats;
}

/**
 * Resetar métricas
 */
function resetMetrics() {
  Object.keys(metricsStore.endpoints).forEach(key => {
    metricsStore.endpoints[key] = [];
  });
}

module.exports = {
  performanceMetricsMiddleware,
  getMetricsStats,
  resetMetrics,
};
