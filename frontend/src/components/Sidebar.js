import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaHome, FaMoneyBillWave, FaUser, FaSignOutAlt, FaPlusCircle } from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

  // Se a página for login ou registro, não mostra a sidebar
  if (location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/recuperar-senha") {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <h2>Sistema de Crédito</h2>
      <ul>
        <li>
          <Link to="/dashboard">
            <FaHome /> Dashboard
          </Link>
        </li>
        <li>
          <Link to="/emprestimos">
            <FaMoneyBillWave /> {user?.role === "ADMIN" ? "Empréstimos" : "Meus Empréstimos"}
          </Link>
        </li>
        {user?.role !== "ADMIN" && ( // 🔥 Só usuários normais podem criar empréstimos
          <li>
            <Link to="/novo-emprestimo">
              <FaPlusCircle /> Criar Empréstimo
            </Link>
          </li>
        )}
        {user?.role === "ADMIN" && (
          <li>
            <Link to="/usuarios">
              <FaUser /> Usuários
            </Link>
          </li>
        )}
        <li onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt /> Sair
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
