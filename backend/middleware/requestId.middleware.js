/**
 * Middleware de Request ID
 * Gera um ID único para cada requisição para rastreadibilidade
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Gera ID único em formato: REQ-TIMESTAMP-UUID
 */
function generateRequestId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const uuid = uuidv4().substring(0, 8).toUpperCase();
  return `REQ-${timestamp}-${uuid}`;
}

/**
 * Middleware que adiciona requestId ao objeto request e response headers
 */
function requestIdMiddleware(req, res, next) {
  const requestId = generateRequestId();
  
  // Adicionar ao request para uso em controllers
  req.requestId = requestId;
  
  // Adicionar aos response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Adicionar ao objeto de resposta para referência
  res.requestId = requestId;
  
  // Armazenar tempo de início
  req.startTime = Date.now();
  
  next();
}

module.exports = requestIdMiddleware;
