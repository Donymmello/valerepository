import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { getMeusPedidosRequest } from "../../api/portal.api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../utils/formatters";

export default function MeusPedidos() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      setError("");

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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4">Meus Pedidos</Typography>
          <Typography variant="body2" color="text.secondary">
            Acompanhe os seus pedidos de crédito.
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to="/portal/criar-pedido"
          variant="contained"
        >
          Novo Pedido
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && dados?.pedidos?.length === 0 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" mb={1}>
            Ainda não tens pedidos registados
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Quando criares o primeiro pedido, ele aparecerá aqui.
          </Typography>

          <Button
            component={RouterLink}
            to="/portal/criar-pedido"
            variant="contained"
          >
            Criar Primeiro Pedido
          </Button>
        </Paper>
      )}

      <Stack spacing={2}>
        {dados?.pedidos?.map((pedido) => (
          <Paper key={pedido.id} sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={3}
            >
              <Box>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  mb={1}
                >
                  <Typography variant="h6">
                    {pedido.numeroPedido}
                  </Typography>

                  <Chip
                    label={getStatusLabel(pedido.status)}
                    color={getStatusColor(pedido.status)}
                    size="small"
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary" mb={1}>
                  Finalidade: {pedido.finalidade || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Valor solicitado: {formatCurrency(pedido.valorSolicitado)}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Etapa atual: {pedido.etapaAtual || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Data de submissão: {formatDate(pedido.dataSubmissao)}
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
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
  );
}