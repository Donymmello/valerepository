import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import {
  getMeuMutuarioRequest,
  getMeusPedidosRequest,
} from "../../api/portal.api";

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
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const pedidosRecentes = pedidos.slice(0, 3);

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} mb={1}>
          Bem-vindo, {user?.nome}
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Aqui pode acompanhar os seus dados, pedidos de crédito e extratos.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Código do Mutuário
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {mutuario?.codigoMutuario || "-"}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Total de Pedidos
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {pedidos.length}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Estado da Conta
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Ativa
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={1}>
              Meu Perfil
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Consulte os seus dados de mutuário e informações pessoais.
            </Typography>
            <Button component={RouterLink} to="/portal/meu-mutuario" variant="outlined">
              Ver Perfil
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={1}>
              Meus Pedidos
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Veja a lista completa dos seus pedidos e acompanhe o estado.
            </Typography>
            <Button component={RouterLink} to="/portal/meus-pedidos" variant="outlined">
              Ver Pedidos
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={1}>
              Novo Pedido
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Submeta um novo pedido de crédito diretamente pelo portal.
            </Typography>
            <Button component={RouterLink} to="/portal/criar-pedido" variant="contained">
              Criar Pedido
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          mb={3}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Pedidos Recentes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Os pedidos mais recentes associados à sua conta.
            </Typography>
          </Box>

          <Button component={RouterLink} to="/portal/meus-pedidos" variant="outlined">
            Ver Todos
          </Button>
        </Stack>

        {pedidosRecentes.length === 0 ? (
          <Typography color="text.secondary">
            Ainda não existem pedidos registados na sua conta.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {pedidosRecentes.map((pedido) => (
              <Paper
                key={pedido.id}
                variant="outlined"
                sx={{ p: 2, borderRadius: 2 }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>
                      {pedido.numeroPedido}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Finalidade: {pedido.finalidade || "-"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Valor: {pedido.valorSolicitado || "-"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Estado: {pedido.status || "-"}
                    </Typography>
                  </Box>

                  <Box>
                    <Button
                      component={RouterLink}
                      to={`/portal/meus-pedidos/${pedido.id}`}
                      variant="text"
                    >
                      Ver Detalhe
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}