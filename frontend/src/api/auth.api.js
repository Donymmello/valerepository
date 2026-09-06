import api from "./axios";

export const loginRequest = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

// Cria uma Empresa nova + o seu primeiro ADMIN (usado pelo painel SUPERADMIN)
export const bootstrapAdminRequest = async (payload) => {
  const response = await api.post("/auth/bootstrap-admin", payload);
  return response.data;
};

export const registerMutuarioRequest = async (payload) => {
  const response = await api.post("/auth/register-mutuario", payload);
  return response.data;
};

export const registerUserRequest = async (payload) => {
  const response = await api.post("/auth/register-interno", payload);
  return response.data;
};

export const createConvitePortalRequest = async (payload) => {
  const response = await api.post("/auth/convite-portal", payload);
  return response.data;
};

export const getMeRequest = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const forgotPasswordRequest = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPasswordRequest = async (payload) => {
  const response = await api.post("/auth/reset-password", payload);
  return response.data;
};

export const registerMutuarioWithOTPRequest = async (payload) => {
  const response = await api.post("/auth/register-mutuario-otp", payload);
  return response.data;
};

export const verifyOTPRequest = async (payload) => {
  const response = await api.post("/auth/verify-otp", payload);
  return response.data;
};

// Troca o refreshToken guardado por um novo access token, sem pedir
// password de novo. Ver interceptor de resposta em ./axios.js, que chama
// isto automaticamente quando um pedido dá 401.
export const refreshTokenRequest = async (refreshToken) => {
  const response = await api.post("/auth/refresh", { refreshToken });
  return response.data;
};

// Revoga o refreshToken no servidor (ver auth.controller.js: logout).
// Best-effort: se falhar (rede em baixo, token já expirado), o logout no
// frontend continua, só limpa a sessão local mesmo assim.
export const logoutRequest = async (refreshToken) => {
  if (!refreshToken) return;
  await api.post("/auth/logout", { refreshToken });
};