import { Box, Container, Typography, Stack, Button, Chip } from "@mui/material";
import { Check } from "@mui/icons-material";
import { CORES } from "../../../theme";

const PLANOS = [
  {
    nome: "Starter",
    preco: "1.500",
    descricao: "Para financeiras pequenas a começar.",
    beneficios: ["Até 3 utilizadores", "Notificações por email e SMS", "Exportação em PDF e Excel", "Suporte por email"],
    destaque: false,
  },
  {
    nome: "Profissional",
    preco: "3.500",
    descricao: "Para operações em crescimento.",
    beneficios: [
      "Até 10 utilizadores",
      "Aprovação por 3 níveis (analista, gestor, diretor)",
      "Notificações por email e SMS",
      "Exportação em PDF e Excel",
      "Suporte prioritário",
    ],
    destaque: true,
  },
  {
    nome: "Empresarial",
    preco: "7.500",
    descricao: "Para financeiras com equipas maiores.",
    beneficios: [
      "Utilizadores alargados",
      "Aprovação por 3 níveis (analista, gestor, diretor)",
      "Notificações por email e SMS",
      "Exportação em PDF e Excel",
      "Suporte prioritário dedicado",
    ],
    destaque: false,
  },
];

function PlanoCard({ nome, preco, descricao, beneficios, destaque, onNavTrial }) {
  return (
    <Box
      sx={{
        p: 4,
        borderRadius: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: destaque ? CORES.marca : "#fff",
        border: "1px solid",
        borderColor: destaque ? CORES.marca : "rgba(15,23,42,0.08)",
        position: "relative",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: destaque ? `0 20px 40px -16px ${CORES.marca}90` : "0 14px 28px -16px rgba(15,23,42,0.18)",
        },
      }}
    >
      {destaque && (
        <Chip
          label="Mais popular"
          size="small"
          sx={{
            position: "absolute",
            top: -14,
            left: 24,
            bgcolor: "#fff",
            color: CORES.marca,
            fontWeight: 700,
          }}
        />
      )}

      <Typography variant="h6" sx={{ fontWeight: 800, color: destaque ? "#fff" : "text.primary", mb: 0.5 }}>
        {nome}
      </Typography>
      <Typography variant="body2" sx={{ color: destaque ? "rgba(255,255,255,0.82)" : "text.secondary", mb: 3 }}>
        {descricao}
      </Typography>

      <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: destaque ? "#fff" : "text.primary" }}>
          {preco}
        </Typography>
        <Typography variant="body2" sx={{ color: destaque ? "rgba(255,255,255,0.82)" : "text.secondary" }}>
          MT / mês
        </Typography>
      </Stack>

      <Stack spacing={1.25} sx={{ mb: 4, flex: 1 }}>
        {beneficios.map((beneficio) => (
          <Stack key={beneficio} direction="row" spacing={1.25} alignItems="flex-start">
            <Check sx={{ fontSize: 18, mt: 0.25, color: destaque ? "#fff" : CORES.marca }} />
            <Typography variant="body2" sx={{ color: destaque ? "rgba(255,255,255,0.92)" : "text.secondary" }}>
              {beneficio}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Button
        fullWidth
        variant={destaque ? "contained" : "outlined"}
        disableElevation
        onClick={onNavTrial}
        sx={{
          borderRadius: 2,
          py: 1.2,
          fontWeight: 700,
          ...(destaque
            ? { bgcolor: "#fff", color: CORES.marca, "&:hover": { bgcolor: "rgba(255,255,255,0.9)" } }
            : { borderColor: CORES.marca, color: CORES.marca }),
        }}
      >
        Começar grátis
      </Button>
    </Box>
  );
}

export default function Precos({ onNavTrial }) {
  return (
    <Box id="precos" sx={{ py: { xs: 8, md: 11 }, bgcolor: CORES.fundo }}>
      <Container maxWidth="lg">
        <Stack sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }} spacing={0.5} alignItems="center">
          <Typography variant="overline" sx={{ color: CORES.marca, fontWeight: 700, letterSpacing: 1.2 }}>
            Preços
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a" }}>
            Um plano para cada fase da tua operação
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 520, mt: 1 }}>
            7 dias grátis em qualquer plano, sem cartão de crédito. Muda de plano quando precisares.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          {PLANOS.map((plano) => (
            <PlanoCard key={plano.nome} {...plano} onNavTrial={onNavTrial} />
          ))}
        </Box>
      </Container>
    </Box>
  );
}
