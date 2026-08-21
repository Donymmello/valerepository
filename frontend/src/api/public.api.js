import api from "./axios";

/*
  ==========================================================
  API PÚBLICA (sem login obrigatório)
  ==========================================================
*/

/**
 * Simula um crédito. Requer autenticação (usado dentro do portal do
 * mutuário, em CriarPedido.jsx) — o axios interceptor já envia o header
 * Authorization automaticamente, e o backend associa a simulação ao user.
 */
export const simularCreditoRequest = async ({ valorSolicitado, prazo }) => {
  const response = await api.post("/simulacao/simular", { valorSolicitado, prazo });
  return response.data;
};

export const simularCalculoCreditoRequest = async (payload) => {
    const response = await api.post(
        "/simulacao/calcular",
        payload
    );

    return response.data;
};

/**
 * Lista as simulações do user autenticado (histórico no portal).
 */
export const getMinhasSimulacoesRequest = async () => {
  const response = await api.get("/simulacao/minhas");
  return response.data;
};

/**
 * Envia um pedido de acesso à plataforma (empresa interessada, via
 * formulário público da landing page). Não cria conta nem empresa —
 * fica registado para revisão manual.
 */
export const criarSolicitacaoAcessoRequest = async (payload) => {
  const response = await api.post("/solicitacoes-acesso", payload);
  return response.data;
};
