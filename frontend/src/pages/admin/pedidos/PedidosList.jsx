import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getAllPedidosRequest } from "../../../api/admin.api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../../utils/formatters";

export default function PedidosList() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const carregarPedidos = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAllPedidosRequest();
        setPedidos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Erro ao carregar pedidos.");
      } finally {
        setLoading(false);
      }
    };

    carregarPedidos();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return pedidos;

    return pedidos.filter((pedido) => {
      const numeroPedido = String(pedido.numeroPedido || "").toLowerCase();
      const status = String(pedido.status || "").toLowerCase();
      const finalidade = String(pedido.finalidade || "").toLowerCase();
      const nomeMutuario = String(pedido.mutuario?.nomeCompleto || "").toLowerCase();

      return (
        numeroPedido.includes(term) ||
        status.includes(term) ||
        finalidade.includes(term) ||
        nomeMutuario.includes(term)
      );
    });
  }, [pedidos, search]);

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
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Pedidos
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Consulte e acompanhe os pedidos de crédito no sistema.
          </Typography>
        </Box>
      </Stack>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          label="Pesquisar por número, mutuário, status ou finalidade"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && pedidosFiltrados.length === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography>Nenhum pedido encontrado.</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {pedidosFiltrados.map((pedido) => (
          <Paper key={pedido.id} sx={{ p: 3, borderRadius: 3 }}>
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
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {pedido.numeroPedido}
                  </Typography>

                  <Chip
                    label={getStatusLabel(pedido.status)}
                    color={getStatusColor(pedido.status)}
                    size="small"
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  <strong>Mutuário:</strong> {pedido.mutuario?.nomeCompleto || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Valor solicitado:</strong> {formatCurrency(pedido.valorSolicitado)}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Finalidade:</strong> {pedido.finalidade || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Etapa atual:</strong> {pedido.etapaAtual || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Data de submissão:</strong> {formatDate(pedido.dataSubmissao)}
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Button
                  component={RouterLink}
                  to={`/interno/pedidos/${pedido.id}`}
                  variant="outlined"
                >
                  Ver Detalhe
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}