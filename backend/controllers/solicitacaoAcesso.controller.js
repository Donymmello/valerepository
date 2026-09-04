const { SolicitacaoAcesso } = require("../models");

const ESTADOS_VALIDOS = ["PENDENTE", "CONTACTADO", "CONVERTIDO", "REJEITADO"];

/*
  ==========================================================
  CRIAR SOLICITAÇÃO DE ACESSO (PÚBLICO)
  ==========================================================
  Chamado a partir do formulário "Quero usar a plataforma" da
  landing page. Não autentica nada nem cria Empresa/User, só
  regista o interesse para o SUPERADMIN rever manualmente.
*/
async function criarSolicitacaoAcesso(req, res) {
  try {
    const { nomeEmpresa, nomeContacto, email, telefone, mensagem } = req.body;

    if (!nomeEmpresa || !nomeContacto || !email) {
      return res.status(400).json({
        message: "nomeEmpresa, nomeContacto e email são obrigatórios.",
      });
    }

    const solicitacao = await SolicitacaoAcesso.create({
      nomeEmpresa,
      nomeContacto,
      email,
      telefone: telefone || null,
      mensagem: mensagem || null,
    });

    return res.status(201).json({
      message: "Pedido recebido com sucesso. Vamos entrar em contacto em breve.",
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
