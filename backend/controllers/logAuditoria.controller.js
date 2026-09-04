const { LogAuditoria, User } = require("../models");

/*
  ==========================================================
  LISTAR TODOS OS LOGS
  ==========================================================
  Ideal para ADMIN e GESTOR.
*/
async function getAllLogsAuditoria(req, res) {
  try {
    const logs = await LogAuditoria.findAll({
      include: [
        {
          model: User,
          as: "user",
          required: true,
          where: { empresaId: req.user.empresaId },
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
      ],
      order: [["created_at", "DESC"]],
      // logs_auditoria só cresce (nunca é limpa), dos 4 endpoints sem
      // limite encontrados na auditoria, este é o de maior risco a
      // médio prazo. Trava de segurança, não paginação real.
      limit: 500,
    });

    return res.status(200).json(logs);
  } catch (error) {
    console.error("Erro ao listar logs de auditoria:", error);

    return res.status(500).json({
      message: "Erro interno ao listar logs de auditoria.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  BUSCAR LOG POR ID
  ==========================================================
*/
async function getLogAuditoriaById(req, res) {
  try {
    const { id } = req.params;

    const log = await LogAuditoria.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          required: true,
          where: { empresaId: req.user.empresaId },
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
      ],
    });

    if (!log) {
      return res.status(404).json({
        message: "Log de auditoria não encontrado.",
      });
    }

    return res.status(200).json(log);
  } catch (error) {
    console.error("Erro ao buscar log de auditoria:", error);

    return res.status(500).json({
      message: "Erro interno ao buscar log de auditoria.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR LOGS DO UTILIZADOR AUTENTICADO
  ==========================================================
*/
async function getMeusLogsAuditoria(req, res) {
  try {
    const logs = await LogAuditoria.findAll({
      where: {
        userId: req.user.id,
      },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(logs);
  } catch (error) {
    console.error("Erro ao listar meus logs:", error);

    return res.status(500).json({
      message: "Erro interno ao listar meus logs.",
      error: error.message,
    });
  }
}

module.exports = {
  getAllLogsAuditoria,
  getLogAuditoriaById,
  getMeusLogsAuditoria,
};