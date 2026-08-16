const { AprovacaoPedido, PedidoCredito, User, Mutuario, Notificacao, PedidoRequisito, RequisitoCredito, sequelize } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const { podeAprovarPedido, podeRejeitarPedido, podeTransitarStatus, STATUS_PEDIDO } = require("../utils/regrasPedido");

// =========================================================================
// HELPERS / ENGINE DE FLUXO
// =========================================================================

async function criarNotificacao({ userId, pedidoId = null, titulo, mensagem, tipo = "SISTEMA" }, transaction) {
  if (!userId) return null;
  
  const [notificacao, criada] = await Notificacao.findOrCreate({
    where: { userId, pedidoId, titulo, tipo, lida: false },
    defaults: { mensagem },
    transaction
  });
  return criada ? notificacao : null;
}

async function verificarRequisitosObrigatoriosPendentes(pedidoId) {
  const requisitos = await PedidoRequisito.findAll({
    where: { pedidoId },
    include: [{ model: RequisitoCredito, as: "requisito", where: { obrigatorio: true, ativo: true } }],
  });
  return requisitos.filter((item) => ["PENDENTE", "REJEITADO"].includes(item.estado));
}

function calcularProximoFluxoAprovacao(pedido) {
  const mapeamento = {
    1: { novoStatus: STATUS_PEDIDO.EM_ANALISE, novaEtapa: 2 },
    2: { novoStatus: STATUS_PEDIDO.EM_VALIDACAO, novaEtapa: 3 },
    3: { novoStatus: STATUS_PEDIDO.APROVADO, novaEtapa: 3 }
  };
  return mapeamento[Number(pedido.etapaAtual)] || { novoStatus: pedido.status, novaEtapa: pedido.etapaAtual };
}

// Dicionário dinâmico para evitar ifs gigantescos em cascata
const TEXTOS_FLUXO = {
  REJEITADO: (num, n) => ({ titulo: "Pedido rejeitado", msg: `O pedido ${num} foi rejeitado no nível ${n}.`, acao: "REJEITAR_PEDIDO_CREDITO" }),
  1: (num) => ({ titulo: "Pedido aprovado no nível 1", msg: `O pedido ${num} foi aprovado no nível 1 e segue para o nível 2.`, acao: "APROVAR_PEDIDO_NIVEL_1" }),
  2: (num) => ({ titulo: "Pedido aprovado no nível 2", msg: `O pedido ${num} foi aprovado no nível 2 e segue para o nível 3.`, acao: "APROVAR_PEDIDO_NIVEL_2" }),
  3: (num) => ({ titulo: "Pedido aprovado", msg: `O pedido ${num} foi aprovado em definitivo.`, acao: "APROVAR_PEDIDO_FINAL" })
};

// =========================================================================
// CONTROLLERS
// =========================================================================

async function decidirAprovacao(req, res) {
  try {
    const { pedidoId } = req.params;
    const { nivel, decisao, comentario } = req.body;

    if (!nivel || !decisao || !["APROVADO", "REJEITADO"].includes(decisao)) {
      return res.status(400).json({ message: "Campos obrigatórios em falta ou decisão inválida." });
    }

    const pedido = await PedidoCredito.findOne({
      where: { id: pedidoId, empresaId: req.user.empresaId },
      include: [
        { model: Mutuario, as: "mutuario" },
        { model: User, as: "criador", attributes: ["id", "nome", "email", "role", "ativo"] }
      ]
    });

    if (!pedido) return res.status(404).json({ message: "Pedido de crédito não encontrado." });
    if (Number(nivel) !== Number(pedido.etapaAtual)) {
      return res.status(400).json({ message: `Este pedido está na etapa ${pedido.etapaAtual}. Decisão bloqueada.` });
    }

    const estadosFinais = [STATUS_PEDIDO.APROVADO, STATUS_PEDIDO.REJEITADO, STATUS_PEDIDO.DESEMBOLSADO, STATUS_PEDIDO.ENCERRADO];
    if (estadosFinais.includes(pedido.status)) {
      return res.status(400).json({ message: `Pedido já se encontra num estado final: ${pedido.status}.` });
    }

    if (decisao === "APROVADO" && !podeAprovarPedido(req.user, pedido)) {
      return res.status(403).json({ message: "Sem permissão para aprovar nesta etapa." });
    }
    if (decisao === "REJEITADO" && !podeRejeitarPedido(req.user, pedido)) {
      return res.status(403).json({ message: "Sem permissão para rejeitar nesta etapa." });
    }

    if (decisao === "APROVADO") {
      const requisitosBloqueantes = await verificarRequisitosObrigatoriosPendentes(pedidoId);
      if (requisitosBloqueantes.length > 0) {
        return res.status(400).json({
          message: "Não é possível aprovar. Existem requisitos obrigatórios pendentes ou rejeitados.",
          requisitosBloqueantes: requisitosBloqueantes.map(item => ({
            id: item.id, requisitoId: item.requisitoId, nome: item.requisito?.nome, estado: item.estado, observacoes: item.observacoes
          }))
        });
      }
    }

    // Gerir estados de transição calculados antecipadamente
    const { novoStatus, novaEtapa } = decisao === "REJEITADO" 
      ? { novoStatus: STATUS_PEDIDO.REJEITADO, novaEtapa: pedido.etapaAtual }
      : calcularProximoFluxoAprovacao(pedido);

    if (pedido.status !== novoStatus && !podeTransitarStatus(pedido.status, novoStatus)) {
      return res.status(400).json({ message: `Transição inválida de status: ${pedido.status} -> ${novoStatus}.` });
    }

    // Execução transacional atómica total
    const aprovacao = await sequelize.transaction(async (t) => {
      const [aprovacaoReg, criada] = await AprovacaoPedido.findOrCreate({
        where: { pedidoId, nivel },
        defaults: { aprovadorId: req.user.id, decisao, comentario: comentario || null, dataDecisao: new Date() },
        transaction: t
      });

      if (!criada) {
        if (aprovacaoReg.decisao !== "PENDENTE") throw new Error("DECISION_ALREADY_REGISTERED");
        await aprovacaoReg.update({ aprovadorId: req.user.id, decisao, comentario: comentario || null, dataDecisao: new Date() }, { transaction: t });
      }

      await pedido.update({ status: novoStatus, etapaAtual: novaEtapa }, { transaction: t });

      const configTexto = decisao === "REJEITADO" ? TEXTOS_FLUXO.REJEITADO(pedido.numeroPedido, nivel) : TEXTOS_FLUXO[Number(nivel)](pedido.numeroPedido);

      await criarNotificacao({
        userId: pedido.createdBy, pedidoId: pedido.id, titulo: configTexto.titulo, mensagem: configTexto.msg, tipo: decisao === "REJEITADO" ? "REJEICAO" : "APROVACAO"
      }, t);

      await registrarLogAuditoria({
        userId: req.user.id, acao: configTexto.acao, entidade: "PedidoCredito", entidadeId: pedido.id,
        descricao: `Pedido ${pedido.numeroPedido} processado com decisão: ${decisao} no nível ${nivel}.`
      }, { transaction: t });

      return aprovacaoReg;
    });

    return res.status(200).json({ message: "Decisão registada com sucesso.", aprovacao, pedido });
  } catch (error) {
    if (error.message === "DECISION_ALREADY_REGISTERED") {
      return res.status(409).json({ message: "Já existe uma decisão registada para este nível." });
    }
    console.error("[DecidirAprovacao Error]:", error);
    return res.status(500).json({ message: "Erro interno ao registar decisão de aprovação." });
  }
}

async function getMinhasAprovacoes(req, res) {
  try {
    const aprovacoes = await AprovacaoPedido.findAll({
      where: { aprovadorId: req.user.id },
      include: [{ model: PedidoCredito, as: "pedido", where: { empresaId: req.user.empresaId }, required: true }],
      order: [["created_at", "DESC"]], // Normalizado para camelCase conforme discutimos!
    });
    return res.status(200).json(aprovacoes);
  } catch (error) {
    console.error("[GetMinhasAprovacoes Error]:", error);
    return res.status(500).json({ message: "Erro interno ao listar minhas aprovações." });
  }
}

async function getAprovacoesByPedido(req, res) {
  try {
    const pedido = await PedidoCredito.findOne({
      where: { id: req.params.pedidoId, empresaId: req.user.empresaId },
      include: [{ model: Mutuario, as: "mutuario" }],
    });
    if (!pedido) return res.status(404).json({ message: "Pedido de crédito não encontrado." });

    const aprovacoes = await AprovacaoPedido.findAll({
      where: { pedidoId: pedido.id },
      include: [{ model: User, as: "aprovador", attributes: ["id", "nome", "email", "role", "ativo"] }],
      order: [["nivel", "ASC"]],
    });

    return res.status(200).json({ pedido, aprovacoes });
  } catch (error) {
    console.error("[GetAprovacoesByPedido Error]:", error);
    return res.status(500).json({ message: "Erro interno ao listar aprovações do pedido." });
  }
}

async function getAllAprovacoes(req, res) {
  try {
    const aprovacoes = await AprovacaoPedido.findAll({
      include: [
        { model: PedidoCredito, as: "pedido", where: { empresaId: req.user.empresaId }, required: true, include: [{ model: Mutuario, as: "mutuario", required: false }] },
        { model: User, as: "aprovador", attributes: ["id", "nome", "email", "role", "ativo"] }
      ],
      order: [["dataDecisao", "DESC"]],
    });
    return res.status(200).json(aprovacoes);
  } catch (error) {
    console.error("[GetAllAprovacoes Error]:", error);
    return res.status(500).json({ message: "Erro interno ao listar todas as aprovações." });
  }
}

module.exports = { decidirAprovacao, getAprovacoesByPedido, getMinhasAprovacoes, getAllAprovacoes };