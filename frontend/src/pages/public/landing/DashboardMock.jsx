import { Box, Stack, Typography, Chip, LinearProgress } from "@mui/material";
import { CORES } from "../../../theme";

/**
 * Pré-visualização estilizada do backoffice real, não é screenshot (não
 * há assets de imagem no projeto), é composta só com MUI/CSS. Os estados
 * e cores dos chips seguem o mesmo mapa de utils/formatters.js
 * (getStatusLabel/getStatusColor) usado nas listagens reais, para não
 * inventar um vocabulário visual novo só para a landing page.
 */
const LINHAS = [
  { codigo: "PED-2026-0148", nome: "Fátima Cossa", valor: "42.000 MT", estado: "Aprovado", cor: CORES.sucesso },
  { codigo: "PED-2026-0147", nome: "Armando Muianga", valor: "18.500 MT", estado: "Em Análise", cor: CORES.aviso },
  { codigo: "PED-2026-0146", nome: "Belinda Sitoe", valor: "65.000 MT", estado: "Desembolsado", cor: CORES.marca },
];

const STATS = [
  { label: "Pedidos este mês", valor: "128", delta: "+12%" },
  { label: "Em análise", valor: "23", delta: null },
  { label: "Taxa de aprovação", valor: "81%", delta: "+4pp" },
];

function ChromeDot({ color }) {
  return <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: color }} />;
}

export default function DashboardMock() {
  return (
    <Box
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        bgcolor: "#fff",
        border: "1px solid",
        borderColor: "rgba(15,23,42,0.08)",
        boxShadow: "0 24px 60px -20px rgba(26,35,126,0.35)",
        transform: { md: "rotate(-1deg)" },
      }}
    >
      {/* barra estilo "janela" */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ px: 2, py: 1.25, bgcolor: "#f8f9fc", borderBottom: "1px solid", borderColor: "rgba(15,23,42,0.06)" }}
      >
        <ChromeDot color="#f87171" />
        <ChromeDot color="#fbbf24" />
        <ChromeDot color="#34d399" />
        <Typography variant="caption" sx={{ ml: 1.5, color: "text.disabled", fontWeight: 500 }}>
          tshemba.vektarmz.com/interno
        </Typography>
      </Stack>

      <Stack direction="row" sx={{ minHeight: 320 }}>
        {/* sidebar reduzida */}
        <Stack
          spacing={1.25}
          sx={{
            width: 56,
            py: 2.5,
            px: 1.25,
            bgcolor: CORES.marca,
            display: { xs: "none", sm: "flex" },
          }}
          alignItems="center"
        >
          {[1, 0.55, 0.55, 0.55, 0.55].map((op, i) => (
            <Box key={i} sx={{ width: 26, height: 26, borderRadius: 1.5, bgcolor: `rgba(255,255,255,${op})` }} />
          ))}
        </Stack>

        {/* conteúdo principal */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "text.primary" }}>
            Dashboard
          </Typography>

          <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
            {STATS.map((stat) => (
              <Box
                key={stat.label}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: "#f8f9fc",
                  border: "1px solid",
                  borderColor: "rgba(15,23,42,0.06)",
                }}
              >
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", whiteSpace: "nowrap" }}>
                  {stat.label}
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.5}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: CORES.marca, lineHeight: 1.3 }}>
                    {stat.valor}
                  </Typography>
                  {stat.delta && (
                    <Typography variant="caption" sx={{ color: CORES.sucesso, fontWeight: 700 }}>
                      {stat.delta}
                    </Typography>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>

          <LinearProgress
            variant="determinate"
            value={68}
            sx={{
              height: 6,
              borderRadius: 3,
              mb: 2,
              bgcolor: "rgba(26,35,126,0.08)",
              "& .MuiLinearProgress-bar": { bgcolor: CORES.marca, borderRadius: 3 },
            }}
          />

          <Stack spacing={1}>
            {LINHAS.map((linha) => (
              <Stack
                key={linha.codigo}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "rgba(15,23,42,0.06)",
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
                    {linha.nome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                    {linha.codigo} · {linha.valor}
                  </Typography>
                </Box>
                <Chip
                  label={linha.estado}
                  size="small"
                  sx={{
                    bgcolor: `${linha.cor}1a`,
                    color: linha.cor,
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                />
              </Stack>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
