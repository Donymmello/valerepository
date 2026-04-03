const { Mutuario, User, PedidoCredito } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");

/*
  Função auxiliar para gerar código do mutuário.
  Exemplo:
  MUT-20260331-123456
*/
function generateCodigoMutuario() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const random = Math.floor(100000 + Math.random() * 900000);

  return `MUT-${year}${month}${day}-${random}`;
}

/*
  ==========================================================
  CRIAR MUTUÁRIO
  ==========================================================
  Esta função:
  1. recebe os dados do body
  2. valida o campo obrigatório principal
  3. gera automaticamente o código do mutuário
  4. cria o registo na base de dados
*/
async function createMutuario(req, res) {
  try {
    const {
      nomeCompleto,
      documentoTipo,
      documentoNumero,
      dataNascimento,
      provincia,
      distrito,
      localResidencia,
      telefone,
      email,
      userId,
    } = req.body;

    // Validação mínima
    if (!nomeCompleto) {
      return res.status(400).json({
        message: "O campo nomeCompleto é obrigatório.",
      });
    }

    // Se vier userId, confirma se o utilizador existe
    if (userId) {
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          message: "Utilizador associado não encontrado.",
        });
      }
    }

    const mutuario = await Mutuario.create({
      codigoMutuario: generateCodigoMutuario(),
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
    });

    // Criar log de auditoria ao criar um novo mutuário
    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "CRIAR_MUTUARIO",
      entidade: "Mutuario",
      entidadeId: mutuario.id,
      descricao: `Mutuário ${mutuario.nomeCompleto} criado no sistema.`,
    });

    return res.status(201).json({
      message: "Mutuário criado com sucesso.",
      mutuario,
    });
  } catch (error) {
    console.error("Erro ao criar mutuário:", error);

    return res.status(500).json({
      message: "Erro interno ao criar mutuário.",
      error: error.message,
    });
  }
}



/*
  ==========================================================
  LISTAR TODOS OS MUTUÁRIOS
  ==========================================================
*/
async function getAllMutuarios(req, res) {
  try {
    const mutuarios = await Mutuario.findAll({
      include: [
        {
          model: User,
          as: "user",
          required: false,
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json(mutuarios);
  } catch (error) {
    console.error("Erro ao listar mutuários:", error);

    return res.status(500).json({
      message: "Erro interno ao listar mutuários.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  BUSCAR MUTUÁRIO POR ID
  ==========================================================
*/
async function getMutuarioById(req, res) {
  try {
    const { id } = req.params;

    const mutuario = await Mutuario.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          required: false,
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
        {
          model: PedidoCredito,
          as: "pedidosCredito",
          required: false,
        },
      ],
    });

    if (!mutuario) {
      return res.status(404).json({
        message: "Mutuário não encontrado.",
      });
    }

    return res.status(200).json(mutuario);
  } catch (error) {
    console.error("Erro ao buscar mutuário:", error);

    return res.status(500).json({
      message: "Erro interno ao buscar mutuário.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  ATUALIZAR MUTUÁRIO
  ==========================================================
*/
async function updateMutuario(req, res) {
  try {
    const { id } = req.params;

    const mutuario = await Mutuario.findByPk(id);

    if (!mutuario) {
      return res.status(404).json({
        message: "Mutuário não encontrado.",
      });
    }

    const {
      nomeCompleto,
      documentoTipo,
      documentoNumero,
      dataNascimento,
      provincia,
      distrito,
      localResidencia,
      telefone,
      email,
      userId,
    } = req.body;

    // Se vier userId, valida
    if (userId) {
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          message: "Utilizador associado não encontrado.",
        });
      }
    }

    await mutuario.update({
      nomeCompleto: nomeCompleto !== undefined ? nomeCompleto : mutuario.nomeCompleto,
      documentoTipo: documentoTipo !== undefined ? documentoTipo : mutuario.documentoTipo,
      documentoNumero:
        documentoNumero !== undefined ? documentoNumero : mutuario.documentoNumero,
      dataNascimento:
        dataNascimento !== undefined ? dataNascimento : mutuario.dataNascimento,
      provincia: provincia !== undefined ? provincia : mutuario.provincia,
      distrito: distrito !== undefined ? distrito : mutuario.distrito,
      localResidencia:
        localResidencia !== undefined ? localResidencia : mutuario.localResidencia,
      telefone: telefone !== undefined ? telefone : mutuario.telefone,
      email: email !== undefined ? email : mutuario.email,
      userId: userId !== undefined ? userId : mutuario.userId,
    });

    // Criar log de auditoria ao atualizar um mutuário
    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ATUALIZAR_MUTUARIO",
      entidade: "Mutuario",
      entidadeId: mutuario.id,
      descricao: `Mutuário ${mutuario.nomeCompleto} atualizado no sistema.`,
    });

    return res.status(200).json({
      message: "Mutuário atualizado com sucesso.",
      mutuario,
    });
  } catch (error) {
    console.error("Erro ao atualizar mutuário:", error);

    return res.status(500).json({
      message: "Erro interno ao atualizar mutuário.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  REMOVER MUTUÁRIO
  ==========================================================
*/
async function deleteMutuario(req, res) {
  try {
    const { id } = req.params;

    const mutuario = await Mutuario.findByPk(id);

    if (!mutuario) {
      return res.status(404).json({
        message: "Mutuário não encontrado.",
      });
    }

    await mutuario.destroy();

    // Criar log de auditoria ao remover um mutuário
    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "REMOVER_MUTUARIO",
      entidade: "Mutuario",
      entidadeId: mutuario.id,
      descricao: `Mutuário ${mutuario.nomeCompleto} removido do sistema.`,
    });

    return res.status(200).json({
      message: "Mutuário removido com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao remover mutuário:", error);

    return res.status(500).json({
      message: "Erro interno ao remover mutuário.",
      error: error.message,
    });
  }
}

module.exports = {
  createMutuario,
  getAllMutuarios,
  getMutuarioById,
  updateMutuario,
  deleteMutuario,
};