const {Op} = require('sequelize');
const { PedidoCredito,Notificacao, User, Mutuario } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria"); 

/*
  ==========================================================
  FUNCAO AUXLIAR PARA CRIAR NOTIFICACAO SEM DUPLICAR MUITO
  ==========================================================
*/
async function criarNotificacao({ userId, titulo, mensagem, tipo = "ALERTA_PRAZO" }) {
    if (!userId) return;

    await Notificacao.create({
        userId,
        titulo,
        mensagem,
        tipo,
    });
}

/*
    ==========================================================
    VERIFICAR PRAZOS DE AVALIACAO E VALIDACAO
    ==========================================================
    Regras simples:
    - prazo de avaliacao vencido => alerta
    - prazo de validacao vencido => alerta
    - prazo proximo (hoje ou amanhã) => alerta
*/
async function verificarAlertasPrazo(req, res) {
    try {
        const hoje = new Date();
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);

/*
 pedidos em analise com prazo de avaliacao vencido ou proximo
*/
        const pedidosAvaliacao = await PedidoCredito.findAll({ 
            where: {
                status: {
                    [Op.in]: ["SUBMETIDO", "EM_ANALISE"],
                },
                prazoAvaliacao: {
                    [Op.ne]: null,
                    [Op.lte]: amanha, // prazo hoje ou amanhã
                },
            },
            include: [
                {
                    model: Mutuario,
                    as: "mutuario",
                    required: false
                },
                {
                    model: User,
                    as: "criador",
                    required: false,
                    attributes: ["id", "nome", "email", "role", "ativo"]
                }
            ]
        });

        // Pedidos em validacao com prazo de validacao vencido ou proximo

        const pedidosValidacao = await PedidoCredito.findAll({
            where: {
                status: {
                    [Op.in]: ["EM_VALIDACAO"]
                },
                prazoValidacao: {
                    [Op.ne]: null,
                    [Op.lte]: amanha, // prazo hoje ou amanhã
                },
            },
            include: [
                {
                    model: Mutuario,
                    as: "mutuario",
                    required: false
                },
                {
                    model: User,
                    as: "criador",
                    required: false,
                    attributes: ["id", "nome", "email", "role", "ativo"]
                }
            ]
        });

        const alertasCriados = [];

        // Criar notificações para pedidos em avaliação

        for (const pedido of pedidosAvaliacao) {
            const prazo = new Date(pedido.prazoAvaliacao);
            const vencido = prazo < hoje;

            const titulo = vencido 
            ? "Prazo de Avaliação Vencido" 
            : "Prazo de Avaliação Próximo";

            const mensagem = vencido
            ? `o pedido ${pedido.numeroPedido} utrapassou o prazo de avaliação.`
            : `o pedido ${pedido.numeroPedido} tem o prazo de avaliação a vencer em breve.`;

            await criarNotificacao({
                userId: pedido.createdBy,
                titulo,
                mensagem,
                tipo: "ALERTA_PRAZO"
            });

            alertasCriados.push({
                pedidoId: pedido.id,
                numeroPedido: pedido.numeroPedido,
                tipo: "AVALIACAO",
                vencido,
            });
        }

        // Criar notificações para pedidos em validação

        for (const pedido of pedidosValidacao) {
            const prazo = new Date(pedido.prazoValidacao);
            const vencido = prazo < hoje;

            const titulo = vencido
            ? "Prazo de Validação Vencido"
            : "Prazo de Validação Próximo";

            const mensagem = vencido
            ? `o pedido ${pedido.numeroPedido} utrapassou o prazo de validação.`
            : `o pedido ${pedido.numeroPedido} tem o prazo de validação a vencer em breve.`;

            await criarNotificacao({
                userId: pedido.createdBy,
                titulo,
                mensagem,
                tipo: "ALERTA_PRAZO"
            });
            
            alertasCriados.push({
                pedidoId: pedido.id,
                numeroPedido: pedido.numeroPedido,
                tipo: "VALIDACAO",
                vencido,
            });
        }

        await registrarLogAuditoria({
            userId: req.user.id,
            acao: "VERIFICAR_ALERTAS_PRAZO",
            entidade: "PedidoCredito",
            entidadeId: null,
            descricao: `Verificação de alertas de prazo realizada. Total de alertas criados: ${alertasCriados.length}.`
        });

        return res.status(200).json({
            message: "Verificação de alertas de prazo concluída.",
            totalAlertas: alertasCriados.length,
            alertasCriados,
        });
    } catch (error) {
        console.error("Erro ao verificar alertas de prazo:", error);    

        return res.status(500).json({
            message: "Erro interno ao verificar alertas de prazo.",
            error: error.message,
        });
    }
}

module.exports = {
    verificarAlertasPrazo,
};

