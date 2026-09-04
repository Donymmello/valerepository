import { Box, Container, Typography, Button, Stack, Chip } from "@mui/material";
import { ArrowForward, PlayCircleOutline } from "@mui/icons-material";
import { CORES } from "../../../theme";
import DashboardMock from "./DashboardMock";

const BADGES = [
  "Multi-empresa",
  "Aprovação por níveis",
  "Notificações automáticas",
  "Exportação PDF/Excel",
  "Auditoria completa",
];

export default function Hero({ isAuthenticated, onPrimaryCta, onScrollToHowItWorks }) {
  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      {/* mancha de luz subtil atrás do hero, um único degradé, sem exagerar */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: -220,
          left: "50%",
          width: 900,
          height: 700,
          transform: "translateX(-50%)",
          background: `radial-gradient(closest-side, ${CORES.marca}1f, transparent)`,
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", pt: { xs: 6, md: 9 }, pb: { xs: 8, md: 11 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 6, md: 4 }} alignItems="center">
          {/* Coluna de texto */}
          <Box sx={{ flex: 1, maxWidth: { md: 540 } }}>
            <Chip
              label="Feito para financeiras e microcrédito"
              size="small"
              sx={{
                mb: 2.5,
                fontWeight: 600,
                bgcolor: `${CORES.marca}14`,
                color: CORES.marca,
              }}
            />

            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: -1,
                lineHeight: 1.08,
                mb: 2.5,
                fontSize: { xs: "2.25rem", sm: "2.75rem", md: "3.25rem" },
                color: "#0f172a",
              }}
            >
              A operação de crédito da tua financeira, num só sistema.
            </Typography>

            <Typography variant="h6" sx={{ mb: 4, fontWeight: 400, color: "text.secondary", lineHeight: 1.6 }}>
              Pedidos, aprovação por níveis, desembolso, cobrança e relatórios. Com a tua própria equipa e taxas, e
              os dados sempre isolados de qualquer outra financeira na plataforma.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                size="large"
                disableElevation
                endIcon={<ArrowForward />}
                onClick={onPrimaryCta}
                sx={{ borderRadius: 2, px: 3.5, py: 1.4, fontSize: "1rem" }}
              >
                {isAuthenticated ? "Ir para o Portal" : "Começar grátis por 7 dias"}
              </Button>
              {!isAuthenticated && (
                <Button
                  variant="text"
                  size="large"
                  startIcon={<PlayCircleOutline />}
                  onClick={onScrollToHowItWorks}
                  sx={{ borderRadius: 2, px: 2, color: "text.secondary", fontWeight: 600 }}
                >
                  Ver como funciona
                </Button>
              )}
            </Stack>

            {!isAuthenticated && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Sem cartão de crédito. Se és mutuário, pede o link de registo à tua financeira.
              </Typography>
            )}

            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 4 }}>
              {BADGES.map((badge) => (
                <Chip
                  key={badge}
                  label={badge}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "rgba(15,23,42,0.12)", color: "text.secondary", fontWeight: 500 }}
                />
              ))}
            </Stack>
          </Box>

          {/* Coluna do mockup */}
          <Box sx={{ flex: 1, width: "100%", maxWidth: 480, display: { xs: "none", sm: "block" } }}>
            <DashboardMock />
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
