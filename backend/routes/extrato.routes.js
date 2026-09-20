const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const { getExtratoPedido, getExtratoPedidoPdf } = require('../controllers/extrato.controller');

/*
    ==========================================================
    ROTA PARA GERAR EXTRATO FINANCEIRO E PROCESSUAL DO PEDIDO
    ==========================================================
*/

/*
  Rotas de backoffice: o extrato devolve o registo completo do mutuario
  (NUIT, documento, morada) mais aprovacoes, desembolsos e reembolsos, e
  so filtra por empresaId. Sem guarda de perfil, um mutuario do portal
  lia o processo de qualquer outro cliente da mesma financeira. O portal
  tem /portal/meus-pedidos/:id/extrato para o mutuario ver o seu.
*/
router.get(
  '/pedido/:pedidoId',
  authMiddleware,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA', 'DIRETOR'),
  getExtratoPedido
);
router.get(
  '/pedido/:pedidoId/pdf',
  authMiddleware,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA', 'DIRETOR'),
  getExtratoPedidoPdf
);

module.exports = router;