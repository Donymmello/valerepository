import { useState } from "react";
import { Box, Container, Typography, Stack, Button, Chip, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { Check } from "@mui/icons-material";
import { CORES } from "../../../theme";

// Preço anual = 10x o mensal (2 meses grátis, ~17% de desconto), prática
// comum de mercado para incentivar o compromisso anual.
//
// Benefícios alinhados com o que o sistema realmente tem hoje (ver
// backend/routes/excell.routes.js e controllers/excell.controller.js):
// exportação (mutuários, pedidos, desembolsos, reembolsos, relatório
// financeiro) existe para todos; importação em massa (mutuários, pedidos,
// créditos via Excel) é a funcionalidade mais sensível, por isso fica
// reservada ao Empresarial. O Empresarial é sempre um superconjunto dos
// planos abaixo, nunca perde uma funcionalidade que os outros têm.
// planoEnum: valor real de Empresa.plano no backend (ver
// models/empresa.model.js), enviado no trial (ver TrialSection.jsx)
// para a conta nascer já no plano escolhido aqui, em vez de cair sempre
// no STARTER por omissão como acontecia antes.
const PLANOS = [
  {
    nome: "Starter",
    planoEnum: "STARTER",
    precoMensal: 2500,
    descricao: "Para financeiras pequenas a começar.",
    beneficios: [
      "Até 3 utilizadores",
      "Aprovação em 1 nível",
      "Notificações por email e SMS",
      "Exportação em PDF e Excel",
      "Suporte por email",
    ],
    destaque: false,
  },
  {
    nome: "Profissional",
    planoEnum: "BUSINESS",
    precoMensal: 4000,
    descricao: "Para operações em crescimento.",
    beneficios: [
      "Até 10 utilizadores",
      "Aprovação por 3 níveis (analista, gestor, diretor)",
      "Notificações por email e SMS",
      "Exportação em PDF e Excel",
      "Auditoria completa",
      "Suporte prioritário",
    ],
    destaque: true,
  },
  {
    nome: "Empresarial",
    planoEnum: "ENTERPRISE",
    precoMensal: 8000,
    descricao: "Para financeiras com equipas maiores.",
    beneficios: [
      "Utilizadores ilimitados",
      "Aprovação por 3 níveis (analista, gestor, diretor)",
      "Notificações por email e SMS",
      "Exportação em PDF e Excel",
      "Importação em massa (mutuários, pedidos e créditos)",
      "Auditoria completa",
      "Suporte prioritário dedicado",
    ],
    destaque: false,
  },
];

const formatarMT = (valor) => Math.round(valor).toLocaleString("pt-PT");

function PlanoCard({ nome, planoEnum, precoMensal, ciclo, descricao, beneficios, destaque, onNavTrial }) {
  const precoExibido = ciclo === "anual" ? precoMensal * 10 : precoMensal;
  const precoMensalEquivalente = ciclo === "anual" ? precoMensal * 10 / 12 : precoMensal;
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

      <Stack spacing={0.25} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="baseline" spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: destaque ? "#fff" : "text.primary" }}>
            {formatarMT(precoMensalEquivalente)}
          </Typography>
          <Typography variant="body2" sx={{ color: destaque ? "rgba(255,255,255,0.82)" : "text.secondary" }}>
            MT / mês
          </Typography>
        </Stack>
        {ciclo === "anual" && (
          <Typography variant="caption" sx={{ color: destaque ? "rgba(255,255,255,0.7)" : "text.secondary" }}>
            {formatarMT(precoExibido)} MT faturados uma vez por ano
          </Typography>
        )}
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
        onClick={() => onNavTrial(planoEnum)}
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
  const [ciclo, setCiclo] = useState("mensal");

  const handleCiclo = (_event, novoCiclo) => {
    if (novoCiclo) setCiclo(novoCiclo);
  };

  return (
    <Box id="precos" sx={{ py: { xs: 8, md: 11 }, bgcolor: CORES.fundo }}>
      <Container maxWidth="lg">
        <Stack sx={{ textAlign: "center", mb: { xs: 4, md: 5 } }} spacing={0.5} alignItems="center">
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

        <Stack direction="row" justifyContent="center" sx={{ mb: { xs: 5, md: 6 } }}>
          <ToggleButtonGroup
            value={ciclo}
            exclusive
            onChange={handleCiclo}
            sx={{
              bgcolor: "#fff",
              border: "1px solid rgba(15,23,42,0.08)",
              borderRadius: 999,
              p: 0.5,
              "& .MuiToggleButton-root": {
                border: "none",
                borderRadius: 999,
                px: 2.5,
                py: 0.75,
                fontWeight: 700,
                textTransform: "none",
                color: "text.secondary",
              },
              "& .MuiToggleButton-root.Mui-selected": {
                bgcolor: CORES.marca,
                color: "#fff",
                "&:hover": { bgcolor: CORES.marca },
              },
            }}
          >
            <ToggleButton value="mensal">Mensal</ToggleButton>
            <ToggleButton value="anual">
              Anual
              <Chip
                label="2 meses grátis"
                size="small"
                sx={{
                  ml: 1,
                  height: 20,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  bgcolor: ciclo === "anual" ? "rgba(255,255,255,0.22)" : `${CORES.marca}14`,
                  color: ciclo === "anual" ? "#fff" : CORES.marca,
                }}
              />
            </ToggleButton>
          </ToggleButtonGroup>
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
            <PlanoCard key={plano.nome} {...plano} ciclo={ciclo} onNavTrial={onNavTrial} />
          ))}
        </Box>
      </Container>
    </Box>
  );
}
