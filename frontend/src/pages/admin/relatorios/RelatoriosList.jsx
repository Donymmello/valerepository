import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  getResumoGeralRequest,
  getRelatorioPedidosRequest,
  getRelatorioFinanceiroPedidosRequest,
  getRelatorioDesembolsosRequest,
  getRelatorioReembolsosRequest,
} from "../../../api/admin.api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../../utils/formatters";
import PageHeader from "../../../components/common/PageHeader";
import LoadingState from "../../../components/common/LoadingState";
import StatCard from "../../../components/common/StatCard";
import StatusChip from "../../../components/common/StatusChip";

export default function RelatoriosList() {
  const [loading, setLoading] = useState(true);
  const [loadingFiltros, setLoadingFiltros] = useState(false);
  const [error, setError] = useState("");

  const [resumo, setResumo] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [financeiroPedidos, setFinanceiroPedidos] = useState([]);
  const [relatorioDesembolsos, setRelatorioDesembolsos] = useState({
    totalDesembolsado: 0,
    quantidade: 0,
    desembolsos: [],
  });
  const [relatorioReembolsos, setRelatorioReembolsos] = useState({
    totalReembolsado: 0,
    quantidade: 0,
    reembolsos: [],
  });

  const [filtros, setFiltros] = useState({
    status: "",
    dataInicial: "",
    dataFinal: "",
  });

  const carregarDados = async (paramsPedidos = {}, paramsFinanceiros = {}) => {
    try {
      setError("");

      const [
        resumoData,
        pedidosData,
        financeiroData,
        desembolsosData,
        reembolsosData,
      ] = await Promise.all([
        getResumoGeralRequest(),
        getRelatorioPedidosRequest(paramsPedidos),
        getRelatorioFinanceiroPedidosRequest(paramsPedidos),
        getRelatorioDesembolsosRequest(paramsFinanceiros),
        getRelatorioReembolsosRequest(paramsFinanceiros),
      ]);

      setResumo(resumoData || null);
      setPedidos(Array.isArray(pedidosData) ? pedidosData : []);
      setFinanceiroPedidos(Array.isArray(financeiroData) ? financeiroData : []);
      setRelatorioDesembolsos(
        desembolsosData || {
          totalDesembolsado: 0,
          quantidade: 0,
          desembolsos: [],
        }
      );
      setRelatorioReembolsos(
        reembolsosData || {
          totalReembolsado: 0,
          quantidade: 0,
          reembolsos: [],
        }
      );
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao carregar relatórios.");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await carregarDados();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleFiltroChange = (event) => {
    const { name, value } = event.target;
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAplicarFiltros = async () => {
    try {
      setLoadingFiltros(true);

      const paramsPedidos = {};
      const paramsFinanceiros = {};

      if (filtros.status) {
        paramsPedidos.status = filtros.status;
      }

      if (filtros.dataInicial) {
        paramsPedidos.dataInicial = filtros.dataInicial;
        paramsFinanceiros.dataInicial = filtros.dataInicial;
      }

      if (filtros.dataFinal) {
        paramsPedidos.dataFinal = filtros.dataFinal;
        paramsFinanceiros.dataFinal = filtros.dataFinal;
      }

      await carregarDados(paramsPedidos, paramsFinanceiros);
    } finally {
      setLoadingFiltros(false);
    }
  };

  const handleLimparFiltros = async () => {
    const novosFiltros = {
      status: "",
      dataInicial: "",
      dataFinal: "",
    };

    setFiltros(novosFiltros);

    try {
      setLoadingFiltros(true);
      await carregarDados();
    } finally {
      setLoadingFiltros(false);
    }
  };

  const topPedidosFinanceiros = useMemo(() => {
    return [...financeiroPedidos].slice(0, 8);
  }, [financeiroPedidos]);

  const pedidosRecentes = useMemo(() => {
    return [...pedidos].slice(0, 8);
  }, [pedidos]);

  const desembolsosRecentes = useMemo(() => {
    return Array.isArray(relatorioDesembolsos?.desembolsos)
      ? relatorioDesembolsos.desembolsos.slice(0, 8)
      : [];
  }, [relatorioDesembolsos]);

  const reembolsosRecentes = useMemo(() => {
    return Array.isArray(relatorioReembolsos?.reembolsos)
      ? relatorioReembolsos.reembolsos.slice(0, 8)
      : [];
  }, [relatorioReembolsos]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="Relatórios"
        subtitle="Visão resumida e financeira do sistema de crédito."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
          Filtros
        </Typography>

        <Stack spacing={2}>
          <TextField
            select
            fullWidth
            label="Status do Pedido"
            name="status"
            value={filtros.status}
            onChange={handleFiltroChange}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="RASCUNHO">RASCUNHO</MenuItem>
            <MenuItem value="SUBMETIDO">SUBMETIDO</MenuItem>
            <MenuItem value="EM_ANALISE">EM_ANALISE</MenuItem>
            <MenuItem value="EM_VALIDACAO">EM_VALIDACAO</MenuItem>
            <MenuItem value="APROVADO">APROVADO</MenuItem>
            <MenuItem value="REJEITADO">REJEITADO</MenuItem>
            <MenuItem value="DESEMBOLSADO">DESEMBOLSADO</MenuItem>
            <MenuItem value="ENCERRADO">ENCERRADO</MenuItem>
          </TextField>

          <TextField
            fullWidth
            type="date"
            label="Data Inicial"
            name="dataInicial"
            value={filtros.dataInicial}
            onChange={handleFiltroChange}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            type="date"
            label="Data Final"
            name="dataFinal"
            value={filtros.dataFinal}
            onChange={handleFiltroChange}
            InputLabelProps={{ shrink: true }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="contained"
              onClick={handleAplicarFiltros}
              disabled={loadingFiltros}
            >
              {loadingFiltros ? "A aplicar..." : "Aplicar Filtros"}
            </Button>

            <Button
              variant="outlined"
              onClick={handleLimparFiltros}
              disabled={loadingFiltros}
            >
              Limpar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard label="Total de Pedidos" value={resumo?.totalPedidos || 0} />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <StatCard label="Total Desembolsado" value={formatCurrency(resumo?.totalDesembolsado || 0)} />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <StatCard label="Total Reembolsado" value={formatCurrency(resumo?.totalReembolsado || 0)} />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <StatCard label="Saldo Global" value={formatCurrency(resumo?.saldoGlobal || 0)} />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
          Pedidos por Status
        </Typography>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {resumo?.pedidosPorStatus &&
            Object.entries(resumo.pedidosPorStatus).map(([status, total]) => (
              <Chip
                key={status}
                label={`${getStatusLabel(status)}: ${total}`}
                color={getStatusColor(status)}
              />
            ))}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
          Pedidos Recentes
        </Typography>

        {pedidosRecentes.length === 0 ? (
          <Typography color="text.secondary">
            Nenhum pedido encontrado.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {pedidosRecentes.map((pedido) => (
              <Box key={pedido.id}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      mb={1}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {pedido.numeroPedido}
                      </Typography>

                      <StatusChip status={pedido.status} />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Mutuário:</strong>{" "}
                      {pedido.mutuario?.nomeCompleto || "-"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Valor solicitado:</strong>{" "}
                      {formatCurrency(pedido.valorSolicitado || 0)}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Finalidade:</strong> {pedido.finalidade || "-"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Data:</strong> {formatDate(pedido.created_at || pedido.createdAt)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
          Financeiro por Pedido
        </Typography>

        {topPedidosFinanceiros.length === 0 ? (
          <Typography color="text.secondary">
            Nenhum dado financeiro encontrado.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {topPedidosFinanceiros.map((item) => (
              <Box key={item.pedidoId}>
                <Stack spacing={1}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {item.numeroPedido}
                    </Typography>

                    <StatusChip status={item.status} />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Mutuário:</strong> {item.mutuario?.nomeCompleto || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Valor solicitado:</strong>{" "}
                    {formatCurrency(item.valorSolicitado || 0)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Total desembolsado:</strong>{" "}
                    {formatCurrency(item.totalDesembolsado || 0)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Total reembolsado:</strong>{" "}
                    {formatCurrency(item.totalReembolsado || 0)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Saldo:</strong> {formatCurrency(item.saldo || 0)}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={1}>
              Relatório de Desembolsos
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={2}>
              Quantidade: {relatorioDesembolsos?.quantidade || 0}
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 700 }} mb={2}>
              Total: {formatCurrency(relatorioDesembolsos?.totalDesembolsado || 0)}
            </Typography>

            {desembolsosRecentes.length === 0 ? (
              <Typography color="text.secondary">
                Nenhum desembolso encontrado.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {desembolsosRecentes.map((item) => (
                  <Box key={item.id}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.pedido?.numeroPedido || `Desembolso #${item.id}`}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Mutuário:</strong>{" "}
                      {item.pedido?.mutuario?.nomeCompleto || "-"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Valor:</strong>{" "}
                      {formatCurrency(item.valorDesembolsado || 0)}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Data:</strong> {formatDate(item.dataDesembolso)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={1}>
              Relatório de Reembolsos
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={2}>
              Quantidade: {relatorioReembolsos?.quantidade || 0}
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 700 }} mb={2}>
              Total: {formatCurrency(relatorioReembolsos?.totalReembolsado || 0)}
            </Typography>

            {reembolsosRecentes.length === 0 ? (
              <Typography color="text.secondary">
                Nenhum reembolso encontrado.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {reembolsosRecentes.map((item) => (
                  <Box key={item.id}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.pedido?.numeroPedido || `Reembolso #${item.id}`}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Mutuário:</strong>{" "}
                      {item.pedido?.mutuario?.nomeCompleto || "-"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Valor:</strong>{" "}
                      {formatCurrency(item.valorReembolsado || 0)}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Data:</strong> {formatDate(item.dataReembolso)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}