import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaSearch, FaUserCircle, FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notificacoesVisiveis, setNotificacoesVisiveis] = useState(false);

  // Notificações separadas por tipo de usuário
  const notificacoes =
    user?.role === "ADMIN" || user?.role === "GESTOR"
      ? ["Novo usuário cadastrado", "Novo empréstimo pendente"]
      : ["Seu empréstimo foi aprovado!", "Seu empréstimo foi rejeitado"];

  if (!user) return null;

  return (
    <nav className="navbar">
      {/* Caixa de Pesquisa */}
      <div className="search-box">
        <FaSearch className="search-icon" />
        <input type="text" placeholder="Pesquisar..." />
      </div>

      {/* Ícone de Notificações */}
      <div className="notificacoes-container">
        <FaBell className="notificacao-icon" onClick={() => setNotificacoesVisiveis(!notificacoesVisiveis)} />
        {notificacoes.length > 0 && <span className="notificacao-badge">{notificacoes.length}</span>}

        {notificacoesVisiveis && (
          <div className="notificacoes-dropdown">
            {notificacoes.length > 0 ? (
              notificacoes.map((notificacao, index) => (
                <div key={index} className="notificacao-item">{notificacao}</div>
              ))
            ) : (
              <p className="sem-notificacao">Sem notificações</p>
            )}
          </div>
        )}
      </div>

      {/* Clicar na imagem leva ao perfil */}
      <div className="user-info" onClick={() => navigate("/perfil")} style={{ cursor: "pointer" }}>
        {user?.foto ? (
          <img src={user.foto} alt="User" className="user-avatar" />
        ) : (
          <FaUserCircle className="user-icon" />
        )}
        <span className="user-name">{user?.nome || "Usuário"}</span>
      </div>
    </nav>
  );
};

export default Navbar;
