/**
 * Error Handler Middleware
 * Captures all errors, logs context, and formats response
 */

const logger = require('../utils/logger');

/**
 * Middleware de tratamento de erros (DEVE ser o último middleware)
 */
function errorHandlerMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const requestId = req.requestId || 'UNKNOWN';
  const duration = req.startTime ? Date.now() - req.startTime : null;

  // Log estruturado do erro
  logger.error(`${err.message}`, {
    requestId,
    userId: req.user?.id || null,
    endpoint: `${req.method} ${req.path}`,
    method: req.method,
    statusCode,
    duration,
    error: err.message,
    stack: err.stack,
    context: {
      errorCode: err.code || 'UNKNOWN_ERROR',
      errorName: err.name || 'Error',
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
      : err.message,
    requestId,
    error: process.env.NODE_ENV === 'development' ? {
      code: err.code || 'UNKNOWN_ERROR',
      stack: err.stack,
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
