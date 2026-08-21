const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const { getExtratoPedido, getExtratoPedidoPdf } = require('../controllers/extrato.controller');

/*
    ==========================================================
    ROTA PARA GERAR EXTRATO FINANCEIRO E PROCESSUAL DO PEDIDO
    ==========================================================
*/

router.get('/pedido/:pedidoId', authMiddleware, getExtratoPedido);
router.get('/pedido/:pedidoId/pdf', authMiddleware, getExtratoPedidoPdf);

module.exports = router;