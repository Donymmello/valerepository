import { Paper, Typography } from "@mui/material";
import { CORES } from "../../theme";

/**
 * Card de estatística padrão: label pequeno + valor grande.
 * Mesmo padrão usado em DashboardMutuario, DashboardInterno e
 * RelatoriosList, antes cada um com a sua própria variação.
 */
export default function StatCard({ label, value, color = CORES.marca }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
      <Typography variant="body2" color="text.secondary" mb={1}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, color }}>
        {value}
      </Typography>
    </Paper>
  );
}
