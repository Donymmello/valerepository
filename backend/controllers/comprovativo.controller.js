const path = require("path");
const {
  Comprovativo,
  Credito,
  ParcelaPagamento,
  Reembolso,
  User,
  Mutuario,
  sequelize,
} = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const { generateReferencia } = require("../utils/generateCode");
const CreditoService = require("../services/credito.service");
const { podeRegistrarReembolso } = require("../utils/regrasCredito");

const comprovativoInclude = [
  { model: Credito, as: "credito", attributes: ["id", "numeroContrato", "estado", "mutuarioId"] },
  { model: ParcelaPagamento, as: "parcela", attributes: ["id", "numeroParcela", "valorPrevisto", "valorPago", "saldoParcela", "estado"] },
  { model: User, as: "remetente", attributes: ["id", "nome", "email"] },
  { model: User, as: "validador", attributes: ["id", "nome", "email"] },
];

async function obterCreditoDoMutuario(creditoId, userId) {
  return Credito.findOne({
    where: { id: creditoId },
    include: [{ model: Mutuario, as: "mutuario", where: { userId }, attributes: ["id", "userId"] }],
  });
}

async function enviarComprovativo(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "Nenhum ficheiro foi enviado." });

    const { creditoId, parcelaId } = req.params;
    const credito = await obterCreditoDoMutuario(creditoId, req.user.id);
    if (!credito) return res.status(404).json({ message: "Credito nao encontrado ou sem acesso." });
    if (credito.estado === "LIQUIDADO") return res.status(400).json({ message: "Este credito ja foi liquidado." });

    const parcela = await ParcelaPagamento.findOne({ where: { id: parcelaId, creditoId } });
    if (!parcela) return res.status(404).json({ message: "Parcela nao encontrada neste credito." });
    if (Number(parcela.saldoParcela) <= 0) return res.status(400).json({ message: "Esta parcela ja esta paga." });

    const pendente = await Comprovativo.findOne({ where: { creditoId, parcelaId, estado: "PENDENTE" } });
    if (pendente) return res.status(409).json({ message: "Ja existe um comprovativo pendente para esta parcela." });

    const comprovativo = await Comprovativo.create({
      creditoId,
      parcelaId,
      userId: req.user.id,
      nome: req.file.originalname,
      arquivo: req.file.filename,
      mimeType: req.file.mimetype,
      tamanho: req.file.size,
      estado: "PENDENTE",
    });

    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "ENVIAR_COMPROVATIVO",
      entidade: "Comprovativo",
      entidadeId: comprovativo.id,
      descricao: `Comprovativo enviado para o credito ${credito.numeroContrato}, parcela ${parcela.numeroParcela}.`,
    });
    return res.status(201).json({ message: "Comprovativo enviado com sucesso.", comprovativo });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao enviar comprovativo.", error: error.message });
  }
}

async function getMeusComprovativos(req, res) {
  try {
    const credito = await obterCreditoDoMutuario(req.params.creditoId, req.user.id);
    if (!credito) return res.status(404).json({ message: "Credito nao encontrado ou sem acesso." });
    const comprovativos = await Comprovativo.findAll({
      where: { creditoId: credito.id },
      include: comprovativoInclude.slice(1, 2),
      order: [["created_at", "DESC"]],
    });
    return res.json(comprovativos);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao listar comprovativos.", error: error.message });
  }
}

async function getComprovativos(req, res) {
  try {
    const where = req.params.creditoId ? { creditoId: req.params.creditoId } : {};
    if (req.query.estado) where.estado = req.query.estado;
    const comprovativos = await Comprovativo.findAll({ where, include: comprovativoInclude, order: [["created_at", "DESC"]] });
    return res.json(comprovativos);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao listar comprovativos.", error: error.message });
  }
}

async function obterComprovativo(req, res) {
  const comprovativo = await Comprovativo.findByPk(req.params.id, { include: comprovativoInclude });
  if (!comprovativo) return res.status(404).json({ message: "Comprovativo nao encontrado." });
  return res.json(comprovativo);
}

async function downloadComprovativo(req, res) {
  const comprovativo = await Comprovativo.findByPk(req.params.id);
  if (!comprovativo) return res.status(404).json({ message: "Comprovativo nao encontrado." });
  return res.download(path.resolve("upload/comprovativos", comprovativo.arquivo), comprovativo.nome);
}

async function validarComprovativo(req, res) {
  try {
    const { estado, observacoes, valorReembolsado, dataReembolso, meioPagamento, numeroTransacao } = req.body;
    if (!["VALIDADO", "REJEITADO"].includes(estado)) {
      return res.status(400).json({ message: "Estado invalido. Use VALIDADO ou REJEITADO." });
    }

    const resultado = await sequelize.transaction(async (transaction) => {
      const comprovativo = await Comprovativo.findByPk(req.params.id, {
        include: [{ model: Credito, as: "credito" }, { model: ParcelaPagamento, as: "parcela" }],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!comprovativo) {
        const error = new Error("Comprovativo nao encontrado."); error.status = 404; throw error;
      }
      if (comprovativo.estado !== "PENDENTE") {
        const error = new Error("Este comprovativo ja foi tratado."); error.status = 409; throw error;
      }
      if (!podeRegistrarReembolso(req.user, comprovativo.credito)) {
        const error = new Error("Sem permissao para validar este comprovativo."); error.status = 403; throw error;
      }

      let reembolso = null;
      if (estado === "VALIDADO") {
        if (!valorReembolsado || Number(valorReembolsado) <= 0) {
          const error = new Error("valorReembolsado e obrigatorio na aprovacao."); error.status = 400; throw error;
        }
        if (Number(valorReembolsado) > Number(comprovativo.parcela.saldoParcela)) {
          const error = new Error("O valor aprovado excede o saldo da parcela."); error.status = 400; throw error;
        }
        const data = dataReembolso ? new Date(dataReembolso) : new Date();
        reembolso = await Reembolso.create({
          creditoId: comprovativo.creditoId,
          parcelaId: comprovativo.parcelaId,
          valorReembolsado,
          dataReembolso: data,
          meioPagamento: meioPagamento || "TRANSFERENCIA",
          numeroTransacao: numeroTransacao || null,
          referencia: await generateReferencia(),
          observacoes: observacoes || null,
          createdBy: req.user.id,
        }, { transaction });
        await CreditoService.registarReembolso(comprovativo.creditoId, comprovativo.parcelaId, valorReembolsado, data, { transaction });
      }

      await comprovativo.update({
        estado,
        observacoes: observacoes || null,
        validadoPor: req.user.id,
        dataValidacao: new Date(),
        reembolsoId: reembolso?.id || null,
      }, { transaction });
      await registrarLogAuditoria({
        userId: req.user.id,
        acao: estado === "VALIDADO" ? "APROVAR_COMPROVATIVO" : "REJEITAR_COMPROVATIVO",
        entidade: "Comprovativo",
        entidadeId: comprovativo.id,
        descricao: `Comprovativo ${comprovativo.id} ${estado.toLowerCase()} para credito ${comprovativo.credito.numeroContrato}.`,
      }, { transaction });
      return { comprovativo, reembolso };
    });
    return res.json({ message: `Comprovativo ${estado.toLowerCase()} com sucesso.`, ...resultado });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Erro ao validar comprovativo." });
  }
}

module.exports = { enviarComprovativo, getMeusComprovativos, getComprovativos, obterComprovativo, downloadComprovativo, validarComprovativo };
