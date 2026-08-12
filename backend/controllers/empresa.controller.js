const { Empresa, User } = require("../models");
const { Op } = require("sequelize");
const registrarLogAuditoria = require("../utils/logAuditoria");

/*
  ==========================================================
  CONTROLLER DE EMPRESA (TENANT)
  ==========================================================
  Perfil da própria empresa + gestão dos utilizadores internos
  (ADMIN, GESTOR, ANALISTA, DIRETOR) dessa empresa.

  Nota: a criação de uma nova Empresa continua a acontecer em
  auth.controller.js (bootstrapAdmin), este controller só lida
  com a empresa já existente do utilizador autenticado.
*/

const ROLES_INTERNOS = ["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"];

/*
  ==========================================================
  VER PERFIL DA PRÓPRIA EMPRESA
  ==========================================================
*/
async function getMinhaEmpresa(req, res) {
  try {
    const empresa = await Empresa.findByPk(req.user.empresaId);

    if (!empresa) {
      return res.status(404).json({ message: "Empresa não encontrada." });
    }

    return res.status(200).json(empresa);
  } catch (error) {
    console.error("Erro ao buscar dados da empresa:", error);
    return res.status(500).json({
      message: "Erro interno ao buscar dados da empresa.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  ATUALIZAR PERFIL DA PRÓPRIA EMPRESA
  ==========================================================
  Apenas ADMIN. Campos editáveis: nome, nuit, email, telefone, logo.
  slug/plano/estado ficam de fora — são geridos a outro nível
  (mudar o slug quebraria links de convite já partilhados; plano
  e estado são normalmente controlados pela plataforma, não pelo
  próprio tenant).
*/
async function atualizarMinhaEmpresa(req, res) {
  try {
    const empresa = await Empresa.findByPk(req.user.empresaId);

    if (!empresa) {
      return res.status(404).json({ message: "Empresa não encontrada." });
    }

    const { nome, nuit, email, telefone, logo } = req.body;

    if (nome && nome !== empresa.nome) {
      const conflito = await Empresa.findOne({
        where: { nome, id: { [Op.ne]: empresa.id } },
        attributes: ["id"],
      });
      if (conflito) {
        return res.status(409).json({ message: "Já existe uma empresa registada com este nome." });
      }
    }

    await empresa.update({
      nome: nome ?? empresa.nome,
      nuit: nuit ?? empresa.nuit,
      email: email ?? empresa.email,
      telefone: telefone ?? empresa.telefone,
      logo: logo ?? empresa.logo,
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ATUALIZAR_EMPRESA",
      entidade: "Empresa",
      entidadeId: empresa.id,
      descricao: `Dados da empresa "${empresa.nome}" atualizados.`,
    });

    return res.status(200).json({ message: "Empresa atualizada com sucesso.", empresa });
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return res.status(500).json({
      message: "Erro interno ao atualizar empresa.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR UTILIZADORES INTERNOS DA EMPRESA
  ==========================================================
  ADMIN/GESTOR. Só devolve roles internas (backoffice) — os
  utilizadores do portal (USER/MUTUARIO) já são geridos via
  mutuario/vincularMutuario.
*/
async function listarUtilizadoresEmpresa(req, res) {
  try {
    const users = await User.findAll({
      where: {
        empresaId: req.user.empresaId,
        role: { [Op.in]: ROLES_INTERNOS },
      },
      attributes: ["id", "nome", "email", "role", "ativo", "created_at"],
      order: [["nome", "ASC"]],
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error("Erro ao listar utilizadores da empresa:", error);
    return res.status(500).json({
      message: "Erro interno ao listar utilizadores da empresa.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  ATIVAR / DESATIVAR UTILIZADOR INTERNO
  ==========================================================
  Apenas ADMIN. Regras de segurança:
  - só afeta utilizadores da própria empresa (evita IDOR);
  - só afeta roles internas (não mexe em contas de mutuário);
  - não permite que o ADMIN se desative a si próprio;
  - não permite deixar a empresa sem nenhum ADMIN ativo.
*/
async function atualizarEstadoUtilizador(req, res) {
  try {
    const { id } = req.params;
    const { ativo } = req.body;

    if (typeof ativo !== "boolean") {
      return res.status(400).json({ message: "O campo 'ativo' é obrigatório e deve ser boolean." });
    }

    const user = await User.findOne({
      where: {
        id,
        empresaId: req.user.empresaId,
        role: { [Op.in]: ROLES_INTERNOS },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    if (Number(user.id) === Number(req.user.id) && !ativo) {
      return res.status(400).json({ message: "Não podes desativar a tua própria conta." });
    }

    if (user.role === "ADMIN" && !ativo) {
      const outrosAdminsAtivos = await User.count({
        where: {
          empresaId: req.user.empresaId,
          role: "ADMIN",
          ativo: true,
          id: { [Op.ne]: user.id },
        },
      });

      if (outrosAdminsAtivos === 0) {
        return res.status(409).json({
          message: "Não é possível desativar o único ADMIN ativo da empresa.",
        });
      }
    }

    await user.update({ ativo });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: ativo ? "ATIVAR_UTILIZADOR" : "DESATIVAR_UTILIZADOR",
      entidade: "User",
      entidadeId: user.id,
      descricao: `Utilizador ${user.email} ${ativo ? "ativado" : "desativado"}.`,
    });

    return res.status(200).json({
      message: `Utilizador ${ativo ? "ativado" : "desativado"} com sucesso.`,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar estado do utilizador:", error);
    return res.status(500).json({
      message: "Erro interno ao atualizar estado do utilizador.",
      error: error.message,
    });
  }
}

module.exports = {
  getMinhaEmpresa,
  atualizarMinhaEmpresa,
  listarUtilizadoresEmpresa,
  atualizarEstadoUtilizador,
};
