import api from "./axios";

export const loginRequest = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const registerMutuarioRequest = async (payload) => {
  const response = await api.post("/auth/register-mutuario", payload);
  return response.data;
};

export const getMeRequest = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};