const { Simulacao } = require("../models");
const calcularPrestacao = require("../utils/calCredito");

/*
  ==========================================================
  SIMULAR CRÉDITO
  ==========================================================
  Regra:
  - Funciona com ou sem autenticação (rota pública).
  - Se o user estiver autenticado (req.user existe), a
    simulação já fica associada a ele.
  - Se for anónimo, a simulação é guardada com userId null,
    e o id devolvido pode ser usado depois em
    "reclamarSimulacao" quando a pessoa se registar.
*/
async function simular(req, res) {
  try {
    const { valorSolicitado, prazo } = req.body;

    if (!valorSolicitado || !prazo) {
      return res.status(400).json({
        message: "Os campos valor e prazo são obrigatórios.",
      });
    }

    if (Number(valorSolicitado) <= 0 || Number(prazo) <= 0) {
      return res.status(400).json({
        message: "valor e prazo devem ser maiores que zero.",
      });
    }

    const taxa = 18;

    const prestacao = calcularPrestacao(Number(valorSolicitado), taxa, Number(prazo));
    const montanteTotal = prestacao * Number(prazo);
    const jurosTotal = montanteTotal - Number(valorSolicitado);

    // req.user só existe se a rota passar por authMiddleware (user autenticado).
    // Para visitantes anónimos, authMiddleware não corre nesta rota, e req.user fica undefined.
    const userId = req.user?.id || null;

    const simulacao = await Simulacao.create({
      userId,
      valorSolicitado,
      prazo,
      taxa,
      prestacao,
      jurosTotal,
      montanteTotal,
    });

    return res.status(201).json(simulacao);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao simular crédito.",
    });
  }
}

/*
  ==========================================================
  LISTAR MINHAS SIMULAÇÕES
  ==========================================================
  Regra:
  - Rota protegida (precisa de authMiddleware).
  - Devolve só as simulações do user autenticado.
*/
async function listarMinhasSimulacoes(req, res) {
  try {
    const simulacoes = await Simulacao.findAll({
      where: { userId: req.user.id },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(simulacoes);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao listar simulações.",
    });
  }
}

/*
  ==========================================================
  RECLAMAR SIMULAÇÃO ANÓNIMA
  ==========================================================
  Regra:
  - Rota protegida (precisa de authMiddleware, user já logado/registado).
  - Associa uma simulação feita antes do login/registo ao user actual.
  - Só reclama se a simulação ainda não tiver dono (userId null),
    para evitar que alguém "roube" a simulação de outro user.
*/
async function reclamarSimulacao(req, res) {
  try {
    const { id } = req.params;

    const simulacao = await Simulacao.findByPk(id);

    if (!simulacao) {
      return res.status(404).json({
        message: "Simulação não encontrada.",
      });
    }

    if (simulacao.userId) {
      return res.status(409).json({
        message: "Esta simulação já está associada a um utilizador.",
      });
    }

    await simulacao.update({ userId: req.user.id });

    return res.status(200).json({
      message: "Simulação associada com sucesso.",
      simulacao,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao associar simulação.",
    });
  }
}

module.exports = {
  simular,
  listarMinhasSimulacoes,
  reclamarSimulacao,
};