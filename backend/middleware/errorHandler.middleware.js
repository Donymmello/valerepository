/**
 * Error Handler Middleware com Stack Trace Completo
 * Captura todos os erros, registra contexto completo e formata resposta
 */

const logger = require('../utils/logger');

/**
 * Converte erro em objeto estruturado
 */
function formatError(error) {
  return {
    message: error.message || 'Erro desconhecido',
    code: error.code || 'UNKNOWN_ERROR',
    stack: error.stack || '',
    name: error.name || 'Error',
  };
}

/**
 * Middleware de tratamento de erros (DEVE ser o último middleware)
 */
function errorHandlerMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const requestId = req.requestId || 'UNKNOWN';
  const duration = req.startTime ? Date.now() - req.startTime : null;

  const errorData = formatError(err);

  // Log estruturado do erro
  logger.error(`${err.message}`, {
    requestId,
    userId: req.user?.id || null,
    endpoint: `${req.method} ${req.path}`,
    method: req.method,
    statusCode,
    duration,
    error: errorData.message,
    stack: errorData.stack,
    context: {
      errorCode: errorData.code,
      errorName: errorData.name,
      url: req.originalUrl,
      query: req.query,
      body: req.body ? { ...req.body, password: '***' } : null,
    },
  });

  // Resposta ao cliente
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : errorData.message,
    requestId,
    error: process.env.NODE_ENV === 'development' ? {
      code: errorData.code,
      stack: errorData.stack,
    } : null,
  });
}

/**
 * Wrapper para capturar erros em funções async
 * Uso: router.get('/path', asyncHandler(controllerFunction))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandlerMiddleware,
  asyncHandler,
};
