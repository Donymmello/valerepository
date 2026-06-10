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

export const updateMeuMutuarioRequest = async (payload) => {
  const response = await api.put("/portal/meu-mutuario", payload);
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

/*
  ==========================================================
  NOTIFICAÇÕES
  ==========================================================
*/
export const getMinhasNotificacoesRequest = async () => {
  const response = await api.get("/notificacoes/minhas");
  return response.data;
};

export const marcarNotificacaoComoLidaRequest = async (id) => {
  const response = await api.patch(`/notificacoes/${id}/lida`);
  return response.data;
};

export const marcarTodasNotificacoesComoLidasRequest = async () => {
  const response = await api.patch("/notificacoes/marcar-todas/lidas");
  return response.data;
};

export const deleteNotificacaoRequest = async (id) => {
  const response = await api.delete(`/notificacoes/${id}`);
  return response.data;
};

/*
  ==========================================================
  EXPORTAÇÃO PARA EXCEL
  ==========================================================
*/
export const exportarMeusPedidosExcelRequest = async () => {
  const response = await api.get("/portal/export/meus-pedidos", {
    responseType: "blob",
  });
  return response.data;
};

export const exportarMeuExtratoExcelRequest = async (id) => {
  const response = await api.get(`/portal/export/meu-extrato/${id}`, {
    responseType: "blob",
  });
  return response.data;
};