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
// não "sessão expirada", a própria página trata o erro, sem redirecionar.
const ENDPOINTS_AUTH_PUBLICOS = [
  "/auth/login",
  "/auth/register-mutuario",
  "/auth/register-mutuario-otp",
  "/auth/verify-otp",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/bootstrap-admin",
  "/auth/refresh",
  "/auth/logout",
];

function limparSessaoEIrParaLogin() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login?sessao=expirada";
  }
}

// Dedup do refresh: se N pedidos batem 401 ao mesmo tempo (ex: o
// dashboard a carregar vários recursos de uma vez com o access token já
// expirado), todos esperam pela MESMA chamada a /auth/refresh, só uma
// acontece de verdade. Sem isto, N chamadas em paralelo desperdiçavam
// pedidos e complicavam sem necessidade (o refresh token nem roda, ver
// emitirRefreshToken no backend, mas mesmo assim não há razão para
// disparar mais que uma).
let refreshEmCurso = null;

function tentarRenovarToken() {
  if (!refreshEmCurso) {
    const refreshToken = localStorage.getItem("refreshToken");

    refreshEmCurso = (
      refreshToken
        ? api.post("/auth/refresh", { refreshToken }).then((response) => {
            localStorage.setItem("token", response.data.token);
            return response.data.token;
          })
        : Promise.reject(new Error("Sem refresh token guardado."))
    ).finally(() => {
      refreshEmCurso = null;
    });
  }

  return refreshEmCurso;
}

/*
  Interceptor de resposta: se o backend devolver 401 fora de um endpoint
  público de auth, tenta primeiro renovar o access token em silêncio via
  refresh token (sem pedir password outra vez) e repetir o pedido
  original. Só limpa a sessão e manda para o login se o refresh também
  falhar (refresh token em falta, revogado ou expirado) ou se o pedido já
  tinha acabado de ser repetido uma vez (evita ciclo infinito).
*/
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;
    const url = originalRequest?.url || "";
    const isEndpointPublico = ENDPOINTS_AUTH_PUBLICOS.some((endpoint) => url.includes(endpoint));

    if (status === 401 && !isEndpointPublico && originalRequest && !originalRequest._jaTentouRenovar) {
      originalRequest._jaTentouRenovar = true;

      try {
        const novoToken = await tentarRenovarToken();
        originalRequest.headers.Authorization = `Bearer ${novoToken}`;
        return api(originalRequest);
      } catch {
        limparSessaoEIrParaLogin();
        return Promise.reject(error);
      }
    }

    if (status === 401 && !isEndpointPublico) {
      limparSessaoEIrParaLogin();
    }

    return Promise.reject(error);
  }
);

export default api;