import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Emprestimos from "./pages/Emprestimos";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RecuperarSenha from "./pages/RecuperarSenha";
import EmprestimoForm from "./pages/EmprestimoForm"; // 🔥 Criar empréstimo


const App = () => {
  return (
    <Router>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </Router>
  );
};

const MainLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/recuperar-senha";

  return (
    <div className="app-container">
      {!isAuthPage && <Sidebar />}
      <div className="main-content">
        {!isAuthPage && <Navbar />}
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/dashboard" element={<Dashboard />} /> 
          <Route path="/emprestimos" element={<Emprestimos />} />
          <Route path="/novo-emprestimo" element={<EmprestimoForm />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Routes>
        {!isAuthPage && <Footer />}
      </div>
    </div>
  );
};

export default App;
