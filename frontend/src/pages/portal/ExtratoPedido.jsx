import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
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
import { getMeuPedidoByIdRequest } from "../../api/portal.api";

export default function DetalhePedido() {
  const { id } = useParams();

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const carregarPedido = async () => {
      try {
        const data = await getMeuPedidoByIdRequest(id);
        setPedido(data);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Erro ao carregar pedido.");
      } finally {
        setLoading(false);
      }
    };

    carregarPedido();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" mb={3}>
          <Typography variant="h4">Detalhe do Pedido</Typography>

          <Button
            component={RouterLink}
            to={`/portal/meus-pedidos/${id}/extrato`}
            variant="outlined"
          >
            Ver Extrato
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {pedido && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              {pedido.numeroPedido}
            </Typography>

            <Typography><strong>Status:</strong> {pedido.status}</Typography>
            <Typography><strong>Etapa:</strong> {pedido.etapaAtual}</Typography>
            <Typography><strong>Valor Solicitado:</strong> {pedido.valorSolicitado}</Typography>
            <Typography><strong>Finalidade:</strong> {pedido.finalidade}</Typography>
            <Typography><strong>Pacote:</strong> {pedido.pacoteFinanciamento || "-"}</Typography>
            <Typography><strong>Data de Submissão:</strong> {pedido.dataSubmissao || "-"}</Typography>
            <Typography><strong>Prazo de Avaliação:</strong> {pedido.prazoAvaliacao || "-"}</Typography>
            <Typography><strong>Prazo de Validação:</strong> {pedido.prazoValidacao || "-"}</Typography>
            <Typography><strong>Observações:</strong> {pedido.observacoes || "-"}</Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
}