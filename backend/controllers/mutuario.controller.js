const { Mutuario, User, PedidoCredito, sequelize } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const { generateCodigoMutuario } = require("../utils/generateCode");
const { Op } = require("sequelize");

// =========================================================================
// HELPERS DE VALIDAÇÃO (Centraliza a inteligência de integridade)
// =========================================================================

/**
 * Valida se o documento ou utilizador já estão em uso por outro mutuário.
 * Lança erros específicos capturados pelo controlador.
 */
async function validarIntegridadeMutuario({ documentoNumero, userId, mutuarioId = null }) {
  if (documentoNumero) {
    const conflitoDoc = await Mutuario.findOne({
      where: {
        documentoNumero,
        ...(mutuarioId && { id: { [Op.ne]: mutuarioId } }) // Ignora o próprio ID na atualização
      },
      attributes: ['id']
    });
    if (conflitoDoc) throw new Error("DUPLICATE_DOCUMENT");
  }

  if (userId) {
    const user = await User.findByPk(userId, { attributes: ['id', 'role'] });
    if (!user) throw new Error("USER_NOT_FOUND");
    if (user.role !== "USER") throw new Error("INVALID_ROLE");

    const conflitoUser = await Mutuario.findOne({
      where: {
        userId,
        ...(mutuarioId && { id: { [Op.ne]: mutuarioId } })
      },
      attributes: ['id']
    });
    if (conflitoUser) throw new Error("DUPLICATE_USER_ASSIGNMENT");
  }
}

/**
 * Mapeador central de erros de negócio para respostas HTTP
 */
function tratarErrosNegocio(res, error, mensagemPadrao) {
  const mapeamento = {
    "DUPLICATE_DOCUMENT": { status: 409, msg: "Já existe um mutuário com este número de documento." },
    "USER_NOT_FOUND": { status: 404, msg: "Utilizador associado não encontrado." },
    "INVALID_ROLE": { status: 400, msg: "Apenas utilizadores com role USER podem ser associados a mutuário." },
    "DUPLICATE_USER_ASSIGNMENT": { status: 409, msg: "Este utilizador já está associado a outro mutuário." }
  };

  const erroConhecido = mapeamento[error.message];
  if (erroConhecido) {
    return res.status(erroConhecido.status).json({ message: erroConhecido.msg });
  }

  console.error(`[Error]: ${mensagemPadrao}`, error);
  return res.status(500).json({ message: mensagemPadrao });
}

// =========================================================================
// CONTROLLERS
// =========================================================================

/**
 * CRIAR MUTUÁRIO
 */
async function createMutuario(req, res) {
  try {
    const { nomeCompleto, documentoTipo, documentoNumero, dataNascimento, provincia, distrito, localResidencia, telefone, email, userId } = req.body;

    if (!nomeCompleto) {
      return res.status(400).json({ message: "O campo nomeCompleto é obrigatório." });
    }

    // Executa validações centralizadas
    await validarIntegridadeMutuario({ documentoNumero, userId });

    // Execução Atómica com isolamento de transação
    const mutuario = await sequelize.transaction(async (t) => {
      const codigoMutuario = await generateCodigoMutuario();

      const novoMutuario = await Mutuario.create({
        codigoMutuario,
        nomeCompleto,
        documentoTipo: documentoTipo || null,
        documentoNumero: documentoNumero || null,
        dataNascimento: dataNascimento || null,
        provincia: provincia || null,
        distrito: distrito || null,
        localResidencia: localResidencia || null,
        telefone: telefone || null,
        email: email || null,
        userId: userId || null,
      }, { transaction: t });

      await registrarLogAuditoria({
        userId: req.user.id,
        acao: "CRIAR_MUTUARIO",
        entidade: "Mutuario",
        entidadeId: novoMutuario.id,
        descricao: `Mutuário ${novoMutuario.nomeCompleto} criado no sistema.`,
      }, { transaction: t });

      return novoMutuario;
    });

    return res.status(201).json({ message: "Mutuário criado com sucesso.", mutuario });
  } catch (error) {
    return tratarErrosNegocio(res, error, "Erro interno ao criar mutuário.");
  }
}

/**
 * LISTAR TODOS OS MUTUÁRIOS
 */
async function getAllMutuarios(req, res) {
  try {
    const mutuarios = await Mutuario.findAll({
      include: [{ model: User, as: "user", required: false, attributes: ["id", "nome", "email", "role", "ativo"] }],
      order: [["id", "DESC"]],
    });
    return res.status(200).json(mutuarios);
  } catch (error) {
    console.error("[GetAllMutuarios Error]:", error);
    return res.status(500).json({ message: "Erro interno ao listar mutuários." });
  }
}

/**
 * BUSCAR MUTUÁRIO POR ID
 */
async function getMutuarioById(req, res) {
  try {
    const mutuario = await Mutuario.findByPk(req.params.id, {
      include: [
        { model: User, as: "user", required: false, attributes: ["id", "nome", "email", "role", "ativo"] },
        { model: PedidoCredito, as: "pedidosCredito", required: false },
      ],
    });

    if (!mutuario) return res.status(404).json({ message: "Mutuário não encontrado." });
    return res.status(200).json(mutuario);
  } catch (error) {
    console.error("[GetMutuarioById Error]:", error);
    return res.status(500).json({ message: "Erro interno ao buscar mutuário." });
  }
}

/**
 * ATUALIZAR MUTUÁRIO
 */
async function updateMutuario(req, res) {
  try {
    const { id } = req.params;
    const mutuario = await Mutuario.findByPk(id);
    if (!mutuario) return res.status(404).json({ message: "Mutuário não encontrado." });

    const { nomeCompleto, documentoTipo, documentoNumero, dataNascimento, provincia, distrito, localResidencia, telefone, email, userId } = req.body;

    // Corre as mesmas validações, mas passa o ID atual para evitar falsos positivos de duplicação
    await validarIntegridadeMutuario({ 
      documentoNumero: documentoNumero !== undefined ? documentoNumero : mutuario.documentoNumero, 
      userId: userId !== undefined ? userId : mutuario.userId, 
      mutuarioId: mutuario.id 
    });

    await mutuario.update({
      nomeCompleto: nomeCompleto ?? mutuario.nomeCompleto,
      documentoTipo: documentoTipo ?? mutuario.documentoTipo,
      documentoNumero: documentoNumero ?? mutuario.documentoNumero,
      dataNascimento: dataNascimento ?? mutuario.dataNascimento,
      provincia: provincia ?? mutuario.provincia,
      distrito: distrito ?? mutuario.distrito,
      localResidencia: localResidencia ?? mutuario.localResidencia,
      telefone: telefone ?? mutuario.telefone,
      email: email ?? mutuario.email,
      userId: userId ?? mutuario.userId,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ATUALIZAR_MUTUARIO",
      entidade: "Mutuario",
      entidadeId: mutuario.id,
      descricao: `Mutuário ${mutuario.nomeCompleto} atualizado no sistema.`,
    });

    return res.status(200).json({ message: "Mutuário updated com sucesso.", mutuario });
  } catch (error) {
    return tratarErrosNegocio(res, error, "Erro interno ao atualizar mutuário.");
  }
}

/**
 * REMOVER MUTUÁRIO
 */
async function deleteMutuario(req, res) {
  try {
    const mutuario = await Mutuario.findByPk(req.params.id);
    if (!mutuario) return res.status(404).json({ message: "Mutuário não encontrado." });

    await mutuario.destroy();

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "REMOVER_MUTUARIO",
      entidade: "Mutuario",
      entidadeId: mutuario.id,
      descricao: `Mutuário ${mutuario.nomeCompleto} removido do sistema.`,
    });

    return res.status(200).json({ message: "Mutuário removido com sucesso." });
  } catch (error) {
    console.error("[DeleteMutuario Error]:", error);
    return res.status(500).json({ message: "Erro interno ao remover mutuário." });
  }
}

module.exports = {
  createMutuario,
  getAllMutuarios,
  getMutuarioById,
  updateMutuario,
  deleteMutuario,
};