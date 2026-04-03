const { Reembolso, PedidoCredito, User } = require('../models');
const registrarlogAuditoria = require('../utils/logAuditoria');

/*
    ==========================================================  
    CONTROLADOR DE REEMBOLSO
    ==========================================================  
*/
async function createReembolso(req, res) {
    try {
        const { pedidoId, valorReembolsado, dataReembolso, meioPagamento, numeroTransacao, referencia, observacoes } = req.body;

        if (!pedidoId || !valorReembolsado) {
            return res.status(400).json({
                message: "PedidoId e valor do reembolso são obrigatórios.",
            });
        }
        if (Number(valorReembolsado) <= 0) {
            return res.status(400).json({
                message: "Valor do reembolso deve ser maior que zero.",
            });
        }   

        const pedido = await PedidoCredito.findByPk(pedidoId);

        if (!pedido) {
            return res.status(404).json({
                message: "Pedido de crédito não encontrado.",
            });
        }

        if (!["DESEMBOLSADO", "ENCERRADO"].includes(pedido.status)) {
            return res.status(400).json({
                message: "Reembolso só pode ser criado para pedidos desembolsados ou encerrados.",
            });
        }

        const reembolso = await Reembolso.create({
            pedidoId,
            valorReembolsado,
            dataReembolso: dataReembolso || new Date(),
            meioPagamento: meioPagamento || "TRANSFERENCIA",
            numeroTransacao: numeroTransacao || null,
            referencia: referencia || null,
            observacoes: observacoes || null,
            createdBy: req.user.id,
        });

        await registrarAuditoria({
            userId: req.user.id,
            acao: "CRIAR_REEMBOLSO",
            entidade: "Reembolso",
            entidadeId: reembolso.id,
            descricao: `Reembolso de ${valorReembolsado} criado para pedido ${pedido.numeroPedido}.`,
        });
         
        return res.status(201).json({
            message: "Reembolso criado com sucesso.",
            reembolso,
        });
    }   catch (error) {
        console.error("Erro ao criar reembolso:", error);

        return res.status(500).json({
            message: "Erro interno ao criar reembolso.",
            error: error.message,
        });
    }
}

/*
    ==========================================================  
    Listar reembolsos por pedido
    ==========================================================  
*/
async function getAllReembolsos(req, res) {
    try {
        const reembolsos = await Reembolso.findAll({
            include: [ 
                {
                    model: PedidoCredito,
                    as: "pedido",
                },
                {
                    model: User,
                    as: "criador",
                    attributes: ["id", "nome", "email", "role"],
                },
            ],
            order: [["id", "DESC"]],
        });
        
        return res.status(200).json(reembolsos);
    }   catch (error) {
        console.error("Erro ao listar reembolsos:", error);
        
        return res.status(500).json({
            message: "Erro interno ao listar reembolsos.",
            error: error.message,
        });
    }   
}

/*
    ==========================================================  
    Listar reembolsos por pedido
    ==========================================================  
*/
async function getReembolsoByPedido(req, res) {
    try {
        const { pedidoId } = req.params;
        
        const reembolso = await Reembolso.findAll({
            where: { pedidoId },
            order: [["id", "DESC"]],
        });

        return res.status(200).json(reembolso);
    }   catch (error) {
        console.error("Erro ao listar reembolsos por pedido:", error);

        return res.status(500).json({
            message: "Erro interno ao listar reembolsos por pedido.",
            error: error.message,
        });
    }   
}

module.exports = {
    createReembolso,
    getAllReembolsos,
    getReembolsoByPedido,
};      