import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { getMeuCreditoRequest } from "../../api/portal.api";
import { formatCurrency, formatDate } from "../../utils/formatters";

const getEstadoLabel = (estado) => {
  switch (estado) {
    case "ATIVO":
      return "Ativo";
    case "LIQUIDADO":
      return "Liquidado";
    case "INCUMPRIMENTO":
      return "Incumprimento";
    default:
      return estado || "-";
  }
};

const getChipColor = (estado) => {
  switch (estado) {
    case "ATIVO":
      return "success";
    case "LIQUIDADO":
      return "default";
    case "INCUMPRIMENTO":
      return "error";
    default:
      return "default";
  }
};

export default function DetalheCredito() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [credito, setCredito] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const carregarCredito = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMeuCreditoRequest(id);
        setCredito(data);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Erro ao carregar crédito.");
      } finally {
        setLoading(false);
      }
    };

    carregarCredito();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate("/portal/meus-creditos") }>
          Voltar para Meus Créditos
        </Button>
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
            Detalhe do Crédito
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Veja as informações do seu contrato e o histórico de parcelas.
          </Typography>
        </Box>

        <Chip
          label={getEstadoLabel(credito?.estado)}
          color={getChipColor(credito?.estado)}
          sx={{ fontWeight: 700, py: 0.5 }}
        />
      </Stack>

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between">
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Contrato
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {credito?.numeroContrato || `#${credito?.id}`}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Pedido associado
                </Typography>
                <Typography variant="body1">
                  {credito?.pedido?.numeroPedido || "-"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Data de início
                </Typography>
                <Typography variant="body1">
                  {formatDate(credito?.dataInicio)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Término previsto
                </Typography>
                <Typography variant="body1">
                  {formatDate(credito?.dataFimPrevista)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Valores principais
              </Typography>
              <Stack spacing={1}>
                <Typography>
                  <strong>Valor Original:</strong> {formatCurrency(credito?.valorOriginal)}
                </Typography>
                <Typography>
                  <strong>Montante Total:</strong> {formatCurrency(credito?.montanteTotal)}
                </Typography>
                <Typography>
                  <strong>Saldo Atual:</strong> {formatCurrency(credito?.saldoAtual)}
                </Typography>
                <Typography>
                  <strong>Total Pago:</strong> {formatCurrency(credito?.totalPago)}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Condições
              </Typography>
              <Stack spacing={1}>
                <Typography>
                  <strong>Prestação:</strong> {formatCurrency(credito?.prestacao)}
                </Typography>
                <Typography>
                  <strong>Prazo:</strong> {credito?.prazo || "-"} meses
                </Typography>
                <Typography>
                  <strong>Taxa anual:</strong> {credito?.taxa ? `${Number(credito.taxa || 0).toFixed(2)}%` : "-"}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Parcelas
            </Typography>
            <Button variant="outlined" onClick={() => navigate("/portal/meus-creditos") }>
              Voltar
            </Button>
          </Stack>

          {credito?.parcelas?.length ? (
            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nº Parcela</TableCell>
                    <TableCell>Valor Previsto</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell>Valor Pago</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {credito.parcelas.map((parcela) => (
                    <TableRow key={parcela.id}>
                      <TableCell>{parcela.numeroParcela}</TableCell>
                      <TableCell>{formatCurrency(parcela.valorPrevisto)}</TableCell>
                      <TableCell>{formatDate(parcela.dataVencimento)}</TableCell>
                      <TableCell>{formatCurrency(parcela.valorPago)}</TableCell>
                      <TableCell>
                        <Chip
                          label={parcela.estado}
                          color={
                            parcela.estado === "PAGO"
                              ? "success"
                              : parcela.estado === "ATRASADO"
                              ? "error"
                              : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography color="text.secondary">
                Ainda não existem parcelas associadas a este crédito.
              </Typography>
            </Paper>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
