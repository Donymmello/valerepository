/**
 * Alerts Controller
 * Gerenciamento de alertas e anomalias
 */

const logger = require('../utils/logger');
const alertManager = require('../utils/alertManager');

/**
 * Lista alertas ativos
 */
function getActiveAlerts(req, res) {
  try {
    const { severity } = req.query; // 'critical' ou 'warning'
    const alerts = alertManager.getActiveAlerts(severity || null);

    logger.info('Alertas ativos solicitados', {
      requestId: req.requestId,
      count: alerts.length,
      severity: severity || 'all',
    });

    return res.status(200).json({
      success: true,
      data: alerts,
      count: alerts.length,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Erro ao obter alertas ativos', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Erro ao obter alertas',
      requestId: req.requestId,
    });
  }
}

/**
 * Obtém histórico de alertas
 */
function getAlertHistory(req, res) {
  try {
    const { limit = 50 } = req.query;
    const history = alertManager.getAlertHistory(parseInt(limit, 10));

    logger.info('Histórico de alertas solicitado', {
      requestId: req.requestId,
      limit: parseInt(limit, 10),
      count: history.length,
    });

    return res.status(200).json({
      success: true,
      data: history,
      count: history.length,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Erro ao obter histórico de alertas', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Erro ao obter histórico',
      requestId: req.requestId,
    });
  }
}

/**
 * Obtém estatísticas de alertas
 */
function getAlertStats(req, res) {
  try {
    const stats = alertManager.getAlertStats();

    logger.info('Estatísticas de alertas solicitadas', {
      requestId: req.requestId,
      stats,
    });

    return res.status(200).json({
      success: true,
      data: stats,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas de alertas', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas',
      requestId: req.requestId,
    });
  }
}

/**
 * Reconhece um alerta
 */
function acknowledgeAlert(req, res) {
  try {
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: 'alertId é obrigatório',
        requestId: req.requestId,
      });
    }

    const alert = alertManager.acknowledgeAlert(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta não encontrado',
        requestId: req.requestId,
      });
    }

    logger.info('Alerta reconhecido', {
      requestId: req.requestId,
      alertId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Alerta reconhecido',
      data: alert,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Erro ao reconhecer alerta', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Erro ao reconhecer alerta',
      requestId: req.requestId,
    });
  }
}

/**
 * Configura threshold de alerta
 */
function setThreshold(req, res) {
  try {
    const { metric, warning, critical, unit } = req.body;

    if (!metric || warning === undefined || critical === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: metric, warning, critical',
        requestId: req.requestId,
      });
    }

    alertManager.setThreshold(metric, { warning, critical, unit: unit || 'unit' });

    logger.info('Threshold de alerta configurado', {
      requestId: req.requestId,
      metric,
      warning,
      critical,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Threshold configurado',
      data: { metric, warning, critical, unit },
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Erro ao configurar threshold', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Erro ao configurar threshold',
      requestId: req.requestId,
    });
  }
}

/**
 * Obtém configuração de threshold
 */
function getThresholds(req, res) {
  try {
    const thresholds = {};
    const metricsMap = alertManager.thresholds;

    metricsMap.forEach((config, metric) => {
      thresholds[metric] = config;
    });

    logger.info('Thresholds solicitados', {
      requestId: req.requestId,
      count: metricsMap.size,
    });

    return res.status(200).json({
      success: true,
      data: thresholds,
      count: metricsMap.size,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Erro ao obter thresholds', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Erro ao obter thresholds',
      requestId: req.requestId,
    });
  }
}

module.exports = {
  getActiveAlerts,
  getAlertHistory,
  getAlertStats,
  acknowledgeAlert,
  setThreshold,
  getThresholds,
};
