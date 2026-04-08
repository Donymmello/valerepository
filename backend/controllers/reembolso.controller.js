const { Reembolso, PedidoCredito, User, Desembolso } = require('../models');
const registrarlogAuditoria = require('../utils/logAuditoria');

/*
    ==========================================================  
    FUNCAO AUXILIAR PARA CALCULAR O ESTADO FINANCEIRO DO PEDIDO
    SE O PEDIDO ESTIVER TOTALMENTE PAGO, FECHA AUTOMATICAMENTE
    ==========================================================  
*/
async function calcularEstadoFinanceiro(pedidoId, userId) {
    // Buscar todos os desembolsos do pedido
    const desembolsos = await Desembolso.findAll({
        where: { pedidoId },
    });

    // Buscar todos os reembolsos do pedido
    const reembolsos = await Reembolso.findAll({
        where: { pedidoId },
    });

    const totalDesembolsos = desembolsos.reduce((total, item) => {
        return total + Number(item.valor || 0);
    }, 0);

    const totalReembolsos = reembolsos.reduce((total, item) => {
        return total + Number(item.valorReembolsado || 0);
    }, 0);

    const pedido = await PedidoCredito.findByPk(pedidoId);
    if (!pedido) return;

    //se pedido tiver sido totalmente reembolsado, fecha o pedido
    if (
        totalDesembolsado > 0 &&
        totalReembolsado >= totalDesembolsado &&
        pedido.status !== "ENCERRADO"
    ) {
        await pedido.update({
            status: "ENCERRADO", 
        });

        await registrarlogAuditoria({
            userId,
            acao: "ENCERRAR_PEDIDO",
            entidade: "PedidoCredito",
            entidadeId: pedidoId,
            descricao: `Pedido ${pedido.numeroPedido} encerrado automaticamente após reembolso total.`,
        });
    }
}

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

        //Recalcula e encerra o pedido se tiver sido totalmente reembolsado
        await calcularEstadoFinanceiro(pedidoId, req.user.id);

        const pedidoAtualizado = await PedidoCredito.findByPk(pedidoId);
         
        return res.status(201).json({
            message: "Reembolso criado com sucesso.",
            reembolso,
            pedido: pedidoAtualizado,
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