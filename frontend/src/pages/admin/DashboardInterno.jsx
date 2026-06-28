import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccountBalance as AccountBalanceIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { getResumoGeralRequest } from "../../api/admin.api";
import { formatCurrency } from "../../utils/formatters";

function StatCard({ label, value, icon, color = "#1a237e" }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" mb={1}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color }}>
            {value ?? "—"}
          </Typography>
        </Box>
        <Box sx={{ color, opacity: 0.2, fontSize: 48 }}>
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

function ModuloCard({ titulo, descricao, to, buttonLabel }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
      <Stack spacing={2} height="100%" justifyContent="space-between">
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={1}>
            {titulo}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {descricao}
          </Typography>
        </Box>
        <Box>
          <Button component={RouterLink} to={to} variant="contained" size="small">
            {buttonLabel}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function DashboardInterno() {
  const { user } = useAuth();
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await getResumoGeralRequest();
        setResumo(data);
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar o resumo.");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  return (
    <Box>
      {/* Cabeçalho */}
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} mb={0.5}>
          Dashboard Interno
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bem-vindo, {user?.nome}. Aqui tem uma visão geral do sistema.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Stats */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Total de Pedidos"
              value={resumo?.totalPedidos ?? 0}
              icon={<AssignmentIcon fontSize="inherit" />}
              color="#1a237e"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Pedidos Pendentes"
              value={resumo?.pedidosPendentes ?? 0}
              icon={<HourglassIcon fontSize="inherit" />}
              color="#b45309"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Pedidos Aprovados"
              value={resumo?.pedidosAprovados ?? 0}
              icon={<CheckCircleIcon fontSize="inherit" />}
              color="#15803d"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Total Mutuários"
              value={resumo?.totalMutuarios ?? 0}
              icon={<PeopleIcon fontSize="inherit" />}
              color="#7c3aed"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Total Desembolsado"
              value={resumo?.totalDesembolsado != null ? formatCurrency(resumo.totalDesembolsado) : "—"}
              icon={<AccountBalanceIcon fontSize="inherit" />}
              color="#0369a1"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Total Reembolsado"
              value={resumo?.totalReembolsado != null ? formatCurrency(resumo.totalReembolsado) : "—"}
              icon={<TrendingUpIcon fontSize="inherit" />}
              color="#0f766e"
            />
          </Grid>
        </Grid>
      )}

      <Divider sx={{ mb: 4 }} />

      {/* Módulos */}
      <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
        Módulos
      </Typography>

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
            titulo="Alertas de Prazo"
            descricao="Verifique pedidos com prazos a vencer."
            to="/interno/alertas-prazo"
            buttonLabel="Ver Alertas"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Relatórios"
            descricao="Análises e exportações de dados do sistema."
            to="/interno/relatorios"
            buttonLabel="Ver Relatórios"
          />
        </Grid>
      </Grid>
    </Box>
  );
}