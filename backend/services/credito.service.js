const { Mutuario, User, Credito, PedidoCredito, ParcelaPagamento, Reembolso, Desembolso } = require("../models");
const { Op } = require("sequelize");
const generateCodParcela = require("../utils/generateCodParcela");


/*
==========================================================
LISTAR CRÉDITOS DO MUTUÁRIO
==========================================================
*/
async function listarMeusCreditos(mutuarioId) {
  return await Credito.findAll({
    where: {
      mutuarioId,
    },
    include: [
      {
        model: PedidoCredito,
        as: "pedido",
      },
    ],
    order: [["created_at", "DESC"]],
  });
}

/*
==========================================================
DETALHE DE UM CRÉDITO
==========================================================
*/
async function buscarMeuCredito(creditoId, mutuarioId) {
  return await Credito.findOne({
    where: {
      id: creditoId,
      mutuarioId,
    },
    include: [
      {
        model: PedidoCredito,
        as: "pedido",
      },
      {
        model: ParcelaPagamento,
        as: "parcelas",
        separate: true,
        order: [["numeroParcela", "ASC"]],
      },
    ],
  });
}

/**
 * Gera um número de contrato.
 * Exemplo:
 * CTR-2026-000001
 */
async function gerarNumeroContrato() {
  const ano = new Date().getFullYear();

  const ultimo = await Credito.findOne({
    order: [["id", "DESC"]],
  });

  const sequencia = ultimo ? ultimo.id + 1 : 1;

  return `CTR-${ano}-${String(sequencia).padStart(6, "0")}`;
}

/**
 * Cria automaticamente um crédito a partir
 * de um pedido já desembolsado.
 */
async function criarCredito(pedido, desembolso, userId) {
  const numeroContrato = await gerarNumeroContrato();

  const dataInicio = desembolso.dataDesembolso || new Date();

  const dataFimPrevista = new Date(dataInicio);
  dataFimPrevista.setMonth(
    dataFimPrevista.getMonth() + Number(pedido.prazo)
  );

  const credito = await Credito.create({
    numeroContrato,

    pedidoId: pedido.id,

    desembolsoId: desembolso.id,

    simulacaoId: pedido.simulacaoId || null,

    mutuarioId: pedido.mutuarioId,

    valorOriginal: pedido.valorSolicitado,

    saldoAtual: pedido.montanteTotal,

    totalPago: 0,

    prazo: pedido.prazo,

    taxa: pedido.taxa,

    prestacao: pedido.prestacao,

    jurosTotal: pedido.jurosTotal,

    montanteTotal: pedido.montanteTotal,

    estado: "ATIVO",

    dataInicio,

    dataFimPrevista,

    observacoes: pedido.observacoes || null,

    createdBy: userId,
  });

  const parcelas = generateCodParcela({
    creditoId: credito.id,
    prestacao: credito.prestacao,
    numeroParcelas: credito.prazo,
    primeiraDataVencimento: credito.dataInicio,
  });

  await ParcelaPagamento.bulkCreate(parcelas);

  return credito;
}

/**
 * Atualiza o saldo após um reembolso.
 * NOTA: Este é o core da lógica financeira.
 * Atualiza totalPago, saldoAtual e estado do crédito.
 */
async function atualizarSaldo(creditoId, valorPago) {
  const credito = await Credito.findByPk(creditoId);

  if (!credito) {
    throw new Error("Crédito não encontrado.");
  }

  const novoTotalPago =
    Number(credito.totalPago) + Number(valorPago);

  const novoSaldo =
    Number(credito.saldoAtual) - Number(valorPago);

  credito.totalPago = novoTotalPago;
  credito.saldoAtual = Math.max(0, novoSaldo);

  // Se o saldo chegou a 0 ou menos, crédito é liquidado
  if (credito.saldoAtual <= 0) {
    credito.estado = "LIQUIDADO";
    credito.dataLiquidacao = new Date();
  }

  await credito.save();

  return credito;
}

/*
==========================================================
ATUALIZAR PARCELA APÓS REEMBOLSO
Marca a parcela como PAGO quando um reembolso é feito.
Atualiza dataPagamento, valorPago e saldoParcela.
==========================================================
*/
async function atualizarParcelaAposReembolso(
  creditoId,
  parcelaId,
  valorPago,
  dataReembolso = new Date()
) {
  try {
    const parcela = await ParcelaPagamento.findByPk(parcelaId);

    if (!parcela) {
      throw new Error("Parcela não encontrada.");
    }

    if (parcela.creditoId !== creditoId) {
      throw new Error("Parcela não pertence a este crédito.");
    }

    // Calcular novo saldo da parcela
    const novoValorPago = Number(parcela.valorPago || 0) + Number(valorPago);
    const novoSaldoParcela = Math.max(0, Number(parcela.valorPrevisto) - novoValorPago);
    
    // Determinar estado da parcela
    let novoEstado = "PENDENTE";
    if (novoSaldoParcela === 0) {
      novoEstado = "PAGO";
    } else if (new Date(parcela.dataVencimento) < new Date() && novoSaldoParcela > 0) {
      novoEstado = "ATRASADO";
    }

    // Atualizar a parcela
    await parcela.update({
      estado: novoEstado,
      dataPagamento: novoEstado === "PAGO" ? dataReembolso : parcela.dataPagamento,
      valorPago: novoValorPago,
      saldoParcela: novoSaldoParcela,
    });

    return parcela;
  } catch (error) {
    throw new Error(`Erro ao atualizar parcela: ${error.message}`);
  }
}

/*
==========================================================
ORQUESTRAÇÃO: REGISTAR REEMBOLSO
Este método faz a "orquestração" da atualização após reembolso:
1. Atualiza a parcela:
   - Incrementa valorPago
   - Recalcula saldoParcela
   - Marca como PAGO se saldoParcela = 0
2. Atualiza o saldo do crédito (totalPago, saldoAtual, estado)
3. Se crédito está liquidado, marcar como LIQUIDADO
==========================================================
*/
async function registarReembolso(
  creditoId,
  parcelaId,
  valorReembolsado,
  dataReembolso = new Date()
) {
  try {
    const credito = await Credito.findByPk(creditoId);

    if (!credito) {
      throw new Error("Crédito não encontrado.");
    }

    // Não permitir reembolsos se crédito já está liquidado
    if (credito.estado === "LIQUIDADO") {
      throw new Error("Crédito já foi liquidado. Não é possível registar reembolsos.");
    }

    // 1. Atualizar a parcela (se fornecida)
    // Passa o valorReembolsado que será adicionado a valorPago
    let parcelaAtualizada = null;
    if (parcelaId) {
      parcelaAtualizada = await atualizarParcelaAposReembolso(
        creditoId,
        parcelaId,
        valorReembolsado,
        dataReembolso
      );
    }

    // 2. Atualizar saldo e estado do crédito
    // Decrementa saldoAtual e incrementa totalPago
    const creditoAtualizado = await atualizarSaldo(creditoId, valorReembolsado);

    return {
      credito: creditoAtualizado,
      parcela: parcelaAtualizada,
      sucesso: true,
    };
  } catch (error) {
    throw new Error(`Erro ao registar reembolso: ${error.message}`);
  }
}
/*
==========================================================
BUSCAR CRÉDITOS ELEGÍVEIS PARA REEMBOLSO
Retorna créditos ATIVO com parcelas não pagas
==========================================================
*/
async function buscarCreditosElegiveisReembolso(req, res) {
  try {
    const creditos = await Credito.findAll({
      where: {
        estado: "ATIVO",
      },
      include: [
        {
          model: ParcelaPagamento,
          as: "parcelas",
          where: {
            estado: {
              [Op.in]: ["PENDENTE", "ATRASADO"],
            },
          },
          separate: true,
          order: [["numeroParcela", "ASC"]],
          required: true,
        },
        {
          model: Mutuario,
          as: "mutuario",
          attributes: ["id", "nomeCompleto"],
          required: false,
        },
        {
          model: PedidoCredito,
          as: "pedido",
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(creditos);
  } catch (error) {
    console.error("Erro ao buscar créditos elegíveis:", error);
    return res.status(500).json({
      message: "Erro ao buscar créditos elegíveis",
      error: error.message,
    });
  }
}

/*
==========================================================
BUSCAR CRÉDITO COM REEMBOLSOS
Retorna um crédito com parcelas e reembolsos
==========================================================
*/
async function buscarCreditoComReembolsos(req, res) {
  try {
  const credito = await Credito.findByPk(req.params.creditoId, {
    include: [
      {
        model: ParcelaPagamento,
        as: "parcelas",
        order: [["numeroParcela", "ASC"]],
      },
      {
        model: Reembolso,
        as: "reembolsos",
        order: [["created_at", "DESC"]],
      },
      {
        model: PedidoCredito,
        as: "pedido",
      },
      {
        model: Mutuario,
        as: "mutuario",
        attributes: ["id", "nomeCompleto"],
      },
    ],
  });

  if (!credito) {
    return res.status(404).json({
      message: "Crédito não encontrado.",
    });
  }

  return res.status(200).json(credito);
  } catch (error) {
    console.error("Erro ao buscar crédito com reembolsos:", error);
    return res.status(500).json({
      message: "Erro ao buscar crédito com reembolsos",
      error: error.message,
    });
  }
}

async function getAllCreditos(req, res) {
  try {
    const creditos = await Credito.findAll({
      include: [
        {
          model: PedidoCredito,
          as: "pedido",
        },
        {
          model: Mutuario,
          as: "mutuario",
        },
        {
          model: User,
          as: "criador",
          attributes: ["id", "nome", "email", "role", "ativo"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json(creditos);
  } catch (error) {
    console.error("Erro ao listar créditos:", error);

    return res.status(500).json({
      message: "Erro interno ao listar créditos.",
      error: error.message,
    });
  }
}



module.exports = {
  listarMeusCreditos,
  buscarMeuCredito,
  criarCredito,
  atualizarSaldo,
  atualizarParcelaAposReembolso,
  registarReembolso,
  buscarCreditosElegiveisReembolso,
  buscarCreditoComReembolsos,
  getAllCreditos,
};