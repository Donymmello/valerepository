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

/*
  ==========================================================
  RELATÓRIOS
  ==========================================================
*/

export const getResumoGeralRequest = async () => {
  const response = await api.get("/relatorios/resumo-geral");
  return response.data;
};

export const getRelatorioPedidosRequest = async (params = {}) => {
  const response = await api.get("/relatorios/pedidos", { params });
  return response.data;
};

export const getRelatorioFinanceiroPedidosRequest = async () => {
  const response = await api.get("/relatorios/financeiro-pedidos");
  return response.data;
};

export const getRelatorioDesembolsosRequest = async (params = {}) => {
  const response = await api.get("/relatorios/desembolsos", { params });
  return response.data;
};

export const getRelatorioReembolsosRequest = async (params = {}) => {
  const response = await api.get("/relatorios/reembolsos", { params });
  return response.data;
};

/*
  ==========================================================
  REQUISITOS PEDIDO
  ==========================================================
*/
export const getAllRequisitosRequest = async () => {
  const response = await api.get("/requisitos-credito");
  return response.data;
};

export const createRequisitoRequest = async (payload) => {
  const response = await api.post("/requisitos-credito", payload);
  return response.data;
};

export const updateRequisitoRequest = async (id, payload) => {
  const response = await api.put(`/requisitos-credito/${id}`, payload);
  return response.data;
};

export const getRequisitosByPedidoRequest = async (pedidoId) => {
  const response = await api.get(`/pedido-requisitos/pedido/${pedidoId}`);
  return response.data;
};

export const adicionarPedidoRequisitoRequest = async (pedidoId, payload) => {
  const response = await api.post(`/pedido-requisitos/pedido/${pedidoId}`, payload);
  return response.data;
};

export const validarRequisitoPedidoRequest = async (id, payload) => {
  const response = await api.patch(`/pedido-requisitos/${id}/validar`, payload);
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

export const getNotificacaoByIdRequest = async (id) => {
  const response = await api.get(`/notificacoes/${id}`);
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
  LOGS
  ==========================================================
*/
export const getAllLogsAuditoriaRequest = async () => {
  const response = await api.get("/logs-auditoria");
  return response.data;
};

export const getMeusLogsAuditoriaRequest = async () => {
  const response = await api.get("/logs-auditoria/meus");
  return response.data;
};

export const getLogAuditoriaByIdRequest = async (id) => {
  const response = await api.get(`/logs-auditoria/${id}`);
  return response.data;
};

/*
  ==========================================================
  EXTRATOS
  ==========================================================
*/
export const getExtratoPedidoInternoRequest = async (pedidoId) => {
  const response = await api.get(`/extrato/pedido/${pedidoId}`);
  return response.data;
};

/*
  ==========================================================
  IMPORTS/EXPORTS
  ==========================================================
*/
export const exportarMutuariosExcelRequest = async () => {
  const response = await api.get("/export/mutuarios", {
    responseType: "blob",
  });
  return response.data;
};

export const exportarPedidosExcelRequest = async () => {
  const response = await api.get("/export/pedidos", {
    responseType: "blob",
  });
  return response.data;
};

export const exportarDesembolsosExcelRequest = async () => {
  const response = await api.get("/export/desembolsos", {
    responseType: "blob",
  });
  return response.data;
};

export const exportarReembolsosExcelRequest = async () => {
  const response = await api.get("/export/reembolsos", {
    responseType: "blob",
  });
  return response.data;
};

export const exportarRelatorioFinanceiroExcelRequest = async () => {
  const response = await api.get("/export/relatorio-financeiro", {
    responseType: "blob",
  });
  return response.data;
};

export const importarMutuariosExcelRequest = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/import/mutuarios", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const importarPedidosExcelRequest = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/import/pedidos", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/*
  ==========================================================
  ALERTAS DE PRAZOS
  ==========================================================
*/
export const verificarAlertasPrazoRequest = async () => {
  const response = await api.post("/alertas-prazo/verificar");
  return response.data;
};

// ================================================================
// ADICIONAR ESTAS FUNÇÕES AO admin_api.js
// (na secção REQUISITOS PEDIDO, a seguir a validarRequisitoPedidoRequest)
// ================================================================

/*
  ==========================================================
  ANEXOS DO REQUISITO (BACKOFFICE)
  ==========================================================
*/

/**
 * Lista os anexos enviados pelo mutuário para um requisito do pedido.
 * pedidoRequisitoId = item.id da lista de requisitosPedido
 */
export const getAnexosByRequisitoRequest = async (pedidoRequisitoId) => {
  const response = await api.get(`/anexos/requisito/${pedidoRequisitoId}`);
  return response.data;
};

/**
 * Faz o download de um anexo via axios (envia o header Authorization automaticamente)
 * e devolve um blob. O authMiddleware só aceita token via header, por isso não dá
 * para usar um <a href> simples — o browser não envia esse header numa navegação directa.
 */
export const downloadAnexoRequest = async (anexoId) => {
  const response = await api.get(`/anexos/${anexoId}/download`, {
    responseType: "blob",
  });
  return response; // devolve a response completa para extrair o filename dos headers
};

/*
  ==========================================================
  COMPROVATIVOS (BACKOFFICE)
  ==========================================================
*/

/**
 * Lista todos os comprovativos de um pedido.
 */
export const getComprovatiosByPedidoRequest = async (pedidoId) => {
  const response = await api.get(`/comprovativos/pedido/${pedidoId}`);
  return response.data;
};

/**
 * Valida ou rejeita um comprovativo.
 * Se estado === "VALIDADO", cria automaticamente o reembolso.
 */
export const validarComprovatioRequest = async (id, payload) => {
  const response = await api.patch(`/comprovativos/${id}/validar`, payload);
  return response.data;
};

/**
 * Baixa um comprovativo (via blob, com token no header).
 */
export const downloadComprovatioRequest = async (id, nome) => {
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