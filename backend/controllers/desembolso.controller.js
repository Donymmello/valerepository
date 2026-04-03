const { Desembolso, PedidoCredito, User } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");

/*
    ==========================================================  
    CONTROLADOR DE DESEMBOLSO
    ==========================================================
*/  
async function createDesembolso(req, res) {  
    try {   
        const { pedidoId, valorDesembolsado, dataDesembolso, meioPagamento, numeroTransacao, referencia, observacoes } = req.body;
    
        if (!pedidoId || !valorDesembolsado) {
            return res.status(404).json({
                message: "PedidoId e valor do desembolso são obrigatórios.",
            });
        }

        if (Number(valorDesembolsado) <= 0) {
            return res.status(400).json({
                message: "Valor do desembolso deve ser maior que zero.",
            });
        }   

        const pedido = await PedidoCredito.findByPk(pedidoId);  

        if (!pedido) {
            return res.status(404).json({
                message: "Pedido de crédito não encontrado.",
            });
        }   

        if (pedido.status !== "APROVADO") {
            return res.status(400).json({
                message: "Desembolso só pode ser criado para pedidos aprovados.",
            });
        }   

        const desembolso = await Desembolso.create({
            pedidoId,
            valorDesembolsado,
            dataDesembolso: dataDesembolso || new Date(),
            meioPagamento: meioPagamento || "TRANSFERENCIA",
            numeroTransacao: numeroTransacao || null,
            referencia: referencia || null,
            observacoes: observacoes || null,
            createdBy: req.user.id,
        }); 

        await pedido.update({
             status: "DESEMBOLSADO",
     });

        await registrarLogAuditoria({
            userId: req.user.id,
            acao: "CRIAR_DESEMBOLSO",
            entidade: "Desembolso",
            entidadeId: desembolso.id,
            descricao: `Desembolso de ${valorDesembolsado} criado para pedido ${pedidoId}.`,
        });

        return res.status(201).json({
            message: "Desembolso criado com sucesso.",
            desembolso,
        });
    }   catch (error) {
        console.error("Erro ao criar desembolso:", error);
        
        return res.status(500).json({
            message: "Erro interno ao criar desembolso.",
            error: error.message,
        });
    }
}

/*
    ==========================================================  
    Lista de desembolsos
    ==========================================================
*/
async function getAllDesembolsos(req, res) {
    try {
        const desembolsos = await Desembolso.findAll({
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
            order: [["created_at", "DESC"]],
        }); 

        return res.status(200).json(desembolsos);
    } catch (error) {
        console.error("Erro ao buscar desembolsos:", error);

        return res.status(500).json({
            message: "Erro interno ao buscar desembolsos.",
            error: error.message,
        });
        }
    }

    /*
        ==========================================================  
        Lista de desembolsos por pedido
        ==========================================================
    */
    async function getDesembolsoByPedido(req, res) {
        try {
            const { pedidoId } = req.params;
            
            const desembolso = await Desembolso.findAll({
                where: { pedidoId },
                include: [["id", "DESC"]],
            });

            return res.status(200).json(desembolso);
        } catch (error) {
            console.error("Erro ao buscar desembolso por pedido:", error);  

            return res.status(500).json({
                message: "Erro interno ao buscar desembolso por pedido.",
                error: error.message,
            });
        }
    }

module.exports = {
    createDesembolso,
    getAllDesembolsos,
    getDesembolsoByPedido,
};     
