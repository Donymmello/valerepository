/**
 * Logger centralizado com formato JSON estruturado
 * Oferece tipos de log: info, warn, error, debug
 * Cada log inclui timestamp, requestId, contexto, etc.
 */

const fs = require('fs');
const path = require('path');

// Criar diretório de logs se não existir
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLogLevel = process.env.LOG_LEVEL || 'INFO';

/**
 * Formata um log em JSON estruturado
 */
function formatLog(level, message, data = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: data.requestId || null,
    userId: data.userId || null,
    endpoint: data.endpoint || null,
    method: data.method || null,
    statusCode: data.statusCode || null,
    duration: data.duration || null,
    error: data.error || null,
    stack: data.stack || null,
    context: data.context || {},
    environment: process.env.NODE_ENV || 'development',
  });
}

/**
 * Salva log em arquivo (apenas em produção ou se configurado)
 */
function writeToFile(log, level) {
  if (process.env.LOG_TO_FILE !== 'true') return;

  const filename = path.join(logsDir, `${level.toLowerCase()}-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(filename, log + '\n');
}

/**
 * Logger principal
 */
const logger = {
  debug(message, data = {}) {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.DEBUG) {
      const log = formatLog('DEBUG', message, data);
      console.log(log);
      writeToFile(log, 'DEBUG');
    }
  },

  info(message, data = {}) {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.INFO) {
      const log = formatLog('INFO', message, data);
      console.log(log);
      writeToFile(log, 'INFO');
    }
  },

  warn(message, data = {}) {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.WARN) {
      const log = formatLog('WARN', message, data);
      console.warn(log);
      writeToFile(log, 'WARN');
    }
  },

  error(message, data = {}) {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.ERROR) {
      const log = formatLog('ERROR', message, data);
      console.error(log);
      writeToFile(log, 'ERROR');
    }
  },
};

module.exports = logger;
