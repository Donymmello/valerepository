import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { getMeuPedidoByIdRequest } from "../../api/portal.api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../utils/formatters";

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
          <Typography variant="h4">Detalhe do Pedido</Typography>
          <Typography variant="body2" color="text.secondary">
            Visualize o estado e os detalhes do seu pedido.
          </Typography>
        </Box>

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
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={2}
              mb={2}
            >
              <Box>
                <Typography variant="h6">{pedido.numeroPedido}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pedido submetido em {formatDate(pedido.dataSubmissao)}
                </Typography>
              </Box>

              <Chip
                label={getStatusLabel(pedido.status)}
                color={getStatusColor(pedido.status)}
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.2}>
              <Typography>
                <strong>Valor Solicitado:</strong> {formatCurrency(pedido.valorSolicitado)}
              </Typography>
              <Typography>
                <strong>Finalidade:</strong> {pedido.finalidade || "-"}
              </Typography>
              <Typography>
                <strong>Pacote de Financiamento:</strong> {pedido.pacoteFinanciamento || "-"}
              </Typography>
              <Typography>
                <strong>Etapa Atual:</strong> {pedido.etapaAtual || "-"}
              </Typography>
              <Typography>
                <strong>Prazo de Avaliação:</strong> {formatDate(pedido.prazoAvaliacao)}
              </Typography>
              <Typography>
                <strong>Prazo de Validação:</strong> {formatDate(pedido.prazoValidacao)}
              </Typography>
              <Typography>
                <strong>Observações:</strong> {pedido.observacoes || "-"}
              </Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Aprovações
            </Typography>

            {pedido.aprovacoes?.length ? (
              <Stack spacing={2}>
                {pedido.aprovacoes.map((item) => (
                  <Box key={item.id}>
                    <Typography>
                      <strong>Nível:</strong> {item.nivel}
                    </Typography>
                    <Typography>
                      <strong>Decisão:</strong> {item.decisao || "-"}
                    </Typography>
                    <Typography>
                      <strong>Comentário:</strong> {item.comentario || "-"}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Data: {formatDate(item.dataDecisao)}
                    </Typography>
                    <Divider sx={{ mt: 1.5 }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Ainda não existem aprovações registadas.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Requisitos do Pedido
            </Typography>

            {pedido.requisitosPedido?.length ? (
              <Stack spacing={2}>
                {pedido.requisitosPedido.map((item) => (
                  <Box key={item.id}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      mb={1}
                    >
                      <Typography>
                        <strong>{item.requisito?.nome || "Requisito"}</strong>
                      </Typography>

                      <Chip
                        label={item.estado || "-"}
                        size="small"
                        color={
                          item.estado === "APROVADO"
                            ? "success"
                            : item.estado === "REJEITADO"
                            ? "error"
                            : "warning"
                        }
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      Observações: {item.observacoes || "-"}
                    </Typography>

                    <Divider sx={{ mt: 1.5 }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Ainda não existem requisitos associados.
              </Typography>
            )}
          </Paper>
        </Stack>
      )}
    </Box>
  );
}