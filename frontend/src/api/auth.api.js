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