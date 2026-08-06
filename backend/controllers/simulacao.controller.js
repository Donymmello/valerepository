const { Simulacao } = require("../models");
const calcularPrestacao = require("../utils/calCredito");

// =========================================================================
// HELPERS / ENGINE MATEMÁTICO (Evita duplicar lógica na API)
// =========================================================================
const TAXA_PADRAO = 18;

function processarValoresSimulacao(valor, prazoMeses) {
  const valorSolicitado = Number(valor);
  const prazo = Number(prazoMeses);

  if (!valor || !prazo || valorSolicitado <= 0 || prazo <= 0) {
    throw new Error("INVALID_INPUTS");
  }

  const prestacao = calcularPrestacao(valorSolicitado, TAXA_PADRAO, prazo);
  const montanteTotal = prestacao * prazo;
  const jurosTotal = montanteTotal - valorSolicitado;

  return { valorSolicitado, prazo, taxa: TAXA_PADRAO, prestacao, jurosTotal, montanteTotal };
}

// =========================================================================
// CONTROLLERS
// =========================================================================

/**
 * SIMULAR CRÉDITO (Persiste os dados)
 */
async function simular(req, res) {
  try {
    const { valorSolicitado, prazo } = req.body;
    
    // Delega validação e matemática para o helper único
    const dadosCalculados = processarValoresSimulacao(valorSolicitado, prazo);

    // Identifica contexto de autenticação de forma limpa
    const userId = req.user?.id || null;

    const simulacao = await Simulacao.create({
      userId,
      ...dadosCalculados
    });

    return res.status(201).json(simulacao);
  } catch (error) {
    if (error.message === "INVALID_INPUTS") {
      return res.status(400).json({ message: "Os campos valor e prazo são obrigatórios e devem ser maiores que zero." });
    }
    console.error("[Simular Error]:", error);
    return res.status(500).json({ message: "Erro ao simular crédito." });
  }
}

/**
 * CALCULAR CRÉDITO (Apenas memória / Volátil)
 */
async function calcular(req, res) {
  try {
    const { valorSolicitado, prazo } = req.body;
    const dadosCalculados = processarValoresSimulacao(valorSolicitado, prazo);
    
    return res.status(200).json(dadosCalculados);
  } catch (error) {
    if (error.message === "INVALID_INPUTS") {
      return res.status(400).json({ message: "Os campos valor e prazo são obrigatórios e devem ser maiores que zero." });
    }
    console.error("[Calcular Error]:", error);
    return res.status(500).json({ message: "Erro ao calcular crédito." });
  }
}

/**
 * LISTAR MINHAS SIMULAÇÕES
 */
async function listarMinhasSimulacoes(req, res) {
  try {
    const simulacoes = await Simulacao.findAll({
      where: { userId: req.user.id },
      // Ajustado para o padrão idiomático do Sequelize (created_at)
      order: [["created_at", "DESC"]], 
    });

    return res.status(200).json(simulacoes);
  } catch (error) {
    console.error("[ListarSimulacoes Error]:", error);
    return res.status(500).json({ message: "Erro ao listar simulações." });
  }
}

/**
 * RECLAMAR SIMULAÇÃO ANÓNIMA
 */
async function reclamarSimulacao(req, res) {
  try {
    const simulacao = await Simulacao.findByPk(req.params.id);

    if (!simulacao) {
      return res.status(404).json({ message: "Simulação não encontrada." });
    }

    if (simulacao.userId) {
      return res.status(409).json({ message: "Esta simulação já está associada a um utilizador." });
    }

    await simulacao.update({ userId: req.user.id });

    return res.status(200).json({
      message: "Simulação associada com sucesso.",
      simulacao,
    });
  } catch (error) {
    console.error("[ReclamarSimulacao Error]:", error);
    return res.status(500).json({ message: "Erro ao associar simulação." });
  }
}

module.exports = {
  simular,
  listarMinhasSimulacoes,
  reclamarSimulacao,
  calcular
};