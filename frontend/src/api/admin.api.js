import api from "./axios";

/*
  ==========================================================
  API INTERNA - BACKOFFICE
  ==========================================================
*/

export const getAllPedidosRequest = async () => {
  const response = await api.get("/pedidos-credito");
  return response.data;
};

export const getPedidoByIdRequest = async (id) => {
  const response = await api.get(`/pedidos-credito/${id}`);
  return response.data;
};

export const getPedidosElegiveisDesembolsoRequest = async () => {
  const response = await api.get("/pedidos-credito/elegiveis-desembolso");
  return response.data;
};

export const getPedidosElegiveisReembolsoRequest = async () => {
  const response = await api.get("/pedidos-credito/elegiveis-reembolso");
  return response.data;
}

/*
  ==========================================================
  APROVAÇÕES
  ==========================================================
*/

export const getAprovacoesByPedidoRequest = async (pedidoId) => {
  const response = await api.get(`/aprovacoes/pedido/${pedidoId}`);
  return response.data;
};

export const decidirAprovacaoRequest = async (pedidoId, payload) => {
  const response = await api.post(`/aprovacoes/pedido/${pedidoId}/decidir`, payload);
  return response.data;
};

export const getMinhasAprovacoesRequest = async () => {
  const response = await api.get("/aprovacoes/minhas");
  return response.data;
};

export const getAllAprovacoesRequest = async () => {
  const response = await api.get("/aprovacoes");
  return response.data;
};

/*
  ==========================================================
  MUTUÁRIOS
  ==========================================================
*/

export const getAllMutuariosRequest = async () => {
  const response = await api.get("/mutuarios");
  return response.data;
};

export const getMutuarioByIdRequest = async (id) => {
  const response = await api.get(`/mutuarios/${id}`);
  return response.data;
};

export const updateMutuarioRequest = async (id, payload) => {
  const response = await api.put(`/mutuarios/${id}`, payload);
  return response.data;
};

export const deleteMutuarioRequest = async (id) => {
  const response = await api.delete(`/mutuarios/${id}`);
  return response.data;
};

/*
  ==========================================================
  DESEMBOLSOS
  ==========================================================
*/

export const getAllDesembolsosRequest = async () => {
  const response = await api.get("/desembolsos");
  return response.data;
};

export const getDesembolsosByPedidoRequest = async (pedidoId) => {
  const response = await api.get(`/desembolsos/pedido/${pedidoId}`);
  return response.data;
};

export const createDesembolsoRequest = async (payload) => {
  const response = await api.post("/desembolsos", payload);
  return response.data;
};

/*
  ==========================================================
  REEMBOLSOS
  ==========================================================
*/

export const getAllReembolsosRequest = async () => {
  const response = await api.get("/reembolsos");
  return response.data;
};

export const createReembolsoRequest = async (payload) => {
  const response = await api.post("/reembolsos", payload);
  return response.data;
};
