const { Op } = require('sequelize');
const { PedidoCredito, Notificacao, User, Mutuario } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");

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

        /*
          Antes: para cada pedido × cada destinatário interno, 1 findOne
          + (às vezes) 1 create, um loop duplo aninhado, O(pedidos ×
          internos) round-trips sequenciais à BD. Com poucos pedidos e
          poucos internos já dava dezenas de queries; cresce rápido.

          Agora: monta todos os candidatos (pedido × destinatário) em
          memória primeiro, faz 1 query para saber quais notificações
          "não lidas" já existem, e cria as que faltam num único
          bulkCreate.
        */
        const candidatos = [];

        function montarCandidatos(pedidos, campoPrazo, tituloVencido, tituloProximo, montarMensagem, tipoResultado) {
            for (const pedido of pedidos) {
                const prazo = new Date(pedido[campoPrazo]);
                const vencido = prazo < hoje;
                const titulo = vencido ? tituloVencido : tituloProximo;
                const mensagem = montarMensagem(pedido, vencido);

                for (const interno of destinatariosInternos) {
                    candidatos.push({
                        userId: interno.id,
                        pedidoId: pedido.id,
                        numeroPedido: pedido.numeroPedido,
                        titulo,
                        mensagem,
                        vencido,
                        tipoResultado,
                    });
                }
            }
        }

        montarCandidatos(
            pedidosAvaliacao,
            "prazoAvaliacao",
            "Prazo de Avaliação Vencido",
            "Prazo de Avaliação Próximo",
            (pedido, vencido) =>
                vencido
                    ? `O pedido ${pedido.numeroPedido} ultrapassou o prazo de avaliação.`
                    : `O pedido ${pedido.numeroPedido} tem o prazo de avaliação a vencer em breve.`,
            "AVALIACAO"
        );

        montarCandidatos(
            pedidosValidacao,
            "prazoValidacao",
            "Prazo de Validação Vencido",
            "Prazo de Validação Próximo",
            (pedido, vencido) =>
                vencido
                    ? `O pedido ${pedido.numeroPedido} ultrapassou o prazo de validação.`
                    : `O pedido ${pedido.numeroPedido} tem o prazo de validação a vencer em breve.`,
            "VALIDACAO"
        );

        const alertasCriados = [];

        if (candidatos.length) {
            const userIds = [...new Set(candidatos.map((c) => c.userId))];
            const pedidoIds = [...new Set(candidatos.map((c) => c.pedidoId))];

            const existentes = await Notificacao.findAll({
                where: {
                    userId: { [Op.in]: userIds },
                    pedidoId: { [Op.in]: pedidoIds },
                    tipo: "ALERTA_PRAZO",
                    lida: false,
                },
                attributes: ["userId", "pedidoId", "titulo"],
                raw: true,
            });
            const chavesExistentes = new Set(
                existentes.map((n) => `${n.userId}|${n.pedidoId}|${n.titulo}`)
            );

            const paraCriar = [];
            for (const candidato of candidatos) {
                const chave = `${candidato.userId}|${candidato.pedidoId}|${candidato.titulo}`;
                if (chavesExistentes.has(chave)) continue;
                chavesExistentes.add(chave);
                paraCriar.push(candidato);
            }

            if (paraCriar.length) {
                await Notificacao.bulkCreate(
                    paraCriar.map((c) => ({
                        userId: c.userId,
                        pedidoId: c.pedidoId,
                        titulo: c.titulo,
                        mensagem: c.mensagem,
                        tipo: "ALERTA_PRAZO",
                    }))
                );

                // Um alerta reportado por pedido+grupo (não por destinatário),
                // igual ao comportamento original (criadoParaAlguem).
                const pedidosReportados = new Set();
                for (const c of paraCriar) {
                    const chavePedido = `${c.pedidoId}|${c.tipoResultado}`;
                    if (pedidosReportados.has(chavePedido)) continue;
                    pedidosReportados.add(chavePedido);

                    alertasCriados.push({
                        pedidoId: c.pedidoId,
                        numeroPedido: c.numeroPedido,
                        tipo: c.tipoResultado,
                        vencido: c.vencido,
                    });
                }
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