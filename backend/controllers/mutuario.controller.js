const { Mutuario, User, PedidoCredito } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const generateCodigoMutuario = require("../utils/generateCodigoMutuario");

/*
  ==========================================================
  CRIAR MUTUÁRIO
  ==========================================================
  Esta função é administrativa:
  1. recebe os dados do body
  2. valida o campo obrigatório principal
  3. gera automaticamente o código do mutuário
  4. valida documento e userId, se vierem
  5. cria o registo na base de dados
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

    /*
      Validação mínima
    */
    if (!nomeCompleto) {
      return res.status(400).json({
        message: "O campo nomeCompleto é obrigatório.",
      });
    }

    /*
      Se vier documentoNumero, garante que não está duplicado
    */
    if (documentoNumero) {
      const mutuarioExistentePorDocumento = await Mutuario.findOne({
        where: { documentoNumero },
      });

      if (mutuarioExistentePorDocumento) {
        return res.status(409).json({
          message: "Já existe um mutuário com este número de documento.",
        });
      }
    }

    /*
      Se vier userId, valida:
      - user existe
      - user tem role USER
      - user ainda não está associado a outro mutuário
    */
    if (userId) {
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          message: "Utilizador associado não encontrado.",
        });
      }

      if (user.role !== "USER") {
        return res.status(400).json({
          message: "Apenas utilizadores com role USER podem ser associados a mutuário.",
        });
      }

      const mutuarioJaAssociadoAoUser = await Mutuario.findOne({
        where: { userId },
      });

      if (mutuarioJaAssociadoAoUser) {
        return res.status(409).json({
          message: "Este utilizador já está associado a outro mutuário.",
        });
      }
    }

    const codigoMutuario = await generateCodigoMutuario();

    const mutuario = await Mutuario.create({
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
    });

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

    /*
      Se vier documentoNumero, valida duplicação em outro mutuário
    */
    if (documentoNumero) {
      const mutuarioExistentePorDocumento = await Mutuario.findOne({
        where: { documentoNumero },
      });

      if (
        mutuarioExistentePorDocumento &&
        Number(mutuarioExistentePorDocumento.id) !== Number(mutuario.id)
      ) {
        return res.status(409).json({
          message: "Já existe outro mutuário com este número de documento.",
        });
      }
    }

    /*
      Se vier userId, valida:
      - user existe
      - user tem role USER
      - user não está ligado a outro mutuário
    */
    if (userId) {
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          message: "Utilizador associado não encontrado.",
        });
      }

      if (user.role !== "USER") {
        return res.status(400).json({
          message: "Apenas utilizadores com role USER podem ser associados a mutuário.",
        });
      }

      const mutuarioJaAssociadoAoUser = await Mutuario.findOne({
        where: { userId },
      });

      if (
        mutuarioJaAssociadoAoUser &&
        Number(mutuarioJaAssociadoAoUser.id) !== Number(mutuario.id)
      ) {
        return res.status(409).json({
          message: "Este utilizador já está associado a outro mutuário.",
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