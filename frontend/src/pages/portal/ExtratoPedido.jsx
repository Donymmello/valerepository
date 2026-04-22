import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { getMeuExtratoPedidoRequest } from "../../api/portal.api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../utils/formatters";

export default function ExtratoPedido() {
  const { id } = useParams();

  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const carregarExtrato = async () => {
      try {
        const data = await getMeuExtratoPedidoRequest(id);
        setDados(data);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Erro ao carregar extrato.");
      } finally {
        setLoading(false);
      }
    };

    carregarExtrato();
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
      <Typography variant="h4" mb={1}>
        Extrato do Pedido
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Consulte o resumo financeiro e os movimentos do pedido.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {dados && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={2}
              mb={2}
            >
              <Box>
                <Typography variant="h6">
                  {dados.pedido?.numeroPedido}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Finalidade: {dados.pedido?.finalidade || "-"}
                </Typography>
              </Box>

              <Chip
                label={getStatusLabel(dados.pedido?.status)}
                color={getStatusColor(dados.pedido?.status)}
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.2}>
              <Typography>
                <strong>Valor Solicitado:</strong> {formatCurrency(dados.pedido?.valorSolicitado)}
              </Typography>
              <Typography>
                <strong>Etapa Atual:</strong> {dados.pedido?.etapaAtual || "-"}
              </Typography>
              <Typography>
                <strong>Data de Submissão:</strong> {formatDate(dados.pedido?.dataSubmissao)}
              </Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Resumo Financeiro
            </Typography>

            <Stack spacing={1.2}>
              <Typography>
                <strong>Total Desembolsado:</strong>{" "}
                {formatCurrency(dados.resumoFinanceiro?.totalDesembolsado)}
              </Typography>
              <Typography>
                <strong>Total Reembolsado:</strong>{" "}
                {formatCurrency(dados.resumoFinanceiro?.totalReembolsado)}
              </Typography>
              <Typography>
                <strong>Saldo em Aberto:</strong>{" "}
                {formatCurrency(dados.resumoFinanceiro?.saldoEmAberto)}
              </Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Desembolsos
            </Typography>

            {dados.desembolsos?.length ? (
              <Stack spacing={2}>
                {dados.desembolsos.map((item) => (
                  <Box key={item.id}>
                    <Typography>
                      <strong>Valor:</strong> {formatCurrency(item.valorDesembolsado)}
                    </Typography>
                    <Typography>
                      <strong>Data:</strong> {formatDate(item.dataDesembolso)}
                    </Typography>
                    <Typography>
                      <strong>Meio de Pagamento:</strong> {item.meioPagamento || "-"}
                    </Typography>
                    <Typography>
                      <strong>Observações:</strong> {item.observacoes || "-"}
                    </Typography>

                    <Divider sx={{ mt: 1.5 }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Nenhum desembolso registado.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Reembolsos
            </Typography>

            {dados.reembolsos?.length ? (
              <Stack spacing={2}>
                {dados.reembolsos.map((item) => (
                  <Box key={item.id}>
                    <Typography>
                      <strong>Valor:</strong> {formatCurrency(item.valorReembolsado)}
                    </Typography>
                    <Typography>
                      <strong>Data:</strong> {formatDate(item.dataReembolso)}
                    </Typography>
                    <Typography>
                      <strong>Meio de Pagamento:</strong> {item.meioPagamento || "-"}
                    </Typography>
                    <Typography>
                      <strong>Observações:</strong> {item.observacoes || "-"}
                    </Typography>

                    <Divider sx={{ mt: 1.5 }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Nenhum reembolso registado.
              </Typography>
            )}
          </Paper>
        </Stack>
      )}
    </Box>
  );
}