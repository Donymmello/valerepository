const fs = require("fs");
const path = require("path");
const { Empresa, User } = require("../models");
const { Op } = require("sequelize");
const registrarLogAuditoria = require("../utils/logAuditoria");
const { invalidarCacheEmpresa } = require("../utils/empresaCache");

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
  slug/plano/estado ficam de fora, são geridos a outro nível
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

    const { nome, nuit, email, telefone, logo, taxaJurosMin, taxaJurosMax } = req.body;

    if (nome && nome !== empresa.nome) {
      const conflito = await Empresa.findOne({
        where: { nome, id: { [Op.ne]: empresa.id } },
        attributes: ["id"],
      });
      if (conflito) {
        return res.status(409).json({ message: "Já existe uma empresa registada com este nome." });
      }
    }

    let novaTaxaMin = empresa.taxaJurosMin;
    let novaTaxaMax = empresa.taxaJurosMax;

    if (taxaJurosMin !== undefined || taxaJurosMax !== undefined) {
      novaTaxaMin = taxaJurosMin !== undefined ? Number(taxaJurosMin) : Number(empresa.taxaJurosMin);
      novaTaxaMax = taxaJurosMax !== undefined ? Number(taxaJurosMax) : Number(empresa.taxaJurosMax);

      if (
        !Number.isFinite(novaTaxaMin) || !Number.isFinite(novaTaxaMax) ||
        novaTaxaMin < 0 || novaTaxaMax < 0
      ) {
        return res.status(400).json({ message: "As taxas de juros devem ser números positivos." });
      }

      if (novaTaxaMin > novaTaxaMax) {
        return res.status(400).json({ message: "A taxa mínima não pode ser maior que a taxa máxima." });
      }
    }

    await empresa.update({
      nome: nome ?? empresa.nome,
      nuit: nuit ?? empresa.nuit,
      email: email ?? empresa.email,
      telefone: telefone ?? empresa.telefone,
      logo: logo ?? empresa.logo,
      taxaJurosMin: novaTaxaMin,
      taxaJurosMax: novaTaxaMax,
    });

    // utils/empresaCache.js cacheia nome/taxas (entre outros campos) por
    // 60s, este endpoint é precisamente quem os muda, por isso precisa
    // de invalidar. Antes desta cache existir isto não era necessário.
    invalidarCacheEmpresa(empresa.id);

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
  UPLOAD DO LOGO DA PRÓPRIA EMPRESA
  ==========================================================
  Apenas ADMIN (ver routes/empresa.routes.js e
  middleware/uploadLogo.middleware.js para tipo/tamanho aceites).
  O ficheiro fica em upload/logos, servido publicamente em
  /api/uploads/logos/<ficheiro> (ver server.js). "logo" na Empresa
  guarda sempre a URL absoluta (mesmo formato que já aceitava quando
  era colado à mão via PUT /empresas/me), para o frontend nunca
  precisar de saber montar o caminho, só usar <img src={empresa.logo}>.
*/
async function uploadLogoEmpresa(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum ficheiro enviado." });
    }

    const empresa = await Empresa.findByPk(req.user.empresaId);

    if (!empresa) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: "Empresa não encontrada." });
    }

    const logoAnterior = empresa.logo;
    const novoLogo = `${req.protocol}://${req.get("host")}/api/uploads/logos/${req.file.filename}`;

    await empresa.update({ logo: novoLogo });
    invalidarCacheEmpresa(empresa.id);

    // Best-effort: só apaga o ficheiro antigo se for mesmo um upload
    // nosso (não uma URL externa que o utilizador tenha posto antes via
    // PUT /empresas/me), para nunca tentar apagar algo fora desta pasta.
    if (logoAnterior && logoAnterior.includes("/api/uploads/logos/")) {
      const caminhoAntigo = path.join("upload/logos", path.basename(logoAnterior));
      fs.unlink(caminhoAntigo, () => {});
    }

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ATUALIZAR_LOGO_EMPRESA",
      entidade: "Empresa",
      entidadeId: empresa.id,
      descricao: `Logo da empresa "${empresa.nome}" atualizado.`,
    });

    return res.status(200).json({ message: "Logo atualizado com sucesso.", empresa });
  } catch (error) {
    console.error("Erro ao atualizar logo da empresa:", error);
    return res.status(500).json({
      message: "Erro interno ao atualizar logo da empresa.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  LISTAR UTILIZADORES INTERNOS DA EMPRESA
  ==========================================================
  ADMIN/GESTOR. Só devolve roles internas (backoffice), os
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
  uploadLogoEmpresa,
  listarUtilizadoresEmpresa,
  atualizarEstadoUtilizador,
};
