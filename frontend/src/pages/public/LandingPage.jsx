import { useNavigate } from "react-router-dom";
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

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const irParaLogin = () => navigate("/login");
  const irParaPortal = () => navigate("/portal");
  const irParaTrial = () => scrollToSection("sou-financeira");

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

      {!isAuthenticated && <TrialSection />}

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
