import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { getMeusPedidosRequest } from "../../api/portal.api";

export default function MeusPedidos() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const response = await getMeusPedidosRequest();
      setDados(response);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "start", md: "center" }}
          spacing={2}
          mb={3}
        >
          <Typography variant="h4">Meus Pedidos</Typography>

          <Button
            component={RouterLink}
            to="/portal/criar-pedido"
            variant="contained"
          >
            Novo Pedido
          </Button>
        </Stack>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && dados?.pedidos?.length === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography>Ainda não tens pedidos registados.</Typography>
          </Paper>
        )}

        <Stack spacing={2}>
          {dados?.pedidos?.map((pedido) => (
            <Paper key={pedido.id} sx={{ p: 3 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h6">
                    {pedido.numeroPedido}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Finalidade: {pedido.finalidade}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Valor solicitado: {pedido.valorSolicitado}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Status: {pedido.status}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Etapa atual: {pedido.etapaAtual}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    component={RouterLink}
                    to={`/portal/meus-pedidos/${pedido.id}`}
                    variant="outlined"
                  >
                    Ver Detalhe
                  </Button>

                  <Button
                    component={RouterLink}
                    to={`/portal/meus-pedidos/${pedido.id}/extrato`}
                    variant="outlined"
                  >
                    Extrato
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Container>
  );
}