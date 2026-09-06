import { useEffect, useMemo, useState } from "react";
import { getMeRequest, loginRequest, logoutRequest, registerMutuarioRequest, registerUserRequest, } from "../api/auth.api";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
    Carrega sessão ao abrir a aplicação
  */
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return;
        }

        const me = await getMeRequest();
        setUser(me);
      } catch (error) {
        console.error("Erro ao recuperar sessão:", error);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  /*
    Login
  */
  const login = async (payload) => {
    const data = await loginRequest(payload);

    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user);

    return data;
  };

  const setSession = (token, userData, refreshToken) => {
    localStorage.setItem("token", token);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    setUser(userData);
  };

  /*
    Registo do mutuário
  */
  const registerMutuario = async (payload) => {
    const data = await registerMutuarioRequest(payload);

    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user);

    return data;
  };

  /*
    Registo do user
  */
  const registerUser = async (payload) => {
    const data = await registerUserRequest(payload);

    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user);

    return data;
  };

  /*
    Logout
  */
  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);

    // Best-effort: revoga no servidor para o refresh token não continuar
    // válido depois do logout (ver auth.controller.js: logout). Se
    // falhar (rede em baixo), a sessão local já está limpa na mesma.
    try {
      await logoutRequest(refreshToken);
    } catch (error) {
      console.error("Erro ao revogar sessão no servidor:", error);
    }
  };



  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      setSession,
      registerMutuario,
      registerUser,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}