const { Op } = require("sequelize");
const { User, Mutuario } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");

/*
  ==========================================================
  ASSOCIAR USER A MUTUÁRIO
  ==========================================================
*/
async function associarUserMutuario(req, res) {
  try {
    const { userId, mutuarioId } = req.body;

    if (!["ADMIN", "GESTOR"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Não tens permissão para associar utilizador a mutuário.",
      });
    }

    if (!userId || !mutuarioId) {
      return res.status(400).json({
        message: "userId e mutuarioId são obrigatórios.",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        message: "Utilizador não encontrado.",
      });
    }

    if (user.role !== "USER") {
      return res.status(400).json({
        message: "Só utilizadores com role USER podem ser associados a mutuário.",
      });
    }

    const mutuario = await Mutuario.findByPk(mutuarioId);

    if (!mutuario) {
      return res.status(404).json({
        message: "Mutuário não encontrado.",
      });
    }

    if (mutuario.userId && Number(mutuario.userId) !== Number(user.id)) {
      return res.status(409).json({
        message: "Este mutuário já está associado a outro utilizador.",
      });
    }

    const mutuarioJaAssociadoAoUser = await Mutuario.findOne({
      where: { userId: user.id },
    });

    if (
      mutuarioJaAssociadoAoUser &&
      Number(mutuarioJaAssociadoAoUser.id) !== Number(mutuario.id)
    ) {
      return res.status(409).json({
        message: "Este utilizador já está associado a outro mutuário.",
      });
    }

    await mutuario.update({
      userId: user.id,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ASSOCIAR_USER_MUTUARIO",
      entidade: "Mutuario",
      entidadeId: mutuario.id,
      descricao: `Utilizador ID ${user.id} associado ao mutuário ID ${mutuario.id}.`,
    });

    const mutuarioAtualizado = await Mutuario.findByPk(mutuario.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
      ],
    });

    return res.status(200).json({
      message: "Utilizador associado ao mutuário com sucesso.",
      mutuario: mutuarioAtualizado,
    });
  } catch (error) {
    console.error("Erro ao associar utilizador ao mutuário:", error);

    return res.status(500).json({
      message: "Erro interno ao associar utilizador ao mutuário.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  REMOVER ASSOCIAÇÃO ENTRE USER E MUTUÁRIO
  ==========================================================
*/
async function removerAssociacaoUserMutuario(req, res) {
  try {
    const { mutuarioId } = req.params;

    if (!["ADMIN", "GESTOR"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Não tens permissão para remover associação do mutuário.",
      });
    }

    const mutuario = await Mutuario.findByPk(mutuarioId, {
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
        message: "Mutuário não encontrado.",
      });
    }

    if (!mutuario.userId) {
      return res.status(400).json({
        message: "Este mutuário não possui utilizador associado.",
      });
    }

    const userAnterior = mutuario.userId;

    await mutuario.update({
      userId: null,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "REMOVER_ASSOCIACAO_USER_MUTUARIO",
      entidade: "Mutuario",
      entidadeId: mutuario.id,
      descricao: `Associação removida entre mutuário ID ${mutuario.id} e utilizador ID ${userAnterior}.`,
    });

    return res.status(200).json({
      message: "Associação removida com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao remover associação do mutuário:", error);

    return res.status(500).json({
      message: "Erro interno ao remover associação do mutuário.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  CONSULTAR ASSOCIAÇÃO DE UM MUTUÁRIO
  ==========================================================
*/
async function getAssociacaoMutuario(req, res) {
  try {
    const { mutuarioId } = req.params;

    if (!["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Não tens permissão para consultar associação do mutuário.",
      });
    }

    const mutuario = await Mutuario.findByPk(mutuarioId, {
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
        message: "Mutuário não encontrado.",
      });
    }

    return res.status(200).json(mutuario);
  } catch (error) {
    console.error("Erro ao consultar associação do mutuário:", error);

    return res.status(500).json({
      message: "Erro interno ao consultar associação do mutuário.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR USERS COM ROLE USER AINDA NÃO ASSOCIADOS
  ==========================================================
*/
async function getUsersNaoAssociados(req, res) {
  try {
    if (!["ADMIN", "GESTOR"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Não tens permissão para listar utilizadores disponíveis para associação.",
      });
    }

    const mutuariosAssociados = await Mutuario.findAll({
      where: {
        userId: {
          [Op.ne]: null,
        },
      },
      attributes: ["userId"],
    });

    const userIdsAssociados = mutuariosAssociados
      .map((item) => item.userId)
      .filter((id) => id !== null);

    const where = {
      role: "USER",
    };

    if (userIdsAssociados.length > 0) {
      where.id = {
        [Op.notIn]: userIdsAssociados,
      };
    }

    const users = await User.findAll({
      where,
      attributes: ["id", "nome", "email", "role", "ativo", "created_at"],
      order: [["id", "DESC"]],
    });

    return res.status(200).json({
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("Erro ao listar users não associados:", error);

    return res.status(500).json({
      message: "Erro interno ao listar utilizadores não associados.",
      error: error.message,
    });
  }
}

module.exports = {
  associarUserMutuario,
  removerAssociacaoUserMutuario,
  getAssociacaoMutuario,
  getUsersNaoAssociados,
};