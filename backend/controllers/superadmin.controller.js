const { Op, fn, col } = require("sequelize");
const { Empresa, User } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");

/*
  ==========================================================
  CONTROLLER SUPERADMIN — GESTÃO DE EMPRESAS (TENANTS)
  ==========================================================
  Acesso restrito ao role SUPERADMIN (ver routes/superadmin.routes.js).
  É aqui que o dono da plataforma vê todas as empresas e controla
  manualmente plano/estado (ex: confirmar pagamento, suspender).
*/

const PLANOS_VALIDOS = ["STARTER", "BUSINESS", "ENTERPRISE"];
const ESTADOS_VALIDOS = ["TESTE", "ATIVA", "SUSPENSA", "CANCELADA"];

/*
  ==========================================================
  LISTAR TODAS AS EMPRESAS DA PLATAFORMA
  ==========================================================
*/
async function listarEmpresas(req, res) {
  try {
    const empresas = await Empresa.findAll({ order: [["created_at", "DESC"]] });

    const contagens = await User.findAll({
      attributes: ["empresaId", [fn("COUNT", col("id")), "total"]],
      where: { empresaId: { [Op.ne]: null } },
      group: ["empresaId"],
    });

    const totalUtilizadoresPorEmpresa = contagens.reduce((acc, row) => {
      acc[row.empresaId] = Number(row.get("total")) || 0;
      return acc;
    }, {});

    const resultado = empresas.map((empresa) => ({
      ...empresa.toJSON(),
      totalUtilizadores: totalUtilizadoresPorEmpresa[empresa.id] || 0,
    }));

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao listar empresas (superadmin):", error);
    return res.status(500).json({
      message: "Erro interno ao listar empresas.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  VER DETALHE DE UMA EMPRESA
  ==========================================================
*/
async function obterEmpresa(req, res) {
  try {
    const { id } = req.params;

    const empresa = await Empresa.findByPk(id, {
      include: [
        {
          model: User,
          as: "utilizadores",
          attributes: ["id", "nome", "email", "role", "ativo", "created_at"],
        },
      ],
    });

    if (!empresa) {
      return res.status(404).json({ message: "Empresa não encontrada." });
    }

    return res.status(200).json(empresa);
  } catch (error) {
    console.error("Erro ao buscar empresa (superadmin):", error);
    return res.status(500).json({
      message: "Erro interno ao buscar empresa.",
      error: error.message,
    });
  }
}

/*
  ==========================================================
  ATUALIZAR PLANO / ESTADO DE UMA EMPRESA
  ==========================================================
  Ex: confirmar pagamento (estado -> ATIVA), suspender, cancelar,
  ou mudar de plano (STARTER/BUSINESS/ENTERPRISE).
*/
async function atualizarEmpresaSuperadmin(req, res) {
  try {
    const { id } = req.params;
    const { plano, estado } = req.body;

    if (plano && !PLANOS_VALIDOS.includes(plano)) {
      return res.status(400).json({ message: "Plano inválido.", planosValidos: PLANOS_VALIDOS });
    }

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ message: "Estado inválido.", estadosValidos: ESTADOS_VALIDOS });
    }

    if (!plano && !estado) {
      return res.status(400).json({ message: "Indica pelo menos plano ou estado para atualizar." });
    }

    const empresa = await Empresa.findByPk(id);

    if (!empresa) {
      return res.status(404).json({ message: "Empresa não encontrada." });
    }

    const updates = {};
    if (plano) updates.plano = plano;

    if (estado) {
      updates.estado = estado;
      // Ao confirmar um plano pago manualmente, o trial deixa de fazer sentido.
      if (estado === "ATIVA") {
        updates.trialEndsAt = null;
      }
    }

    await empresa.update(updates);

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "SUPERADMIN_ATUALIZAR_EMPRESA",
      entidade: "Empresa",
      entidadeId: empresa.id,
      descricao: `Empresa "${empresa.nome}" atualizada pelo superadmin (plano=${empresa.plano}, estado=${empresa.estado}).`,
    });

    return res.status(200).json({ message: "Empresa atualizada com sucesso.", empresa });
  } catch (error) {
    console.error("Erro ao atualizar empresa (superadmin):", error);
    return res.status(500).json({
      message: "Erro interno ao atualizar empresa.",
      error: error.message,
    });
  }
}

module.exports = {
  listarEmpresas,
  obterEmpresa,
  atualizarEmpresaSuperadmin,
};
