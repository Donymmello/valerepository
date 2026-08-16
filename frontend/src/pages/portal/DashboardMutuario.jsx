import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import {
  getMeuMutuarioRequest,
  getMeusPedidosRequest,
} from "../../api/portal.api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import LoadingState from "../../components/common/LoadingState";
import StatCard from "../../components/common/StatCard";
import StatusChip from "../../components/common/StatusChip";
import { CORES } from "../../theme";

export default function DashboardMutuario() {
  const { user } = useAuth();

  const [mutuario, setMutuario] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const carregarDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [mutuarioData, pedidosData] = await Promise.all([
          getMeuMutuarioRequest(),
          getMeusPedidosRequest(),
        ]);

        setMutuario(mutuarioData);
        setPedidos(pedidosData?.pedidos || []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Erro ao carregar o dashboard.");
      } finally {
        setLoading(false);
      }
    };

    carregarDashboard();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  const pedidosRecentes = pedidos.slice(0, 3);
  const pedidosAtivos = pedidos.filter((p) =>
    ["SUBMETIDO", "EM_ANALISE", "EM_VALIDACAO"].includes(p.status)
  ).length;

  return (
    <Box>
      {/* Cabeçalho */}
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} mb={0.5}>
          Bem-vindo, {user?.nome} 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Aqui pode acompanhar os seus pedidos de crédito e gerir a sua conta.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Código do Mutuário" value={mutuario?.codigoMutuario || "—"} />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total de Pedidos" value={pedidos.length} />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Pedidos Ativos" value={pedidosAtivos} color={CORES.aviso} />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Estado da Conta" value="Ativa" color={CORES.sucesso} />
        </Grid>
      </Grid>

      {/* Acções rápidas */}
      <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
        Acções Rápidas
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            component={RouterLink}
            to="/portal/criar-pedido"
            sx={{
              p: 3, borderRadius: 3, height: "100%", textDecoration: "none",
              display: "flex", flexDirection: "column", gap: 1,
              border: "1px solid transparent",
              "&:hover": { borderColor: "#1a237e", bgcolor: "#f8faff" },
              transition: "all 0.15s",
            }}
          >
            <AddIcon sx={{ color: "#1a237e", fontSize: 32 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Novo Pedido
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submeta um novo pedido de crédito.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            component={RouterLink}
            to="/portal/meus-pedidos"
            sx={{
              p: 3, borderRadius: 3, height: "100%", textDecoration: "none",
              display: "flex", flexDirection: "column", gap: 1,
              border: "1px solid transparent",
              "&:hover": { borderColor: "#1a237e", bgcolor: "#f8faff" },
              transition: "all 0.15s",
            }}
          >
            <ReceiptIcon sx={{ color: "#1a237e", fontSize: 32 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Meus Pedidos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Acompanhe o estado dos seus pedidos.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            component={RouterLink}
            to="/portal/meus-creditos"
            sx={{
              p: 3, borderRadius: 3, height: "100%", textDecoration: "none",
              display: "flex", flexDirection: "column", gap: 1,
              border: "1px solid transparent",
              "&:hover": { borderColor: "#1a237e", bgcolor: "#f8faff" },
              transition: "all 0.15s",
            }}
          >
            <AccountBalanceIcon sx={{ color: "#1a237e", fontSize: 32 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Meus Créditos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Veja o estado dos seus créditos.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            component={RouterLink}
            to="/portal/meu-mutuario"
            sx={{
              p: 3, borderRadius: 3, height: "100%", textDecoration: "none",
              display: "flex", flexDirection: "column", gap: 1,
              border: "1px solid transparent",
              "&:hover": { borderColor: "#1a237e", bgcolor: "#f8faff" },
              transition: "all 0.15s",
            }}
          >
            <PersonIcon sx={{ color: "#1a237e", fontSize: 32 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Meu Perfil
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Consulte e actualize os seus dados.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 4 }} />

      {/* Pedidos recentes */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        mb={2}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Pedidos Recentes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Os seus pedidos mais recentes.
          </Typography>
        </Box>
        <Button component={RouterLink} to="/portal/meus-pedidos" variant="outlined" size="small">
          Ver Todos
        </Button>
      </Stack>

      {pedidosRecentes.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <Typography color="text.secondary" mb={2}>
            Ainda não tem pedidos registados.
          </Typography>
          <Button
            component={RouterLink}
            to="/portal/criar-pedido"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Criar Primeiro Pedido
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {pedidosRecentes.map((pedido) => (
            <Paper
              key={pedido.id}
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 2 }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={2}
              >
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {pedido.numeroPedido}
                    </Typography>
                    <StatusChip status={pedido.status} />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Valor: {formatCurrency(pedido.valorSolicitado)} · Finalidade: {pedido.finalidade || "—"}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Submetido em {formatDate(pedido.dataSubmissao)}
                  </Typography>
                </Box>

                <Button
                  component={RouterLink}
                  to={`/portal/meus-pedidos/${pedido.id}`}
                  variant="outlined"
                  size="small"
                >
                  Ver Detalhe
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}