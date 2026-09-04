import api from "./axios";

/*
  ==========================================================
  API SUPERADMIN, GESTÃO DA PLATAFORMA
  ==========================================================
*/

export const listarEmpresasSuperadminRequest = async () => {
  const response = await api.get("/superadmin/empresas");
  return response.data;
};

export const atualizarEmpresaSuperadminRequest = async (id, payload) => {
  const response = await api.patch(`/superadmin/empresas/${id}`, payload);
  return response.data;
};

export const listarSolicitacoesAcessoRequest = async () => {
  const response = await api.get("/solicitacoes-acesso");
  return response.data;
};

export const atualizarSolicitacaoAcessoRequest = async (id, estado) => {
  const response = await api.patch(`/solicitacoes-acesso/${id}`, { estado });
  return response.data;
};
