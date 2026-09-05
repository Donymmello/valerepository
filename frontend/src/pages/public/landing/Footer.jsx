import { Box, Container, Typography, Stack, Link } from "@mui/material";
import Logomark from "./Logomark";
import { NOME_PLATAFORMA, NOME_EMPRESA } from "../../../theme";

const COLUNAS = [
  {
    titulo: "Produto",
    links: [
      { label: "Como Funciona", id: "como-funciona" },
      { label: "Funcionalidades", id: "funcionalidades" },
      { label: "Preços", id: "precos" },
      { label: "FAQ", id: "faq" },
    ],
  },
];

export default function Footer({ onScrollTo, onNavLogin, onNavTrial, isAuthenticated, onNavPortal }) {
  return (
    <Box component="footer" sx={{ bgcolor: "#0f1533", color: "rgba(255,255,255,0.72)", pt: 7, pb: 4 }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 5, sm: 8 }} sx={{ mb: 5 }}>
          <Box sx={{ flex: 1, maxWidth: 320 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
              <Logomark size={26} />
              <Typography sx={{ fontWeight: 800, color: "#fff" }}>{NOME_PLATAFORMA}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
              Plataforma de gestão de crédito para financeiras e microcrédito: pedidos, aprovação, desembolso e
              cobrança, tudo num só sistema.
            </Typography>
          </Box>

          {COLUNAS.map((coluna) => (
            <Box key={coluna.titulo}>
              <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, mb: 1.5 }}>
                {coluna.titulo}
              </Typography>
              <Stack spacing={1}>
                {coluna.links.map((link) => (
                  <Link
                    key={link.id}
                    component="button"
                    onClick={() => onScrollTo(link.id)}
                    underline="hover"
                    sx={{ color: "rgba(255,255,255,0.6)", textAlign: "left", fontSize: "0.875rem" }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Box>
          ))}

          <Box>
            <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, mb: 1.5 }}>
              Conta
            </Typography>
            <Stack spacing={1}>
              {isAuthenticated ? (
                <Link
                  component="button"
                  onClick={onNavPortal}
                  underline="hover"
                  sx={{ color: "rgba(255,255,255,0.6)", textAlign: "left", fontSize: "0.875rem" }}
                >
                  Ir para o Portal
                </Link>
              ) : (
                <>
                  <Link
                    component="button"
                    onClick={onNavLogin}
                    underline="hover"
                    sx={{ color: "rgba(255,255,255,0.6)", textAlign: "left", fontSize: "0.875rem" }}
                  >
                    Entrar
                  </Link>
                  <Link
                    component="button"
                    onClick={onNavTrial}
                    underline="hover"
                    sx={{ color: "rgba(255,255,255,0.6)", textAlign: "left", fontSize: "0.875rem" }}
                  >
                    Começar grátis
                  </Link>
                </>
              )}
            </Stack>
          </Box>
        </Stack>

        <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.1)", pt: 3 }}>
          <Typography variant="body2" align="center" sx={{ color: "rgba(255,255,255,0.5)" }}>
            &copy; {new Date().getFullYear()} {NOME_EMPRESA}. Todos os direitos reservados.
            Desenvolvido por Sidonio Aly.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
