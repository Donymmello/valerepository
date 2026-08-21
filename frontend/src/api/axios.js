import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
})

/*
  Interceptor para injetar o token automaticamente
*/
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Endpoints públicos de autenticação: um 401 aqui é "credenciais erradas",
// não "sessão expirada" — a própria página trata o erro, sem redirecionar.
const ENDPOINTS_AUTH_PUBLICOS = [
  "/auth/login",
  "/auth/register-mutuario",
  "/auth/register-mutuario-otp",
  "/auth/verify-otp",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/bootstrap-admin",
];

/*
  Interceptor de resposta: se o backend devolver 401 fora de um endpoint
  público de auth, a sessão deixou de ser válida (token expirado, ou a
  subscrição da empresa mudou de estado — o backend revalida isto em
  cada pedido). Em vez de cada página mostrar um erro genérico, limpa a
  sessão e manda para o login com um aviso.
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const isEndpointPublico = ENDPOINTS_AUTH_PUBLICOS.some((endpoint) => url.includes(endpoint));

    if (status === 401 && !isEndpointPublico) {
      localStorage.removeItem("token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?sessao=expirada";
      }
    }

    return Promise.reject(error);
  }
);

export default api;