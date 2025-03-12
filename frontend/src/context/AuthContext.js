import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });
  const navigate = useNavigate(); // <== Aqui!

  useEffect(() => {
    const checkTokenExpiration = () => {
      if (!token || token.split('.').length !== 3) {
        logout();
        return;
      }
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        if (decodedToken.exp * 1000 < Date.now()) {
          logout();
        }
      } catch (error) {
        console.error("Erro ao decodificar token:", error);
        logout();
      }
    };
    checkTokenExpiration();
  }, [token]);

  const login = (token, userData) => {
    if (!token) return;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
    navigate('/dashboard'); // <== Redireciona automaticamente após login
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
