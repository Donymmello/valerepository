import api from "./axios";

/*
  ==========================================================
  API DO PORTAL DO MUTUÁRIO
  ==========================================================
*/

export const getMeuMutuarioRequest = async () => {
  const response = await api.get("/portal/meu-mutuario");
  return response.data;
};

export const getMeusPedidosRequest = async () => {
  const response = await api.get("/portal/meus-pedidos");
  return response.data;
};

export const getMeuPedidoByIdRequest = async (id) => {
  const response = await api.get(`/portal/meus-pedidos/${id}`);
  return response.data;
};

export const createMeuPedidoRequest = async (payload) => {
  const response = await api.post("/portal/meus-pedidos", payload);
  return response.data;
};

export const getMeuExtratoPedidoRequest = async (id) => {
  const response = await api.get(`/portal/meus-pedidos/${id}/extrato`);
  return response.data;
};