import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { getCreditosComReembolsoRequest } from "../../../api/admin.api";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import PageHeader from "../../../components/common/PageHeader";
import LoadingState from "../../../components/common/LoadingState";

const getEstadoLabel = (estado) => {
  switch (estado) {
    case "ATIVO":
      return "Ativo";
    case "LIQUIDADO":
      return "Liquidado";
    case "INCUMPRIMENTO":
      return "Incumprimento";
    case "REESTRUTURADO":
      return "Reestruturado";
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

const getParcelaChipColor = (estado) => {
  if (estado === "PAGO") return "success";
  if (estado === "ATRASADO") return "error";
  return "warning";
};

export default function CreditoDetalhe() {
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

        const data = await getCreditosComReembolsoRequest(id);
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
    return <LoadingState />;
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate("/interno/reembolsos")}>
          Voltar para Reembolsos
        </Button>
      </Box>
    );
  }

  const hoje = new Date();
  const parcelasPendentes = (credito?.parcelas || []).filter(
    (parcela) => parcela.estado !== "PAGO" && Number(parcela.saldoParcela || 0) > 0
  );

  return (
    <Box>
      <PageHeader
        title="Detalhe do Crédito"
        subtitle="Contrato, parcelas e histórico de reembolsos."
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={getEstadoLabel(credito?.estado)}
              color={getChipColor(credito?.estado)}
              sx={{ fontWeight: 700, py: 0.5 }}
            />
            <Button
              component={RouterLink}
              to={`/interno/reembolsos?creditoId=${credito?.id}`}
              variant="outlined"
            >
              Registar Pagamento
            </Button>
          </Stack>
        }
      />

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
                  Mutuário
                </Typography>
                <Typography variant="body1">
                  {credito?.mutuario?.id ? (
                    <RouterLink to={`/interno/mutuarios/${credito.mutuario.id}`}>
                      {credito.mutuario.nomeCompleto || "-"}
                    </RouterLink>
                  ) : (
                    credito?.mutuario?.nomeCompleto || "-"
                  )}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Pedido associado
                </Typography>
                <Typography variant="body1">
                  {credito?.pedido?.id ? (
                    <RouterLink to={`/interno/pedidos/${credito.pedido.id}`}>
                      {credito.pedido.numeroPedido || `#${credito.pedido.id}`}
                    </RouterLink>
                  ) : (
                    "-"
                  )}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Data de início
                </Typography>
                <Typography variant="body1">{formatDate(credito?.dataInicio)}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Término previsto
                </Typography>
                <Typography variant="body1">{formatDate(credito?.dataFimPrevista)}</Typography>
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
                  <strong>Taxa anual:</strong>{" "}
                  {credito?.taxa ? `${Number(credito.taxa || 0).toFixed(2)}%` : "-"}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {parcelasPendentes.some((p) => p.estado === "ATRASADO" || new Date(p.dataVencimento) < hoje) && (
          <Alert severity="warning">
            Este crédito tem parcelas vencidas por cobrar. Use o botão "Registar Pagamento"
            acima para lançar o reembolso.
          </Alert>
        )}

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
            Parcelas
          </Typography>

          {credito?.parcelas?.length ? (
            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nº Parcela</TableCell>
                    <TableCell>Valor Previsto</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell>Valor Pago</TableCell>
                    <TableCell>Saldo</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {credito.parcelas.map((parcela) => {
                    const vencida =
                      parcela.estado !== "PAGO" && new Date(parcela.dataVencimento) < hoje;

                    return (
                      <TableRow
                        key={parcela.id}
                        sx={vencida ? { bgcolor: "rgba(211, 47, 47, 0.08)" } : undefined}
                      >
                        <TableCell>{parcela.numeroParcela}</TableCell>
                        <TableCell>{formatCurrency(parcela.valorPrevisto)}</TableCell>
                        <TableCell>{formatDate(parcela.dataVencimento)}</TableCell>
                        <TableCell>{formatCurrency(parcela.valorPago)}</TableCell>
                        <TableCell>{formatCurrency(parcela.saldoParcela)}</TableCell>
                        <TableCell>
                          <Chip
                            label={vencida ? "VENCIDA" : parcela.estado}
                            color={vencida ? "error" : getParcelaChipColor(parcela.estado)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
            Histórico de Reembolsos
          </Typography>

          {credito?.reembolsos?.length ? (
            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Meio de Pagamento</TableCell>
                    <TableCell>Nº Transação</TableCell>
                    <TableCell>Referência</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {credito.reembolsos.map((reembolso) => (
                    <TableRow key={reembolso.id}>
                      <TableCell>{formatDate(reembolso.dataReembolso)}</TableCell>
                      <TableCell>{formatCurrency(reembolso.valorReembolsado)}</TableCell>
                      <TableCell>{reembolso.meioPagamento || "-"}</TableCell>
                      <TableCell>{reembolso.numeroTransacao || "-"}</TableCell>
                      <TableCell>{reembolso.referencia || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography color="text.secondary">
                Ainda não existem reembolsos registados para este crédito.
              </Typography>
            </Paper>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
