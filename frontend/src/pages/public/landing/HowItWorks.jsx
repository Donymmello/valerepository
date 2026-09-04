import { Box, Container, Typography, Stack } from "@mui/material";
import { CORES } from "../../../theme";

const PASSOS = [
  {
    numero: "1",
    titulo: "Cria a tua conta",
    descricao: "Regista a tua financeira e a conta de administrador em poucos minutos, sem cartão de crédito.",
  },
  {
    numero: "2",
    titulo: "Configura a equipa e as taxas",
    descricao: "Convida analistas, gestores e diretores; define as tuas taxas de juro e os níveis de aprovação.",
  },
  {
    numero: "3",
    titulo: "Convida os teus mutuários",
    descricao: "Cada mutuário regista-se pelo link da tua empresa. Os dados ficam sempre isolados de outras financeiras.",
  },
  {
    numero: "4",
    titulo: "Gere todo o ciclo",
    descricao: "Pedidos, aprovação, desembolso, cobrança e relatórios, tudo num só sistema.",
  },
];

export default function HowItWorks() {
  return (
    <Box id="como-funciona" sx={{ py: { xs: 8, md: 11 }, bgcolor: "#fff" }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
          <Typography
            variant="overline"
            sx={{ color: CORES.marca, fontWeight: 700, letterSpacing: 1.2 }}
          >
            Como funciona
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "#0f172a" }}>
            Da conta ao primeiro desembolso
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 4, md: 3 }}
          sx={{ position: "relative" }}
        >
          {/* linha conectora, só desktop */}
          <Box
            aria-hidden="true"
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              top: 22,
              left: "12.5%",
              right: "12.5%",
              height: 2,
              bgcolor: "rgba(26,35,126,0.12)",
            }}
          />

          {PASSOS.map((passo) => (
            <Box key={passo.numero} sx={{ flex: 1, position: "relative", textAlign: { xs: "left", md: "center" } }}>
              <Stack
                direction={{ xs: "row", md: "column" }}
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={{ xs: 2, md: 1.5 }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: CORES.marca,
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    zIndex: 1,
                    boxShadow: `0 8px 20px -6px ${CORES.marca}80`,
                  }}
                >
                  {passo.numero}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {passo.titulo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {passo.descricao}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
