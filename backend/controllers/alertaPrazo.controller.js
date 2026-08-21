const { Op } = require('sequelize');
const { PedidoCredito, Notificacao, User, Mutuario } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");

/*
  ==========================================================
  FUNÇÃO AUXILIAR PARA CRIAR NOTIFICAÇÃO SEM DUPLICAR
  ==========================================================
  Regra forte:
  - verifica por userId + pedidoId + tipo + titulo + lida=false
*/
async function criarNotificacao({
    userId,
    pedidoId = null,
    titulo, mensagem,
    tipo = "ALERTA_PRAZO"
}) {
    if (!userId) return null;

    const notificacaoExistente = await Notificacao.findOne({
        where: {
            userId,
            pedidoId,
            titulo,
            tipo,
            lida: false,
        },
    });

    if (notificacaoExistente) {
        return null;
    }

    const novaNotificacao = await Notificacao.create({
        userId,
        pedidoId,
        titulo,
        mensagem,
        tipo,
    });

}

async function obterDestinatariosInternos(empresaId) {
    return User.findAll({
        where: {
            empresaId,
            ativo: true,
            role: {
                [Op.in]: ["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"],
            },
        },
        attributes: ["id", "nome", "email", "role", "ativo"],
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
/*
  Núcleo da verificação, isolado do req/res para poder ser chamado tanto
  pelo endpoint manual (POST /alertas-prazo/verificar, usado pelo botão
  em /interno/alertas-prazo) como pelo agendador automático
  (services/agendador.service.js).
*/
async function executarVerificacaoPrazo(empresaId, { registarAuditoria = false, userIdAuditoria = null } = {}) {
        const hoje = new Date();
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);

        const destinatariosInternos = await obterDestinatariosInternos(empresaId);

        /*
         pedidos em analise com prazo de avaliacao vencido ou proximo
        */
        const pedidosAvaliacao = await PedidoCredito.findAll({
            where: {
                empresaId,
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
                empresaId,
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
                ? `O pedido ${pedido.numeroPedido} ultrapassou o prazo de avaliação.`
                : `O pedido ${pedido.numeroPedido} tem o prazo de avaliação a vencer em breve.`;


            let criadoParaAlguem = false;

            for (const interno of destinatariosInternos) {
                const notificacaoCriada = await criarNotificacao({
                    userId: interno.id,
                    pedidoId: pedido.id,
                    titulo,
                    mensagem,
                    tipo: "ALERTA_PRAZO",
                });

                if (notificacaoCriada) {
                    criadoParaAlguem = true;
                }
            }

            if (criadoParaAlguem) {
                alertasCriados.push({
                    pedidoId: pedido.id,
                    numeroPedido: pedido.numeroPedido,
                    tipo: "AVALIACAO",
                    vencido,
                });
            }
        }

        for (const pedido of pedidosValidacao) {
            const prazo = new Date(pedido.prazoValidacao);
            const vencido = prazo < hoje;

            const titulo = vencido
                ? "Prazo de Validação Vencido"
                : "Prazo de Validação Próximo";

            const mensagem = vencido
                ? `O pedido ${pedido.numeroPedido} ultrapassou o prazo de validação.`
                : `O pedido ${pedido.numeroPedido} tem o prazo de validação a vencer em breve.`;

            let criadoParaAlguem = false;

            for (const interno of destinatariosInternos) {
                const notificacaoCriada = await criarNotificacao({
                    userId: interno.id,
                    pedidoId: pedido.id,
                    titulo,
                    mensagem,
                    tipo: "ALERTA_PRAZO",
                });

                if (notificacaoCriada) {
                    criadoParaAlguem = true;
                }
            }

            if (criadoParaAlguem) {
                alertasCriados.push({
                    pedidoId: pedido.id,
                    numeroPedido: pedido.numeroPedido,
                    tipo: "VALIDACAO",
                    vencido,
                });
            }
        }

        if (registarAuditoria) {
            await registrarLogAuditoria({
                userId: userIdAuditoria,
                acao: "VERIFICAR_ALERTAS_PRAZO",
                entidade: "PedidoCredito",
                entidadeId: null,
                descricao: `Verificação de alertas de prazo realizada. Total de alertas criados: ${alertasCriados.length}.`,
            });
        }

        return alertasCriados;
}

async function verificarAlertasPrazo(req, res) {
    try {
        const alertasCriados = await executarVerificacaoPrazo(req.user.empresaId, {
            registarAuditoria: true,
            userIdAuditoria: req.user.id,
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
    executarVerificacaoPrazo,
};