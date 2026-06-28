import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccountBalance as AccountBalanceIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
} from "@mui/icons-material";
import { getMeusPedidosRequest, getMeuExtratoPedidoRequest } from "../../api/portal.api";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "../../utils/formatters";

// ─── Card de um crédito activo ────────────────────────────────────────────────
function CreditoCard({ pedido }) {
  const [extrato, setExtrato] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await getMeuExtratoPedidoRequest(pedido.id);
        setExtrato(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [pedido.id]);

  const totalDesembolsado = Number(extrato?.resumoFinanceiro?.totalDesembolsado || 0);
  const totalReembolsado = Number(extrato?.resumoFinanceiro?.totalReembolsado || 0);
  const saldoEmAberto = Number(extrato?.resumoFinanceiro?.saldoEmAberto || 0);
  const progresso = totalDesembolsado > 0
    ? Math.min((totalReembolsado / totalDesembolsado) * 100, 100)
    : 0;

  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: "100%", border: "1px solid #e0e0e0" }}>
      {/* Cabeçalho do card */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {pedido.numeroPedido}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Submetido em {formatDate(pedido.dataSubmissao)}
          </Typography>
        </Box>
        <Chip
          label={getStatusLabel(pedido.status)}
          color={getStatusColor(pedido.status)}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={2}>
        {pedido.finalidade || "—"}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Valores financeiros */}
      {loading ? (
        <Stack direction="row" spacing={1} alignItems="center" py={1}>
          <CircularProgress size={14} />
          <Typography variant="caption" color="text.secondary">
            A carregar extrato...
          </Typography>
        </Stack>
      ) : (
        <>
          <Grid container spacing={1.5} mb={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Valor do Crédito
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#0369a1" }}>
                {formatCurrency(totalDesembolsado || pedido.valorSolicitado)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Total Reembolsado
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#15803d" }}>
                {formatCurrency(totalReembolsado)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Saldo em Aberto
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 800, color: saldoEmAberto > 0 ? "#b45309" : "#15803d" }}>
                {formatCurrency(saldoEmAberto)}
              </Typography>
            </Grid>
          </Grid>

          {/* Barra de progresso */}
          {totalDesembolsado > 0 && (
            <Box mb={2}>
              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Progresso de reembolso
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {progresso.toFixed(0)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progresso}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "#e5e7eb",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: progresso >= 100 ? "#15803d" : "#0369a1",
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          )}
        </>
      )}

      <Button
        component={RouterLink}
        to={`/portal/meus-pedidos/${pedido.id}`}
        variant="outlined"
        size="small"
        fullWidth
        endIcon={<ArrowForwardIcon fontSize="small" />}
      >
        Ver Detalhe
      </Button>
    </Paper>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function MeusCreditos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await getMeusPedidosRequest();
        setPedidos(data?.pedidos || []);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar os créditos.");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  // Separar por estado
  const creditosActivos = pedidos.filter((p) =>
    ["DESEMBOLSADO"].includes(p.status)
  );
  const creditosEmCurso = pedidos.filter((p) =>
    ["SUBMETIDO", "EM_ANALISE", "EM_VALIDACAO", "APROVADO"].includes(p.status)
  );
  const creditosEncerrados = pedidos.filter((p) =>
    ["ENCERRADO", "REJEITADO"].includes(p.status)
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      {/* Cabeçalho */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} mb={0.5}>
            Meus Créditos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Acompanhe o estado dos seus créditos, pagamentos e saldo em aberto.
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to="/portal/criar-pedido"
          variant="contained"
          size="large"
          sx={{ borderRadius: 2, px: 3 }}
        >
          Solicitar Crédito
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {pedidos.length === 0 ? (
        <Paper sx={{ p: 6, borderRadius: 3, textAlign: "center" }}>
          <AccountBalanceIcon sx={{ fontSize: 56, color: "#d1d5db", mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={1}>
            Ainda não tem créditos
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Submeta o seu primeiro pedido de crédito para começar.
          </Typography>
          <Button
            component={RouterLink}
            to="/portal/criar-pedido"
            variant="contained"
          >
            Solicitar Crédito
          </Button>
        </Paper>
      ) : (
        <Stack spacing={4}>

          {/* Créditos activos (desembolsados) */}
          {creditosActivos.length > 0 && (
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <AccountBalanceIcon sx={{ color: "#0369a1" }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Créditos Activos
                </Typography>
                <Chip label={creditosActivos.length} size="small" color="primary" />
              </Stack>

              <Grid container spacing={3}>
                {creditosActivos.map((p) => (
                  <Grid item xs={12} md={6} key={p.id}>
                    <CreditoCard pedido={p} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Em curso (análise/aprovação) */}
          {creditosEmCurso.length > 0 && (
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <HourglassIcon sx={{ color: "#b45309" }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Em Análise / Aprovação
                </Typography>
                <Chip label={creditosEmCurso.length} size="small" color="warning" />
              </Stack>

              <Stack spacing={2}>
                {creditosEmCurso.map((p) => (
                  <Paper key={p.id} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={1.5}
                    >
                      <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                          <Typography sx={{ fontWeight: 700 }}>
                            {p.numeroPedido}
                          </Typography>
                          <Chip
                            label={getStatusLabel(p.status)}
                            color={getStatusColor(p.status)}
                            size="small"
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(p.valorSolicitado)} · {p.finalidade || "—"}
                        </Typography>
                      </Box>

                      <Button
                        component={RouterLink}
                        to={`/portal/meus-pedidos/${p.id}`}
                        variant="outlined"
                        size="small"
                        endIcon={<ArrowForwardIcon fontSize="small" />}
                      >
                        Ver Detalhe
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {/* Encerrados/Rejeitados */}
          {creditosEncerrados.length > 0 && (
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <CheckCircleIcon sx={{ color: "#6b7280" }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#6b7280" }}>
                  Encerrados / Rejeitados
                </Typography>
                <Chip label={creditosEncerrados.length} size="small" />
              </Stack>

              <Stack spacing={2}>
                {creditosEncerrados.map((p) => (
                  <Paper
                    key={p.id}
                    variant="outlined"
                    sx={{ p: 2.5, borderRadius: 2, opacity: 0.75 }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={1.5}
                    >
                      <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                          <Typography sx={{ fontWeight: 700 }}>
                            {p.numeroPedido}
                          </Typography>
                          <Chip
                            label={getStatusLabel(p.status)}
                            color={getStatusColor(p.status)}
                            size="small"
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(p.valorSolicitado)} · {formatDate(p.dataSubmissao)}
                        </Typography>
                      </Box>

                      <Button
                        component={RouterLink}
                        to={`/portal/meus-pedidos/${p.id}`}
                        variant="text"
                        size="small"
                        endIcon={<ArrowForwardIcon fontSize="small" />}
                      >
                        Ver Detalhe
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}