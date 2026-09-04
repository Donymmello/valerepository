import api from "./axios";

/*
  ==========================================================
  API PÚBLICA (sem login obrigatório)
  ==========================================================
*/

/**
 * Simula um crédito e PERSISTE o resultado (POST /simulacao/simular, ver
 * simulacao.controller.js), associado ao user quando autenticado. Não é
 * chamada por nenhum ecrã atualmente: CriarPedido.jsx usa
 * simularCalculoCreditoRequest (abaixo) para o cálculo ao vivo enquanto
 * o utilizador escreve, porque gravar uma linha a cada tecla não faz
 * sentido. Fica disponível para um futuro ecrã que precise mesmo de
 * guardar simulações (ver getMinhasSimulacoesRequest).
 */
export const simularCreditoRequest = async ({ valorSolicitado, prazo }) => {
  const response = await api.post("/simulacao/simular", { valorSolicitado, prazo });
  return response.data;
};

/**
 * Calcula um crédito sem gravar nada (POST /simulacao/calcular), usado
 * por CriarPedido.jsx para a simulação ao vivo enquanto o utilizador
 * preenche valor/prazo.
 */
export const simularCalculoCreditoRequest = async (payload) => {
    const response = await api.post(
        "/simulacao/calcular",
        payload
    );

    return response.data;
};

/**
 * Lista as simulações persistidas do user autenticado. Só tem dados se
 * algo chamar simularCreditoRequest (acima), hoje nenhum ecrã o faz, e
 * a página que consumia isto (pages/portal/Simulacoes.jsx) não está
 * roteada de propósito (decisão explícita: só o simulador dentro de
 * Criar Pedido, sem histórico separado, por agora).
 */
export const getMinhasSimulacoesRequest = async () => {
  const response = await api.get("/simulacao/minhas");
  return response.data;
};

/**
 * Envia um pedido de acesso à plataforma (empresa interessada, via
 * formulário público da landing page). Não cria conta nem empresa,
 * fica registado para revisão manual.
 */
export const criarSolicitacaoAcessoRequest = async (payload) => {
  const response = await api.post("/solicitacoes-acesso", payload);
  return response.data;
};
