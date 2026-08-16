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


/**
 * Faz upload do documento para um requisito específico do pedido.
 * Envia como multipart/form-data com o campo "file".
 */
export const uploadRequisitoDocumentoRequest = async (pedidoRequisitoId, file) => {
  const formData = new FormData();
  formData.append("arquivo", file);

  // Idem: sem Content-Type manual, para o browser gerar o boundary.
  const response = await api.post(
    `/portal/meus-pedidos/upload/${pedidoRequisitoId}/requisitos`,
    formData
  );

  return response.data;
};

/*
  ==========================================================
  COMPROVATIVOS (PORTAL MUTUÁRIO)
  ==========================================================
*/

/**
 * Envia comprovativo de pagamento para um pedido.
 * Só funciona para pedidos com status DESEMBOLSADO.
 */
export const enviarComprovativoRequest = async (creditoId, parcelaId, file) => {
  const formData = new FormData();
  formData.append("comprovativo", file);

  // Não definir Content-Type à mão: o browser precisa de gerar o
  // "boundary" sozinho a partir do FormData, senão o multer não
  // consegue interpretar o corpo do pedido.
  const response = await api.post(
    `/comprovativos/portal/credito/${creditoId}/parcela/${parcelaId}/enviar`,
    formData
  );

  return response.data;
};

/**
 * Lista os comprovativos enviados pelo mutuário para um pedido.
 */
export const getMeusComprovativosRequest = async (creditoId) => {
  const response = await api.get(`/comprovativos/portal/credito/${creditoId}`);
  return response.data;
};

/**
 * Baixa um comprovativo (via blob, tal como os anexos).
 */
export const downloadComprovativoRequest = async (id, nome) => {
  const response = await api.get(`/comprovativos/${id}/download`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", nome || "comprovativo");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getMeusCreditosRequest = async () => {
    const response = await api.get("/portal/meus-creditos");
    return response.data;
};

export const getMeuCreditoRequest = async (id) => {
    const response = await api.get(`/portal/meus-creditos/${id}`);
    return response.data;
};
