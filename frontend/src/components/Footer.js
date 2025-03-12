import React from "react";
import "./Footer.css"; // 🔥 Para os estilos

const Footer = () => {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Sistema de Crédito - Todos os direitos reservados.</p>
    </footer>
  );
};

export default Footer;
