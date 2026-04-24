import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

function ModuloCard({ titulo, descricao, to, buttonLabel }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={1}>
            {titulo}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {descricao}
          </Typography>
        </Box>

        <Box>
          <Button component={RouterLink} to={to} variant="contained">
            {buttonLabel}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function DashboardInterno() {
  const { user } = useAuth();

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} mb={1}>
          Dashboard Interno
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Bem-vindo, {user?.nome}. Utilize os módulos abaixo para gerir o sistema.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Pedidos"
            descricao="Consulte, acompanhe e trate pedidos de crédito."
            to="/interno/pedidos"
            buttonLabel="Abrir Pedidos"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Mutuários"
            descricao="Veja e gira os registos de mutuários."
            to="/interno/mutuarios"
            buttonLabel="Abrir Mutuários"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Aprovações"
            descricao="Acompanhe decisões e fluxo de aprovação."
            to="/interno/aprovacoes"
            buttonLabel="Abrir Aprovações"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Desembolsos"
            descricao="Registe e acompanhe desembolsos efetuados."
            to="/interno/desembolsos"
            buttonLabel="Abrir Desembolsos"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Reembolsos"
            descricao="Consulte e registe reembolsos dos pedidos."
            to="/interno/reembolsos"
            buttonLabel="Abrir Reembolsos"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Relatórios"
            descricao="Área preparada para relatórios e análises futuras."
            to="/interno/relatorios"
            buttonLabel="Em Breve"
          />
        </Grid>
      </Grid>
    </Box>
  );
}