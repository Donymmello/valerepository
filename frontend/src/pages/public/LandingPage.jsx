import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Box } from "@mui/material";
import { useAuth } from "../../context/useAuth";
import Navbar from "./landing/Navbar";
import Hero from "./landing/Hero";
import HowItWorks from "./landing/HowItWorks";
import Features from "./landing/Features";
import Precos from "./landing/Precos";
import TrialSection from "./landing/TrialSection";
import Faq from "./landing/Faq";
import Footer from "./landing/Footer";

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

// Mesmos 3 valores do ENUM Empresa.plano (backend). Qualquer outra coisa
// (ex: o evento de clique dos CTAs genéricos do Hero/Navbar/Footer, que
// não escolhem plano nenhum) cai no STARTER por omissão.
const PLANOS_VALIDOS = ["STARTER", "BUSINESS", "ENTERPRISE"];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [planoEscolhido, setPlanoEscolhido] = useState("STARTER");

  const irParaLogin = () => navigate("/login");
  const irParaPortal = () => navigate("/portal");
  const irParaTrial = (plano) => {
    setPlanoEscolhido(PLANOS_VALIDOS.includes(plano) ? plano : "STARTER");
    scrollToSection("sou-financeira");
  };

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      <Navbar
        isAuthenticated={isAuthenticated}
        onNavLogin={irParaLogin}
        onNavPortal={irParaPortal}
        onScrollTo={scrollToSection}
        onScrollToTrial={irParaTrial}
      />

      <Hero
        isAuthenticated={isAuthenticated}
        onPrimaryCta={isAuthenticated ? irParaPortal : irParaTrial}
        onScrollToHowItWorks={() => scrollToSection("como-funciona")}
      />

      <HowItWorks />
      <Features />
      <Precos onNavTrial={irParaTrial} />

      {!isAuthenticated && <TrialSection planoEscolhido={planoEscolhido} />}

      <Faq />

      <Footer
        onScrollTo={scrollToSection}
        onNavLogin={irParaLogin}
        onNavTrial={irParaTrial}
        isAuthenticated={isAuthenticated}
        onNavPortal={irParaPortal}
      />
    </Box>
  );
}
