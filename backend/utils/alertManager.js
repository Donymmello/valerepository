/**
 * Alert Manager
 * Sistema configurável de alertas para anomalias
 * Permite monitorar thresholds e gerar notificações
 */

const logger = require('./logger');

class AlertManager {
  constructor() {
    this.alerts = new Map();
    this.thresholds = new Map();
    this.history = [];
    this.subscribers = [];

    this.initDefaultThresholds();
  }

  /**
   * Inicializa thresholds padrão
   */
  initDefaultThresholds() {
    // Performance
    this.setThreshold('endpoint_response_time', {
      warning: 3000, // 3 segundos
      critical: 5000, // 5 segundos
      unit: 'ms',
    });

    // Memória
    this.setThreshold('memory_usage', {
      warning: 0.7, // 70%
      critical: 0.85, // 85%
      unit: '%',
    });

    // CPU
    this.setThreshold('cpu_usage', {
      warning: 0.6, // 60%
      critical: 0.8, // 80%
      unit: '%',
    });

    // Database
    this.setThreshold('db_query_time', {
      warning: 1000, // 1 segundo
      critical: 3000, // 3 segundos
      unit: 'ms',
    });

    // Cache miss rate
    this.setThreshold('cache_miss_rate', {
      warning: 0.3, // 30%
      critical: 0.5, // 50%
      unit: '%',
    });

    // Error rate
    this.setThreshold('error_rate', {
      warning: 0.01, // 1%
      critical: 0.05, // 5%
      unit: '%',
    });
  }

  /**
   * Define um threshold para métrica
   */
  setThreshold(metric, config) {
    this.thresholds.set(metric, config);
    logger.info(`Alert threshold configurado: ${metric}`, config);
  }

  /**
   * Obtém threshold de uma métrica
   */
  getThreshold(metric) {
    return this.thresholds.get(metric);
  }

  /**
   * Verifica se valor excedeu threshold
   * @returns {null|'warning'|'critical'}
   */
  checkThreshold(metric, value) {
    const threshold = this.thresholds.get(metric);
    if (!threshold) return null;

    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return null;
  }

  /**
   * Cria e registra um alerta
   */
  createAlert(metric, value, severity, context = {}) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      metric,
      value,
      severity,
      context,
      acknowledged: false,
    };

    this.alerts.set(alert.id, alert);
    this.history.push(alert);

    // Manter apenas últimos 1000 alertas no histórico
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }

    // Notificar subscribers
    this.notifySubscribers(alert);

    logger.warn(`Alerta criado: ${metric}`, {
      severity,
      value,
      threshold: this.thresholds.get(metric),
      context,
    });

    return alert;
  }

  /**
   * Monitora uma métrica e cria alerta se necessário
   */
  monitor(metric, value, context = {}) {
    const severity = this.checkThreshold(metric, value);
    if (severity) {
      return this.createAlert(metric, value, severity, context);
    }
    return null;
  }

  /**
   * Subscreve a alertas
   */
  subscribe(callback) {
    this.subscribers.push(callback);
  }

  /**
   * Notifica todos os subscribers
   */
  notifySubscribers(alert) {
    this.subscribers.forEach((callback) => {
      try {
        callback(alert);
      } catch (err) {
        logger.error('Erro ao notificar subscriber', {
          error: err.message,
          alertId: alert.id,
        });
      }
    });
  }

  /**
   * Reconhece um alerta
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      logger.info(`Alerta reconhecido`, { alertId });
    }
    return alert;
  }

  /**
   * Obtém alertas ativos
   */
  getActiveAlerts(severityFilter = null) {
    return Array.from(this.alerts.values()).filter((a) => {
      if (!a.acknowledged && (a.severity === 'critical' || a.severity === 'warning')) {
        if (severityFilter) {
          return a.severity === severityFilter;
        }
        return true;
      }
      return false;
    });
  }

  /**
   * Obtém histórico de alertas
   */
  getAlertHistory(limit = 50) {
    return this.history.slice(-limit).reverse();
  }

  /**
   * Retorna estatísticas de alertas
   */
  getAlertStats() {
    const stats = {
      total: this.alerts.size,
      active: 0,
      critical: 0,
      warning: 0,
      acknowledged: 0,
      topMetrics: {},
    };

    this.alerts.forEach((alert) => {
      if (!alert.acknowledged && (alert.severity === 'critical' || alert.severity === 'warning')) {
        stats.active++;
      }

      if (alert.severity === 'critical') stats.critical++;
      if (alert.severity === 'warning') stats.warning++;
      if (alert.acknowledged) stats.acknowledged++;

      stats.topMetrics[alert.metric] = (stats.topMetrics[alert.metric] || 0) + 1;
    });

    return stats;
  }

  /**
   * Limpa alertas antigos (mais de 24 horas)
   */
  cleanup() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    for (const [id, alert] of this.alerts.entries()) {
      const alertTime = new Date(alert.timestamp).getTime();
      if (alertTime < oneDayAgo && alert.acknowledged) {
        this.alerts.delete(id);
      }
    }

    logger.debug('Alert Manager cleanup concluído');
  }
}

// Exporta singleton
module.exports = new AlertManager();
