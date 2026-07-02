const path = require("path");
const {
  Mutuario,
  PedidoCredito,
  PedidoRequisito,
  RequisitoCredito,
  Desembolso,
  Reembolso,
  User,
  Anexo,
} = require("../models");
const CreditoService = require("../services/credito.service");
const registrarLogAuditoria = require("../utils/logAuditoria");
const { STATUS_PEDIDO } = require("../utils/regrasPedido");
const calcularPrestacao = require("../utils/calCredito");

/*
  ==========================================================
  FUNÇÃO AUXILIAR PARA GARANTIR QUE O UTILIZADOR É USER
  ==========================================================
*/
function garantirPerfilUser(req, res) {
  if (!req.user || req.user.role !== "USER" && req.user.role !== "MUTUARIO") {
    res.status(403).json({
      message: "Acesso permitido apenas para o portal do mutuário.",
    });
    return false;
  }

  return true;
}

/*
  ==========================================================
  FUNÇÃO AUXILIAR PARA OBTER O MUTUÁRIO DO USER AUTENTICADO
  ==========================================================
*/
async function obterMeuMutuario(userId) {
  const mutuario = await Mutuario.findOne({
    where: { userId },
  });

  return mutuario;
}

/*
  ==========================================================
  FUNÇÃO AUXILIAR PARA GERAR NÚMERO DO PEDIDO
  ==========================================================
*/
function generateNumeroPedido() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const random = Math.floor(100000 + Math.random() * 900000);

  return `PED-${year}${month}${day}-${random}`;
}

/*
  ==========================================================
  OBTÉM O MUTUÁRIO DO UTILIZADOR AUTENTICADO
  ==========================================================
*/
async function getMeuMutuario(req, res) {
  try {
    if (!garantirPerfilUser(req, res)) return;

    const mutuario = await Mutuario.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
      ],
    });

    if (!mutuario) {
      return res.status(404).json({
        message: "Não existe mutuário associado a este utilizador.",
      });
    }

    return res.status(200).json(mutuario);
  } catch (error) {
    console.error("Erro ao buscar meu mutuário:", error);

    return res.status(500).json({
      message: "Erro interno ao buscar dados do mutuário.",
      error: error.message,
    });
  }
}

async function updateMeuMutuario(req, res) {
  try {
    if (!garantirPerfilUser(req, res)) return;

    const mutuario = await obterMeuMutuario(req.user.id);

    if (!mutuario) {
      return res.status(404).json({
        message: "Não existe mutuário associado a este utilizador.",
      });
    }

    const {
      nomeCompleto,
      telefone,
      provincia,
      distrito,
      localResidencia,
      email,
    } = req.body;

    if (!nomeCompleto || !nomeCompleto.trim()) {
      return res.status(400).json({
        message: "O nome completo é obrigatório.",
      });
    }

    await mutuario.update({
      nomeCompleto: nomeCompleto.trim(),
      telefone: telefone || null,
      provincia: provincia || null,
      distrito: distrito || null,
      localResidencia: localResidencia || null,
      email: email || null,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ATUALIZAR_MEU_MUTUARIO",
      entidade: "Mutuario",
      entidadeId: mutuario.id,
      descricao: `Mutuário ${mutuario.codigoMutuario} atualizado pelo próprio usuário.`,
    });

    return res.status(200).json(mutuario);
  } catch (error) {
    console.error("Erro ao atualizar meu mutuário:", error);

    return res.status(500).json({
      message: "Erro interno ao atualizar dados do mutuário.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR MEUS PEDIDOS
  ==========================================================
*/
async function getMeusPedidos(req, res) {
  try {
    if (!garantirPerfilUser(req, res)) return;

    const mutuario = await obterMeuMutuario(req.user.id);

    if (!mutuario) {
      return res.status(404).json({
        message: "Não existe mutuário associado a este utilizador.",
      });
    }

    const pedidos = await PedidoCredito.findAll({
      where: {
        mutuarioId: mutuario.id,
      },
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
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json({
      mutuario: {
        id: mutuario.id,
        codigoMutuario: mutuario.codigoMutuario,
        nomeCompleto: mutuario.nomeCompleto,
      },
      total: pedidos.length,
      pedidos,
    });
  } catch (error) {
    console.error("Erro ao listar meus pedidos:", error);

    return res.status(500).json({
      message: "Erro interno ao listar pedidos do mutuário.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  BUSCAR UM DOS MEUS PEDIDOS POR ID
  ==========================================================
*/
async function getMeuPedidoById(req, res) {
  try {
    if (!garantirPerfilUser(req, res)) return;

    const { id } = req.params;

    const mutuario = await obterMeuMutuario(req.user.id);

    if (!mutuario) {
      return res.status(404).json({
        message: "Não existe mutuário associado a este utilizador.",
      });
    }

    const pedido = await PedidoCredito.findOne({
      where: {
        id,
        mutuarioId: mutuario.id,
      },
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
          association: "aprovacoes",
          required: false,
        },
        {
          association: "requisitosPedido",
          required: false,
          include: [
            {
              association: "requisito",
            },
            {
              association: "anexos",
              required: false,
            },
          ],
        },
      ],
    });

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido não encontrado para este mutuário.",
      });
    }

    return res.status(200).json(pedido);
  } catch (error) {
    console.error("Erro ao buscar meu pedido:", error);

    return res.status(500).json({
      message: "Erro interno ao buscar pedido do mutuário.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  CRIAR MEU PRÓPRIO PEDIDO
  ==========================================================
  Regra:
  - só USER
  - mutuarioId é resolvido pelo backend
  - USER não define status nem etapa
*/
async function createMeuPedido(req, res) {
  try {
    if (!garantirPerfilUser(req, res)) return;

    const {
      valorSolicitado,
      prazo,
      finalidade,
      pacoteFinanciamento,
      prazoAvaliacao,
      prazoValidacao,
      observacoes,
    } = req.body;

    if (!valorSolicitado || !finalidade) {
      return res.status(400).json({
        message: "valorSolicitado e finalidade são obrigatórios.",
      });
    }

    if (Number(valorSolicitado) <= 0) {
      return res.status(400).json({
        message: "valorSolicitado deve ser maior que zero.",
      });
    }

    if (!prazo || Number(prazo) <= 0) {
      return res.status(400).json({
        message: "O prazo é obrigatório e deve ser maior que zero.",
      });
    }

    const mutuario = await obterMeuMutuario(req.user.id);

    if (!mutuario) {
      return res.status(404).json({
        message: "Não existe mutuário associado a este utilizador.",
      });
    }

    const dataSubmissao = new Date();

    // Prazos padrão: 7 dias (não podem ser alterados)
    const prazoAvaliacaoDate = new Date(dataSubmissao);
    prazoAvaliacaoDate.setDate(prazoAvaliacaoDate.getDate() + 7);

    const prazoValidacaoDate = new Date(dataSubmissao);
    prazoValidacaoDate.setDate(prazoValidacaoDate.getDate() + 7);

    const taxa = 18;

    const prestacao = calcularPrestacao(
      Number(valorSolicitado),
      taxa,
      Number(prazo)
    );

    const montanteTotal = prestacao * Number(prazo);

    const jurosTotal = montanteTotal - Number(valorSolicitado);

    const pedido = await PedidoCredito.create({
      numeroPedido: generateNumeroPedido(),
      mutuarioId: mutuario.id,
      valorSolicitado,
      finalidade,
      pacoteFinanciamento: pacoteFinanciamento || null,

      prazo,
      taxa,
      prestacao,
      jurosTotal,
      montanteTotal,

      status: STATUS_PEDIDO.SUBMETIDO,
      etapaAtual: 1,
      dataSubmissao: new Date(),
      prazoAvaliacao: prazoAvaliacao || null,
      prazoValidacao: prazoValidacao || null,
      observacoes: observacoes || null,
      createdBy: req.user.id,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "CRIAR_MEU_PEDIDO_CREDITO",
      entidade: "PedidoCredito",
      entidadeId: pedido.id,
      descricao: `Pedido ${pedido.numeroPedido} criado pelo próprio mutuário autenticado.`,
    });

    return res.status(201).json({
      message: "Pedido criado com sucesso.",
      pedido,
    });
  } catch (error) {
    console.error("Erro ao criar meu pedido:", error);

    return res.status(500).json({
      message: "Erro interno ao criar pedido do mutuário.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  EXTRATO DO MEU PEDIDO
  ==========================================================
  Regra:
  - só USER
  - só do seu próprio pedido
  - devolve totais + movimentos
*/
async function getMeuExtratoPedido(req, res) {
  try {
    if (!garantirPerfilUser(req, res)) return;

    const { id } = req.params;

    const mutuario = await obterMeuMutuario(req.user.id);

    if (!mutuario) {
      return res.status(404).json({
        message: "Não existe mutuário associado a este utilizador.",
      });
    }

    const pedido = await PedidoCredito.findOne({
      where: {
        id,
        mutuarioId: mutuario.id,
      },
      include: [
        {
          model: Mutuario,
          as: "mutuario",
        },
      ],
    });

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido não encontrado para este mutuário.",
      });
    }

    const desembolsos = await Desembolso.findAll({
      where: { pedidoId: pedido.id },
      order: [["id", "ASC"]],
    });

    const reembolsos = await Reembolso.findAll({
      where: { pedidoId: pedido.id },
      order: [["id", "ASC"]],
    });

    const totalDesembolsado = desembolsos.reduce((total, item) => {
      return total + Number(item.valorDesembolsado || 0);
    }, 0);

    const totalReembolsado = reembolsos.reduce((total, item) => {
      return total + Number(item.valorReembolsado || 0);
    }, 0);

    const saldoEmAberto = totalDesembolsado - totalReembolsado;

    return res.status(200).json({
      pedido: {
        id: pedido.id,
        numeroPedido: pedido.numeroPedido,
        status: pedido.status,
        etapaAtual: pedido.etapaAtual,
        valorSolicitado: pedido.valorSolicitado,
        finalidade: pedido.finalidade,
        pacoteFinanciamento: pedido.pacoteFinanciamento,
        dataSubmissao: pedido.dataSubmissao,
        observacoes: pedido.observacoes,
      },
      mutuario: {
        id: pedido.mutuario?.id,
        codigoMutuario: pedido.mutuario?.codigoMutuario,
        nomeCompleto: pedido.mutuario?.nomeCompleto,
      },
      resumoFinanceiro: {
        totalDesembolsado,
        totalReembolsado,
        saldoEmAberto,
      },
      desembolsos,
      reembolsos,
    });
  } catch (error) {
    console.error("Erro ao gerar extrato do meu pedido:", error);

    return res.status(500).json({
      message: "Erro interno ao gerar extrato do pedido.",
      error: error.message,
    });
  }
}

async function anexarReqPedido(req, res) {
  try {
    const anexo = await Anexo.create({
      pedidoRequisitoId: req.params.id,
      nome: req.file.originalname,
      arquivo: req.file.filename,
      mimeType: req.file.mimetype,
      tamanho: req.file.size,
      userId: req.user.id,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "UPLOAD_ANEXO_REQUISITO_CREDITO",
      entidade: "PedidoRequisito",
      entidadeId: req.params.id,
      descricao: `Documento ${req.file.originalname} enviado.`,
    });

    return res.status(201).json(anexo);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao enviar documento",
    });
  }
}

async function getMeuReqAnexos(req, res) {
  try {
    const anexos = await Anexo.findAll({
      where: {
        pedidoRequisitoId: req.params.id,
      },
      order: [["created_at", "DESC"]],
    });

    return res.json(anexos);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao listar anexos"
    });
  }
}

/*
==========================================================
LISTAR MEUS CRÉDITOS
==========================================================
*/
async function getMeusCreditos(req, res) {
  try {
    if (!garantirPerfilUser(req, res)) return;

    const mutuario = await obterMeuMutuario(req.user.id);

    if (!mutuario) {
      return res.status(404).json({
        message: "Mutuário não encontrado.",
      });
    }

    const creditos =
      await CreditoService.listarMeusCreditos(
        mutuario.id
      );

    return res.status(200).json(creditos);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Erro ao listar créditos.",
      error: error.message,
    });

  }
}

/*
==========================================================
DETALHE DO MEU CRÉDITO
==========================================================
*/
async function getMeuCreditoById(req, res) {
  try {
    if (!garantirPerfilUser(req, res)) return;

    const mutuario = await obterMeuMutuario(req.user.id);

    if (!mutuario) {
      return res.status(404).json({
        message: "Mutuário não encontrado.",
      });
    }

    const credito =
      await CreditoService.buscarMeuCredito(
        req.params.id,
        mutuario.id
      );

    if (!credito) {
      return res.status(404).json({
        message: "Crédito não encontrado.",
      });
    }

    return res.status(200).json(credito);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Erro ao obter crédito.",
      error: error.message,
    });

  }
}


module.exports = {
  getMeuMutuario,
  updateMeuMutuario,
  getMeusPedidos,
  getMeuPedidoById,
  createMeuPedido,
  getMeuExtratoPedido,
  anexarReqPedido,
  getMeuReqAnexos,
  getMeusCreditos,
  getMeuCreditoById,
};
