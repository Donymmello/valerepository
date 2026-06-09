import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMeRequest, loginRequest, registerMutuarioRequest, registerUserRequest, } from "../api/auth.api";

const AuthContext = createContext(null);

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
    setUser(data.user);

    return data;
  };

  /*
    Registo do mutuário
  */
  const registerMutuario = async (payload) => {
    const data = await registerMutuarioRequest(payload);

    localStorage.setItem("token", data.token);
    setUser(data.user);

    return data;
  };

  /*
    Registo do user
  */
  const registerUser = async (payload) => {
    const data = await registerUserRequest(payload);

    localStorage.setItem("token", data.token);
    setUser(data.user);

    return data;
  };

  /*
    Logout
  */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      registerMutuario,
      registerUser,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}