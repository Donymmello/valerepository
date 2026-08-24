const path = require("path");
const { Op } = require("sequelize");
const {
  Mutuario,
  PedidoCredito,
  PedidoRequisito,
  RequisitoCredito,
  Desembolso,
  Reembolso,
  Credito,
  ParcelaPagamento,
  User,
  Anexo,
  Empresa,
} = require("../models");
const CreditoService = require("../services/credito.service");
const registrarLogAuditoria = require("../utils/logAuditoria");
const { STATUS_PEDIDO } = require("../utils/regrasPedido");
const calcularPrestacao = require("../utils/calCredito");
const { notificarStaffDaEmpresa } = require("../services/notificacaoInterna.service");

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
      // Campos de identificação (KYC) — só chegam a ser gravados se o
      // mutuário ainda não os tiver preenchido (ver bloco abaixo). Isto
      // permite "Completar Perfil" sem abrir a porta a alterar um
      // documento/NUIT já declarado por conta própria.
      documentoTipo,
      documentoNumero,
      nuit,
      dataNascimento,
    } = req.body;

    if (!nomeCompleto || !nomeCompleto.trim()) {
      return res.status(400).json({
        message: "O nome completo é obrigatório.",
      });
    }

    const dadosAtualizacao = {
      nomeCompleto: nomeCompleto.trim(),
      telefone: telefone || null,
      provincia: provincia || null,
      distrito: distrito || null,
      localResidencia: localResidencia || null,
      email: email || null,
    };

    // Completar perfil: cada campo de KYC só pode ser definido uma vez.
    // Depois de preenchido, alterações têm de passar pelo backoffice.
    const querDefinirDocumento = !mutuario.documentoTipo && documentoTipo;
    const querDefinirNumero = !mutuario.documentoNumero && documentoNumero;
    const querDefinirNuit = !mutuario.nuit && nuit;

    if (querDefinirNumero || querDefinirNuit) {
      const condicoesDuplicado = [];
      if (querDefinirNuit) condicoesDuplicado.push({ nuit });
      if (querDefinirNumero) condicoesDuplicado.push({ documentoNumero });

      const duplicado = await Mutuario.findOne({
        where: { [Op.or]: condicoesDuplicado, id: { [Op.ne]: mutuario.id } },
        attributes: ["id", "nuit", "documentoNumero"],
      });

      if (duplicado) {
        const msg = querDefinirNuit && duplicado.nuit === nuit
          ? "Já existe um mutuário com este NUIT."
          : "Já existe um mutuário com este número de documento.";
        return res.status(409).json({ message: msg });
      }
    }

    if (querDefinirDocumento) dadosAtualizacao.documentoTipo = documentoTipo;
    if (querDefinirNumero) dadosAtualizacao.documentoNumero = documentoNumero;
    if (querDefinirNuit) dadosAtualizacao.nuit = nuit;
    if (!mutuario.dataNascimento && dataNascimento) dadosAtualizacao.dataNascimento = dataNascimento;

    await mutuario.update(dadosAtualizacao);

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

    // O registo pede só o essencial, mas antes de pedir crédito a
    // identificação (KYC) tem de estar completa — é o ponto em que a
    // relação de crédito de facto começa (ver nota em RECUPERACAO_BD.md).
    if (!mutuario.documentoTipo || !mutuario.documentoNumero || !mutuario.nuit || !mutuario.dataNascimento) {
      return res.status(400).json({
        message: "Complete o seu perfil (documento, NUIT e data de nascimento) antes de submeter um pedido de crédito.",
        perfilIncompleto: true,
      });
    }

    // Estilo Txuna: sem juro de mora, mas bloqueia crédito novo enquanto
    // houver um crédito em incumprimento por regularizar (ver secção 20/22
    // do RECUPERACAO_BD.md).
    const temCreditoEmIncumprimento = await CreditoService.mutuarioTemCreditoEmIncumprimento(
      mutuario.id,
      req.user.empresaId
    );

    if (temCreditoEmIncumprimento) {
      return res.status(403).json({
        message:
          "Não é possível submeter um novo pedido enquanto tiver um crédito em incumprimento. Regularize o pagamento em atraso para voltar a pedir crédito.",
        creditoEmIncumprimento: true,
      });
    }

    const dataSubmissao = new Date();

    // Prazos padrão: 7 dias (não podem ser alterados)
    const prazoAvaliacaoDate = new Date(dataSubmissao);
    prazoAvaliacaoDate.setDate(prazoAvaliacaoDate.getDate() + 7);

    const prazoValidacaoDate = new Date(dataSubmissao);
    prazoValidacaoDate.setDate(prazoValidacaoDate.getDate() + 7);

    // Estimativa inicial: taxa mínima da empresa (mesma lógica usada em
    // pedidoCredito.controller.js). A taxa final é definida na aprovação
    // de nível 1 — ver aprovacaoPedido.controller.js.
    const empresa = await Empresa.findByPk(req.user.empresaId, {
      attributes: ["taxaJurosMin"],
    });
    const taxa = Number(empresa?.taxaJurosMin ?? 18);

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
      empresaId: req.user.empresaId,
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

    // Avisa o staff interno — mesmo alerta que já existia quando um
    // funcionário cria o pedido em nome do mutuário (ver
    // pedidoCredito.controller.js), só que este é o caminho mais comum:
    // o próprio mutuário a submeter pelo portal.
    await notificarStaffDaEmpresa({
      empresaId: req.user.empresaId,
      pedidoId: pedido.id,
      titulo: "Novo Pedido de Crédito Criado",
      mensagem: `Novo pedido de crédito ${pedido.numeroPedido} foi criado. Prazo de avaliação: 7 dias.`,
      tipo: "PEDIDO_CRIADO",
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
        {
          model: Desembolso,
          as: "desembolsos",
          required: false,
        },
        {
          model: Credito,
          as: "creditos",
          required: false,
          include: [
            {
              model: ParcelaPagamento,
              as: "parcelas",
              required: false,
            },
            {
              model: Reembolso,
              as: "reembolsos",
              required: false,
            },
          ],
        },
      ],
      order: [
        [{ model: Credito, as: "creditos" }, { model: ParcelaPagamento, as: "parcelas" }, "numeroParcela", "ASC"],
      ],
    });

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido não encontrado para este mutuário.",
      });
    }

    const num = (v) => Number(v || 0);
    const creditos = pedido.creditos || [];

    const totalDesembolsado = (pedido.desembolsos || []).reduce(
      (total, item) => total + num(item.valorDesembolsado),
      0
    );
    const totalReembolsado = creditos.reduce((t, c) => t + num(c.totalPago), 0);
    const montanteTotal = creditos.reduce((t, c) => t + num(c.montanteTotal), 0);
    const saldoEmDivida = creditos.length
      ? creditos.reduce((t, c) => t + num(c.saldoAtual), 0)
      : totalDesembolsado - totalReembolsado;

    return res.status(200).json({
      pedido,
      mutuario: {
        id: pedido.mutuario?.id,
        codigoMutuario: pedido.mutuario?.codigoMutuario,
        nomeCompleto: pedido.mutuario?.nomeCompleto,
      },
      resumoFinanceiro: {
        totalDesembolsado,
        totalReembolsado,
        montanteTotal,
        saldoEmDivida,
      },
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

    // Avisa o staff interno para validar o documento acabado de chegar.
    const pedidoRequisito = await PedidoRequisito.findByPk(req.params.id, {
      include: [
        { model: PedidoCredito, as: "pedido" },
        { model: RequisitoCredito, as: "requisito" },
      ],
    });
    if (pedidoRequisito?.pedido) {
      await notificarStaffDaEmpresa({
        empresaId: pedidoRequisito.pedido.empresaId,
        pedidoId: pedidoRequisito.pedido.id,
        titulo: "Documento enviado pelo mutuário",
        mensagem: `O mutuário enviou o documento "${pedidoRequisito.requisito?.nome || "requisito"}" para o pedido ${pedidoRequisito.pedido.numeroPedido}. Aguarda validação.`,
        tipo: "REQUISITO",
      });
    }

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
