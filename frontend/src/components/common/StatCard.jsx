import { Link as RouterLink } from "react-router-dom";
import { Paper, Typography } from "@mui/material";
import { CORES } from "../../theme";

/**
 * Card de estatística padrão: label pequeno + valor grande.
 * Mesmo padrão usado em DashboardMutuario, DashboardInterno e
 * RelatoriosList, antes cada um com a sua própria variação.
 *
 * Se `to` for passado, o card vira um link (ex: "Parcelas Vencidas" a
 * apontar para a página onde essas parcelas podem ser tratadas).
 */
export default function StatCard({ label, value, color = CORES.marca, to }) {
  return (
    <Paper
      {...(to ? { component: RouterLink, to } : {})}
      sx={{
        p: 3,
        borderRadius: 3,
        height: "100%",
        display: "block",
        textDecoration: "none",
        ...(to && {
          cursor: "pointer",
          transition: "box-shadow 0.15s ease",
          "&:hover": { boxShadow: 4 },
        }),
      }}
    >
      <Typography variant="body2" color="text.secondary" mb={1}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, color }}>
        {value}
      </Typography>
    </Paper>
  );
}
