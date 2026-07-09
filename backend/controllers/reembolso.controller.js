const { Reembolso, Credito, ParcelaPagamento, User, Desembolso } = require("../models");
const registrarLogAuditoria = require("../utils/logAuditoria");
const { generateReferencia } = require("../utils/generateCode");
const CreditoService = require("../services/credito.service");
const {
  podeRegistrarReembolso,
  ESTADO_CREDITO,
} = require("../utils/regrasCredito");

/*
    ==========================================================
    FUNÇÃO AUXILIAR PARA CALCULAR O ESTADO FINANCEIRO DO PEDIDO
    SE O CRÉDITO ESTIVER TOTALMENTE REEMBOLSADO, FECHA AUTOMATICAMENTE
    
    NOTA: Agora usa estado "LIQUIDADO" do Credito (não STATUS_PEDIDO.ENCERRADO)
    ==========================================================
*/
async function calcularEstadoFinanceiro(creditoId, userId) {
  /*
    Buscar o crédito
  */
  const credito = await Credito.findByPk(creditoId);

  if (!credito) return;

  /*
    Se o crédito foi liquidado pelo CreditoService,
    registar evento de auditoria
  */
  if (credito.estado === "LIQUIDADO") {
    await registrarLogAuditoria({
      userId,
      acao: "CREDITO_LIQUIDADO_POR_REEMBOLSO",
      entidade: "Credito",
      entidadeId: creditoId,
      descricao: `Crédito ${credito.numeroContrato} foi liquidado automaticamente após reembolso total.`,
    });
  }
}

/*
    ==========================================================
    CRIAR REEMBOLSO
    
    FLUXO:
    1. Validar entrada e permissões
    2. Gerar referência
    3. Criar registro Reembolso
    4. Chamar CreditoService.registarReembolso() para orquestrar atualizações:
       - Atualizar parcela (PAGO)
       - Atualizar saldo do crédito
       - Se saldo <= 0, marcar como LIQUIDADO
    5. Registar auditoria
    6. Retornar resultado
    ==========================================================
*/
async function createReembolso(req, res) {
  try {
    const {
      creditoId,
      parcelaId,
      valorReembolsado,
      dataReembolso,
      meioPagamento,
      numeroTransacao,
      observacoes,
    } = req.body;

    // Validações básicas
    if (!creditoId || !valorReembolsado) {
      return res.status(400).json({
        message: "creditoId e valorReembolsado são obrigatórios.",
      });
    }

    if (Number(valorReembolsado) <= 0) {
      return res.status(400).json({
        message: "Valor do reembolso deve ser maior que zero.",
      });
    }

    // Buscar crédito
    const credito = await Credito.findByPk(creditoId);

    if (!credito) {
      return res.status(404).json({
        message: "Crédito não encontrado.",
      });
    }

    /*
      Regra forte: validar perfil + status permitido para reembolso
    */
    if (!podeRegistrarReembolso(req.user, credito)) {
      return res.status(403).json({
        message:
          "Não tens permissão para registar reembolso neste crédito ou o status atual não permite.",
      });
    }

    // ================================================================
    // PASSO 1: Criar registro de Reembolso
    // ================================================================
    const reembolso = await Reembolso.create({
      creditoId,
      parcelaId: parcelaId || null,
      valorReembolsado,
      dataReembolso: dataReembolso || new Date(),
      meioPagamento: meioPagamento || "TRANSFERENCIA",
      numeroTransacao: numeroTransacao || null,
      referencia: await generateReferencia(),
      observacoes: observacoes || null,
      createdBy: req.user.id,
    });

    // ================================================================
    // PASSO 2: Orquestrar as atualizações financeiras
    // ================================================================
    // Chamar CreditoService para:
    // - Atualizar a parcela (PAGO)
    // - Atualizar saldo do crédito (totalPago, saldoAtual)
    // - Se saldo <= 0, marcar como LIQUIDADO
    const resultado = await CreditoService.registarReembolso(
      creditoId,
      parcelaId || null,
      valorReembolsado,
      dataReembolso ? new Date(dataReembolso) : new Date()
    );

    // ================================================================
    // PASSO 3: Registar auditoria
    // ================================================================
    await registrarLogAuditoria({
      userId: req.user.id,
      acao: "CRIAR_REEMBOLSO",
      entidade: "Reembolso",
      entidadeId: reembolso.id,
      descricao: `Reembolso de ${valorReembolsado} criado para crédito ${credito.numeroContrato}.`,
    });

    // ================================================================
    // PASSO 4: Calcular estado financeiro (verifica se foi liquidado)
    // ================================================================
    await calcularEstadoFinanceiro(creditoId, req.user.id);

    // ================================================================
    // PASSO 5: Retornar resposta com dados atualizados
    // ================================================================
    const creditoAtualizado = await Credito.findByPk(creditoId);

    return res.status(201).json({
      message: "Reembolso criado com sucesso.",
      reembolso,
      credito: {
        id: creditoAtualizado.id,
        numeroContrato: creditoAtualizado.numeroContrato,
        estado: creditoAtualizado.estado,
        saldoAtual: creditoAtualizado.saldoAtual,
        totalPago: creditoAtualizado.totalPago,
        montanteTotal: creditoAtualizado.montanteTotal,
      },
      parcela: resultado.parcela ? {
        id: resultado.parcela.id,
        numeroParcela: resultado.parcela.numeroParcela,
        estado: resultado.parcela.estado,
        dataPagamento: resultado.parcela.dataPagamento,
      } : null,
    });
  } catch (error) {
    console.error("Erro ao criar reembolso:", error);

    return res.status(500).json({
      message: "Erro interno ao criar reembolso.",
      error: error.message,
    });
  }
}

/*
    ==========================================================
    LISTAR TODOS OS REEMBOLSOS
    ==========================================================
*/
async function getAllReembolsos(req, res) {
  try {
    const reembolsos = await Reembolso.findAll({
      include: [
        {
          model: Credito,
          as: "credito",
        },
        {
          model: ParcelaPagamento,
          as: "parcela",
        },
        {
          model: User,
          as: "criador",
          attributes: ["id", "nome", "email", "role"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json(reembolsos);
  } catch (error) {
    console.error("Erro ao listar reembolsos:", error);

    return res.status(500).json({
      message: "Erro interno ao listar reembolsos.",
      error: error.message,
    });
  }
}

/*
    ==========================================================
    LISTAR REEMBOLSOS POR CRÉDITO
    ==========================================================
*/
async function getReembolsoByCredito(req, res) {
  try {
    const { creditoId } = req.params;

    const reembolsos = await Reembolso.findAll({
      where: { creditoId },
      include: [
        {
          model: Credito,
          as: "credito",
        },
        {
          model: User,
          as: "criador",
          attributes: ["id", "nome", "email", "role"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(reembolsos);
  } catch (error) {
    console.error("Erro ao listar reembolsos por crédito:", error);

    return res.status(500).json({
      message: "Erro interno ao listar reembolsos por crédito.",
      error: error.message,
    });
  }
}

/*
    ==========================================================
    OBTER DETALHES DE UM REEMBOLSO
    ==========================================================
*/
async function obterReembolso(req, res) {
  try {
    const { reembolsoId } = req.params;

    const reembolso = await Reembolso.findByPk(reembolsoId, {
      include: [
        {
          model: Credito,
          as: "credito",
        },
        {
          model: ParcelaPagamento,
          as: "parcela",
        },
        {
          model: User,
          as: "criador",
          attributes: ["id", "nome", "email"],
        },
      ],
    });

    if (!reembolso) {
      return res.status(404).json({
        message: "Reembolso não encontrado.",
      });
    }

    return res.status(200).json(reembolso);
  } catch (error) {
    console.error("Erro ao obter reembolso:", error);

    return res.status(500).json({
      message: "Erro interno ao obter reembolso.",
      error: error.message,
    });
  }
}

module.exports = {
  createReembolso,
  getAllReembolsos,
  getReembolsoByCredito,
  obterReembolso,
};