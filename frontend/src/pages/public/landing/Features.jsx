import { Box, Container, Typography, Stack } from "@mui/material";
import {
  Business,
  AccountTree,
  Payments,
  NotificationsActive,
  Description,
  History,
} from "@mui/icons-material";
import { CORES } from "../../../theme";

const FUNCIONALIDADES = [
  {
    Icon: Business,
    titulo: "Multi-empresa isolada",
    descricao:
      "Cada financeira só vê os seus próprios mutuários, pedidos e créditos. Isolamento total entre empresas na mesma plataforma.",
    destaque: true,
  },
  {
    Icon: AccountTree,
    titulo: "Aprovação por níveis",
    descricao:
      "Fluxo configurável por etapa: analista, gestor e diretor aprovam conforme o valor e o risco de cada pedido.",
    destaque: true,
  },
  {
    Icon: Payments,
    titulo: "Desembolso e cobrança rastreados",
    descricao: "Parcelas, atrasos e incumprimento calculados automaticamente, sem folhas de cálculo à parte.",
  },
  {
    Icon: NotificationsActive,
    titulo: "Notificações automáticas",
    descricao: "Email e SMS para prazos a vencer e pagamentos recebidos, sem trabalho manual da tua equipa.",
  },
  {
    Icon: Description,
    titulo: "Relatórios e exportação",
    descricao: "Extratos e comprovativos em PDF, importação e exportação de mutuários e créditos em Excel.",
  },
  {
    Icon: History,
    titulo: "Auditoria completa",
    descricao: "Cada ação sensível fica registada: quem, quando e o quê. Pronto para consultar sempre que precisares.",
  },
];

function FeatureCard({ Icon, titulo, descricao, destaque }) {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        height: "100%",
        bgcolor: destaque ? CORES.marca : "#fff",
        border: "1px solid",
        borderColor: destaque ? CORES.marca : "rgba(15,23,42,0.08)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: destaque ? `0 16px 32px -12px ${CORES.marca}90` : "0 12px 24px -14px rgba(15,23,42,0.18)",
        },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
          bgcolor: destaque ? "rgba(255,255,255,0.16)" : `${CORES.marca}12`,
        }}
      >
        <Icon sx={{ color: destaque ? "#fff" : CORES.marca, fontSize: 24 }} />
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75, color: destaque ? "#fff" : "text.primary" }}>
        {titulo}
      </Typography>
      <Typography variant="body2" sx={{ color: destaque ? "rgba(255,255,255,0.82)" : "text.secondary", lineHeight: 1.6 }}>
        {descricao}
      </Typography>
    </Box>
  );
}

export default function Features() {
  return (
    <Box id="funcionalidades" sx={{ py: { xs: 8, md: 11 }, bgcolor: CORES.fundo }}>
      <Container maxWidth="lg">
        <Stack sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }} spacing={0.5} alignItems="center">
          <Typography variant="overline" sx={{ color: CORES.marca, fontWeight: 700, letterSpacing: 1.2 }}>
            Funcionalidades
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a" }}>
            Tudo o que a tua operação de crédito precisa
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
            gap: 3,
          }}
        >
          {FUNCIONALIDADES.map((feature, index) => (
            <Box
              key={feature.titulo}
              sx={{
                gridColumn: { xs: "span 1", sm: "span 1", lg: index < 2 ? "span 2" : "span 1" },
              }}
            >
              <FeatureCard {...feature} />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
