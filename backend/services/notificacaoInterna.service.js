/*
  ==========================================================
  NOTIFICAÇÕES PARA A EQUIPA INTERNA (STAFF)
  ==========================================================
  Helper partilhado para avisar ADMIN/GESTOR/ANALISTA/DIRETOR de uma
  empresa quando algo precisa da atenção deles (novo pedido, documento
  anexado pelo mutuário, comprovativo de pagamento enviado, etc).

  Usa Notificacao.bulkCreate numa única query. Cada Notificacao criada
  já dispara, via hook em models/index.js, o fan-out para email/SMS,
  mas esse despacho externo está restrito a role USER/MUTUARIO (ver
  notificacaoExterna.service.js), por isso estas notificações de staff
  ficam só no sino/lista de notificações internas, sem custo de SMS.
*/

const { Op } = require("sequelize");

const ROLES_STAFF = ["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"];

/**
 * Notifica todo o staff ativo de uma empresa.
 * @param {object} params
 * @param {number} params.empresaId
 * @param {number} [params.pedidoId]
 * @param {string} params.titulo
 * @param {string} params.mensagem
 * @param {string} params.tipo - um dos valores do ENUM Notificacao.tipo
 * @param {import("sequelize").Transaction} [transaction]
 */
async function notificarStaffDaEmpresa(
  { empresaId, pedidoId = null, titulo, mensagem, tipo },
  transaction
) {
  try {
    // Lazy require para evitar dependência circular (este serviço pode
    // ser chamado a partir de controllers que já carregam ../models).
    const { User, Notificacao } = require("../models");

    if (!empresaId) return;

    const usuariosInternos = await User.findAll({
      where: {
        empresaId,
        ativo: true,
        role: { [Op.in]: ROLES_STAFF },
      },
      attributes: ["id"],
      transaction,
    });

    if (!usuariosInternos.length) return;

    const notificacoes = usuariosInternos.map((usuario) => ({
      userId: usuario.id,
      pedidoId,
      titulo,
      mensagem,
      tipo,
      lida: false,
    }));

    await Notificacao.bulkCreate(notificacoes, { transaction });
  } catch (error) {
    // Notificação é um efeito colateral, nunca deve impedir a ação
    // principal (criar pedido, anexar documento, enviar comprovativo).
    console.error("[NotificarStaff Error]: Falha ao gerar notificações internas:", error);
  }
}

module.exports = { notificarStaffDaEmpresa, ROLES_STAFF };
