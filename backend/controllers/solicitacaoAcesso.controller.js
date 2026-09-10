const { SolicitacaoAcesso } = require("../models");
const { obterLimitesPlano, NOME_MARKETING_PLANO, PLANOS_VALIDOS } = require("../config/planos");
const { sendInstrucoesPagamentoEmail, sendNotificacaoPedidoPlanoDono } = require("../utils/emailService");

const ESTADOS_VALIDOS = ["PENDENTE", "CONTACTADO", "CONVERTIDO", "REJEITADO"];
const CICLOS_VALIDOS = ["MENSAL", "ANUAL"];

/*
  ==========================================================
  CRIAR SOLICITAÇÃO DE ACESSO (PÚBLICO)
  ==========================================================
  Chamado a partir da landing page (TrialSection.jsx). Não autentica nada
  nem cria Empresa/User, só regista o pedido para o SUPERADMIN rever
  manualmente.

  Se vier "plano" (pedido de plano pago com pagamento manual, o caso
  comum hoje), o valor é sempre calculado aqui a partir de
  config/planos.js (nunca confiado no cliente), e o pedido dispara dois
  emails: instruções de pagamento para o cliente, e uma notificação para
  o dono da plataforma. Sem "plano" (pedido antigo "prefiro falar com
  alguém"), mantém o comportamento de sempre: só regista, sem emails.
*/
async function criarSolicitacaoAcesso(req, res) {
  try {
    const { nomeEmpresa, nomeContacto, email, telefone, mensagem, plano, cicloFaturacao } = req.body;

    if (!nomeEmpresa || !nomeContacto || !email) {
      return res.status(400).json({
        message: "nomeEmpresa, nomeContacto e email são obrigatórios.",
      });
    }

    const temPlano = plano !== undefined && plano !== null && plano !== "";
    if (temPlano && !PLANOS_VALIDOS.includes(plano)) {
      return res.status(400).json({
        message: "Plano inválido.",
        planosValidos: PLANOS_VALIDOS,
      });
    }

    const cicloFinal = CICLOS_VALIDOS.includes(cicloFaturacao) ? cicloFaturacao : "MENSAL";
    const valorEstimado = temPlano
      ? obterLimitesPlano(plano).precoMensal * (cicloFinal === "ANUAL" ? 10 : 1)
      : null;

    const solicitacao = await SolicitacaoAcesso.create({
      nomeEmpresa,
      nomeContacto,
      email,
      telefone: telefone || null,
      mensagem: mensagem || null,
      plano: temPlano ? plano : null,
      cicloFaturacao: temPlano ? cicloFinal : null,
      valorEstimado,
    });

    if (temPlano) {
      const referencia = `SOL-${String(solicitacao.id).padStart(6, "0")}`;
      const nomePlano = NOME_MARKETING_PLANO[plano] || plano;

      // Best-effort: o pedido já está gravado, uma falha a enviar email
      // não deve impedir o 201 (o SUPERADMIN vê o pedido na lista de
      // qualquer forma e pode contactar manualmente).
      await sendInstrucoesPagamentoEmail(email, {
        nomeContacto,
        nomePlano,
        cicloFaturacao: cicloFinal,
        valor: valorEstimado,
        referencia,
      }).catch((error) => console.error("Erro ao enviar email de instruções de pagamento:", error));

      await sendNotificacaoPedidoPlanoDono({
        nomeEmpresa,
        nomeContacto,
        email,
        telefone,
        nomePlano,
        cicloFaturacao: cicloFinal,
        valor: valorEstimado,
        referencia,
      }).catch((error) => console.error("Erro ao enviar notificação de pedido de plano:", error));
    }

    return res.status(201).json({
      message: temPlano
        ? "Pedido recebido! Vais receber um email com os dados para pagamento em breve."
        : "Pedido recebido com sucesso. Vamos entrar em contacto em breve.",
      id: solicitacao.id,
    });
  } catch (error) {
    console.error("Erro ao criar solicitação de acesso:", error);
    return res.status(500).json({
      message: "Erro interno ao registar o pedido.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR SOLICITAÇÕES DE ACESSO (SUPERADMIN)
  ==========================================================
*/
async function listarSolicitacoesAcesso(req, res) {
  try {
    const solicitacoes = await SolicitacaoAcesso.findAll({
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(solicitacoes);
  } catch (error) {
    console.error("Erro ao listar solicitações de acesso:", error);
    return res.status(500).json({
      message: "Erro interno ao listar pedidos de acesso.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  ATUALIZAR ESTADO DE UMA SOLICITAÇÃO (SUPERADMIN)
  ==========================================================
  Ex: marcar como CONTACTADO enquanto negoceias, CONVERTIDO
  depois de criares a Empresa (bootstrap-admin), ou REJEITADO.
*/
async function atualizarSolicitacaoAcesso(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        message: "Estado inválido.",
        estadosValidos: ESTADOS_VALIDOS,
      });
    }

    const solicitacao = await SolicitacaoAcesso.findByPk(id);

    if (!solicitacao) {
      return res.status(404).json({ message: "Pedido de acesso não encontrado." });
    }

    await solicitacao.update({ estado });

    return res.status(200).json({ message: "Pedido atualizado.", solicitacao });
  } catch (error) {
    console.error("Erro ao atualizar solicitação de acesso:", error);
    return res.status(500).json({
      message: "Erro interno ao atualizar pedido de acesso.",
      error: error.message,
    });
  }
}

module.exports = {
  criarSolicitacaoAcesso,
  listarSolicitacoesAcesso,
  atualizarSolicitacaoAcesso,
};
