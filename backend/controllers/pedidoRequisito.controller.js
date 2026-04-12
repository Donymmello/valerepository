const { PedidoCredito, RequisitoCredito, PedidoRequisito, } = require('../models');
const registrarLogAuditoria = require('../utils/logAuditoria');

/*
  ==========================================================
  ADICIONAR REQUISITO AO PEDIDO
  ==========================================================
*/
async function adicionarPedidoRequisito(req, res) {
    try {
        const { pedidoId } = req.params;
        const { requisitoId, observacoes } = req.body;

        if (!requisitoId) {
            return res.status(400).json({
                message: 'O campo "requisitoId" é obrigatório.',
            });
        }

        const pedido = await PedidoCredito.findByPk(pedidoId);
        if (!pedido) {
            return res.status(404).json({
                message: 'Pedido de crédito não encontrado.',
            });
        }

        const existente = await PedidoRequisito.findOne({
            where: { pedidoId, requisitoId },
        });

        if (existente) {
            return res.status(409).json({
                message: 'Este requisito já foi adicionado a este pedido.',
            });
        }

        const item = await PedidoRequisito.create({
            pedidoId,
            requisitoId,
            observacoes: observacoes || null,
        });

        await registrarLogAuditoria({
            userId: req.user.id,
            acao: 'Adicionar Requisito ao Pedido',
            entidade: 'PedidoRequisito',
            entidadeId: item.id,
            descricao: `Requisito ID ${requisitoId} adicionado ao pedido ID ${pedidoId}.`,
        });

        return res.status(201).json({
            message: 'Requisito adicionado ao pedido com sucesso.',
            item,
        });
    } catch (error) {
        console.error('Erro ao adicionar requisito ao pedido:', error);

        return res.status(500).json({
            message: 'Ocorreu um erro ao adicionar o requisito ao pedido.',
            error: error.message,
        });
    }   
}

/*
  ==========================================================
    LISTAR REQUISITOS DE UM PEDIDO
    ==========================================================
*/
async function getRequisitosByPedido(req, res) {
    try {
        const { pedidoId } = req.params;

        const pedido = await PedidoCredito.findAll({
            where: { pedidoId },
            include: [
                {
                model: RequisitoCredito,
                as: 'requisitos',
            },
            ],
            order: [['id', 'DESC']],
        });

        return res.status(200).json(pedido);
    } catch (error) {
        console.error('Erro ao listar requisitos do pedido:', error);

        return res.status(500).json({
            message: 'Ocorreu um erro ao listar os requisitos do pedido.',
            error: error.message,
        });
    }
}

/*
  ==========================================================
    Validar Requisito do Pedido
    ==========================================================
*/
async function validarRequisitoPedido(req, res) {
    try {
        const { id } = req.params;
        const { estado, observacoes } = req.body;

        const estadosPermitidos = ['Pendente', 'Aprovado', 'Rejeitado'];

        if (!estado || !estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                message: `Estado inválido.`,
                estadosPermitidos,
            });
        }
        
        const item = await PedidoRequisito.findByPk(id);

        if (!item) {
            return res.status(404).json({
                message: 'Requisito do pedido não encontrado.',
            });
        }

        await item.update({
            estado,
            observacoes: observacoes !== undefined ? observacoes : item.observacoes,
            validadoPor: req.user.id,
            dataValidacao: new Date(),
        });

        await registrarLogAuditoria({
            userId: req.user.id,
            acao: 'Validar Requisito do Pedido',
            entidade: 'PedidoRequisito',
            entidadeId: item.id,
            descricao: `Requisito do pedido ID ${item.id} atualizado para estado ${estado}.`,
        });

        return res.status(200).json({
            message: 'Requisito do pedido validado com sucesso.',
            item,
        });
    } catch (error) {
        console.error('Erro ao validar requisito do pedido:', error);

        return res.status(500).json({
            message: 'Ocorreu um erro ao validar o requisito do pedido.',
            error: error.message,
        });
    }
}

module.exports = {
    adicionarPedidoRequisito,
    getRequisitosByPedido,
    validarRequisitoPedido,
};