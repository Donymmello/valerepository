const { Credito, ParcelaPagamento, Reembolso, PedidoCredito, Mutuario, User } = require("../models");
const { Op } = require("sequelize");
const { asyncHandler } = require("../middleware/errorHandler.middleware");

/**
 * BUSCAR CRÉDITOS ELEGÍVEIS PARA REEMBOLSO
 */
const buscarCreditosElegiveisReembolso = asyncHandler(async (req, res) => {
  const creditos = await Credito.findAll({
    where: { estado: "ATIVO" },
    include: [
      {
        model: ParcelaPagamento,
        as: "parcelas",
        where: { estado: { [Op.in]: ["PENDENTE", "ATRASADO"] } },
        separate: true,
        order: [["numeroParcela", "ASC"]],
        required: true,
      },
      { model: Mutuario, as: "mutuario", attributes: ["id", "nomeCompleto"], required: false },
      { model: PedidoCredito, as: "pedido", required: false },
    ],
    order: [["created_at", "DESC"]],
  });

  return res.status(200).json(creditos);
});

/**
 * BUSCAR CRÉDITO COM HISTÓRICO DE REEMBOLSOS
 */
const buscarCreditoComReembolsos = asyncHandler(async (req, res) => {
  const credito = await Credito.findByPk(req.params.creditoId, {
    include: [
      { model: ParcelaPagamento, as: "parcelas", order: [["numeroParcela", "ASC"]] },
      { model: Reembolso, as: "reembolsos", order: [["created_at", "DESC"]] },
      { model: PedidoCredito, as: "pedido" },
      { model: Mutuario, as: "mutuario", attributes: ["id", "nomeCompleto"] },
    ],
  });

  if (!credito) {
    return res.status(404).json({ message: "Crédito não encontrado." });
  }

  return res.status(200).json(credito);
});

/**
 * LISTAR TODOS OS CRÉDITOS (Painel Administrativo)
 */
const getAllCreditos = asyncHandler(async (req, res) => {
  const creditos = await Credito.findAll({
    include: [
      { model: PedidoCredito, as: "pedido" },
      { model: Mutuario, as: "mutuario" },
      { model: User, as: "criador", attributes: ["id", "nome", "email", "role", "ativo"] },
    ],
    order: [["id", "DESC"]],
  });

  return res.status(200).json(creditos);
});

module.exports = {
  buscarCreditosElegiveisReembolso,
  buscarCreditoComReembolsos,
  getAllCreditos,
};