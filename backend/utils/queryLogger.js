/**
 * Query Logger para Sequelize
 * Registra todas as queries com duração, parâmetros e status
 */

const logger = require('../utils/logger');

/**
 * Configurar logging de queries no Sequelize
 */
function setupQueryLogging(sequelize) {
  sequelize.addHook('beforeConnect', (config) => {
    config.logging = false; // Desabilitar logging padrão do Sequelize
  });

  // Hook para todas as queries
  sequelize.addHook('beforeFind', (options, query) => {
    options.logging = (sql, timing) => {
      if (timing > 1000) {
        // Log de warning para queries lentas
        logger.warn(`Slow database query`, {
          sql: sql.substring(0, 200),
          duration: timing,
          threshold: 1000,
        });
      }
    };
  });

  // Adicionar logging customizado via função
  sequelize.afterConnect = (conn, config) => {
    const originalLogger = config.logging;
    
    config.logging = (sql, timing) => {
      logger.debug(`Database query executed`, {
        query: sql.substring(0, 200),
        duration: timing,
        type: sql.split(' ')[0], // SELECT, INSERT, UPDATE, DELETE
      });
    };
  };
}

/**
 * Hook para registrar query com contexto completo
 */
function setupContextualQueryLogging(sequelize, requestContext = {}) {
  sequelize.addHook('beforeFind', (options) => {
    const startTime = Date.now();
    
    options.logging = (sql, timing) => {
      const duration = Date.now() - startTime;
      
      logger.debug(`Query executed`, {
        requestId: requestContext.requestId,
        userId: requestContext.userId,
        query: sql.substring(0, 500),
        duration,
        table: extractTableFromSQL(sql),
        action: extractActionFromSQL(sql),
      });

      // Alertar se query muito lenta
      if (duration > 5000) {
        logger.warn(`Very slow query detected`, {
          requestId: requestContext.requestId,
          query: sql.substring(0, 200),
          duration,
          threshold: 5000,
        });
      }
    };
  });
}

/**
 * Extrai tabela do SQL
 */
function extractTableFromSQL(sql) {
  const match = sql.match(/FROM\s+`?(\w+)`?|INTO\s+`?(\w+)`?/i);
  return match ? match[1] || match[2] : 'unknown';
}

/**
 * Extrai ação do SQL (SELECT, INSERT, UPDATE, DELETE)
 */
function extractActionFromSQL(sql) {
  const action = sql.split(' ')[0].toUpperCase();
  return ['SELECT', 'INSERT', 'UPDATE', 'DELETE'].includes(action) ? action : 'OTHER';
}

module.exports = {
  setupQueryLogging,
  setupContextualQueryLogging,
  extractTableFromSQL,
  extractActionFromSQL,
};
