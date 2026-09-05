import { AppBar, Toolbar, Container, Stack, Typography, Button } from "@mui/material";
import { useEffect, useState } from "react";
import { CORES, NOME_PLATAFORMA } from "../../../theme";
import Logomark from "./Logomark";

const LINKS = [
  { id: "como-funciona", label: "Como Funciona" },
  { id: "funcionalidades", label: "Funcionalidades" },
  { id: "precos", label: "Preços" },
  { id: "faq", label: "FAQ" },
];

export default function Navbar({ isAuthenticated, onNavLogin, onNavPortal, onScrollTo, onScrollToTrial }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        top: 0,
        bgcolor: scrolled ? "rgba(255,255,255,0.82)" : "transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: "1px solid",
        borderColor: scrolled ? "rgba(15,23,42,0.08)" : "transparent",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: "space-between", px: "0 !important", py: 1 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Logomark />
            <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: CORES.marca, letterSpacing: -0.3 }}>
              {NOME_PLATAFORMA}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
            {LINKS.map((link) => (
              <Button
                key={link.id}
                color="inherit"
                onClick={() => onScrollTo(link.id)}
                sx={{ color: "text.secondary", fontWeight: 500, "&:hover": { color: CORES.marca, bgcolor: "transparent" } }}
              >
                {link.label}
              </Button>
            ))}
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {isAuthenticated ? (
              <Button variant="contained" disableElevation sx={{ borderRadius: 2, px: 2.5 }} onClick={onNavPortal}>
                Área do Cliente
              </Button>
            ) : (
              <>
                <Button
                  color="inherit"
                  onClick={onNavLogin}
                  sx={{ display: { xs: "none", sm: "inline-flex" }, color: "text.secondary", fontWeight: 500 }}
                >
                  Entrar
                </Button>
                <Button variant="contained" disableElevation sx={{ borderRadius: 2, px: 2.5 }} onClick={onScrollToTrial}>
                  Começar grátis
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
