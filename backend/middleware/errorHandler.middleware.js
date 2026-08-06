/**
 * Error Handler Middleware
 * Captures all errors, logs context, and formats response
 */

const logger = require('../utils/logger');

/**
 * Helper interno para remover múltiplos dados sensíveis do log do body
 */
function higienizarDadosSensiveis(body) {
  if (!body) return null;
  
  const chavesSensiveis = ['password', 'senha', 'token', 'pino', 'pin', 'documentoNumero'];
  const bodyCopiado = JSON.parse(JSON.stringify(body)); // Deep copy segura para logs

  const mascarar = (obj) => {
    for (const key in obj) {
      if (chavesSensiveis.includes(key.toLowerCase())) {
        obj[key] = '***';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        mascarar(obj[key]);
      }
    }
  };

  mascarar(bodyCopiado);
  return bodyCopiado;
}

/**
 * Middleware de tratamento de erros (DEVE ser o último middleware)
 */
function errorHandlerMiddleware(err, req, res, next) {
  // Se os headers já foram enviados para o cliente, delega para o handler padrão do Express
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const requestId = req.requestId || 'UNKNOWN';
  const duration = req.startTime ? Date.now() - req.startTime : null;

  // Log estruturado do erro com higienização avançada
  logger.error(`${err.message || 'Internal Server Error'}`, {
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
      body: higienizarDadosSensiveis(req.body),
    },
  });

  // Resposta estruturada e segura ao cliente
  return res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor.' 
      : err.message || 'Ocorreu um erro inesperado.',
    requestId,
    ...(process.env.NODE_ENV === 'development' && {
      error: {
        code: err.code || 'UNKNOWN_ERROR',
        name: err.name || 'Error',
        stack: err.stack,
      }
    }),
  });
}

/**
 * Wrapper para capturar erros em funções async (Elimina a necessidade de try/catch nos controllers)
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