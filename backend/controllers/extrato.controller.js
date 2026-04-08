const e = require('express');
const { PedidoCredito, Mutuario, User, Reembolso, Desembolso, AprovacaoPedido } = require('../models');

/*
  ==========================================================
  EXTRATO FINANCEIRO E PROCESSUAL DO PEDIDO
  ==========================================================
  Esta função devolve uma visão completa do pedido:
  - dados gerais
  - aprovações
  - desembolsos
  - reembolsos
  - totais
  - saldo atual
*/
async function getExtratoPedido(req, res) {
    try {
        const { pedidoId } = req.params;

        const pedido = await PedidoCredito.findByPk(pedidoId, {
            include: [
                {
                    model: Mutuario,
                    as: "mutuario",
                },
                {
                    model: User,
                    as: "criador",
                    attributes: ["id", "nome", "email", "role", "ativo"],
                },
                {
                    model: AprovacaoPedido,
                    as: "aprovacoes",
                    required: false,
                    include: [
                        {
                            model: User,
                            as: "aprovador",
                            attributes: ["id", "nome", "email", "role", "ativo"],
                        },
                    ],
                },
                {
                    model: Desembolso,
                    as: "desembolsos",
                    required: false,
                    include: [
                        {
                            model: User,
                            as: "criador",
                            attributes: ["id", "nome", "email", "role"],
                        },
                    ],
                },
                {
                    model: Reembolso,
                    as: "reembolsos",
                    required: false,
                    include: [
                        {
                            model: User,
                            as: "criador",
                            attributes: ["id", "nome", "email", "role"],
                        },
                    ],
                },
            ],
        });
        
        if (!pedido) {
            return res.status(404).json({
                message: "Pedido de crédito não encontrado.",
            });
        }

        const totalDesembolsado = pedido.desembolsos || [].reduce((total, item) => {
            return total + Number(item.valor || 0);
        }, 0);

        const totalReembolsado = pedido.reembolsos || [].reduce((total, item) => {
            return total + Number(item.valorPago || 0);
        }, 0);

        const saldoEmDivida = totalDesembolsado - totalReembolsado;

        return res.status(200).json({
            pedido,
            resumoFinanceiro: {
            totalDesembolsado,
            totalReembolsado,
            saldoEmDivida,
            },
        });
    } catch (error) {
        console.error("Erro ao gerar extrato do pedido:", error);

        return res.status(500).json({
            message: "Erro interno ao gerar extrato do pedido.",
            error: error.message,
        });
    }
}

module.exports = {
    getExtratoPedido,
};  