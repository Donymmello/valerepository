import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token } = useContext(AuthContext);

  if (!token) {
    console.warn("Usuário não autenticado, redirecionando para login...");
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;


// frontend/src/services/api.js
import axios from 'axios';
const api = axios.create({
  baseURL: 'http://localhost:8080/api'
});