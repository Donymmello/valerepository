import api from "./axios";

/*
  ==========================================================
  API PÚBLICA (sem login obrigatório)
  ==========================================================
*/

/**
 * Simula um crédito. Funciona com ou sem autenticação:
 * - Se o user estiver logado (token no localStorage), o axios
 *   interceptor já envia o header Authorization automaticamente,
 *   e o backend associa a simulação ao user.
 * - Se for visitante anónimo, a simulação fica "órfã" (userId null)
 *   até ser reclamada depois do registo/login (ver reclamarSimulacaoRequest).
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
 * Associa uma simulação anónima (feita antes do login) ao
 * user que acabou de se autenticar. Requer token válido.
 */
export const reclamarSimulacaoRequest = async (simulacaoId) => {
  const response = await api.patch(`/simulacao/${simulacaoId}/reclamar`);
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
