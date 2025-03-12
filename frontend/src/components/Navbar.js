import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null; // 🔥 Navbar só aparece se o usuário estiver logado

  return (
    <nav className="navbar">
      <div className="search-box">
        <FaSearch className="search-icon" />
        <input type="text" placeholder="Pesquisar..." />
      </div>
      <div className="user-info">
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
