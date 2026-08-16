import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { getResumoGeralRequest, getDashboardFinanceiroRequest } from "../../api/admin.api";
import { formatCurrency, getStatusLabel, getStatusColor } from "../../utils/formatters";
import LoadingState from "../../components/common/LoadingState";
import StatCard from "../../components/common/StatCard";
import { CORES } from "../../theme";

function ModuloCard({ titulo, descricao, to, buttonLabel }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
      <Stack spacing={2} height="100%" justifyContent="space-between">
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={1}>
            {titulo}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {descricao}
          </Typography>
        </Box>
        <Box>
          <Button component={RouterLink} to={to} variant="contained" size="small">
            {buttonLabel}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function DashboardInterno() {
  const { user } = useAuth();
  const [resumo, setResumo] = useState(null);
  const [financeiro, setFinanceiro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resumoData, financeiroData] = await Promise.all([
          getResumoGeralRequest(),
          getDashboardFinanceiroRequest(),
        ]);
        setResumo(resumoData);
        setFinanceiro(financeiroData);
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar o resumo.");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const parcelasVencidas = financeiro?.parcelas?.parcelasVencidas ?? 0;
  const creditosIncumprimento = financeiro?.resumo?.creditosIncumprimento ?? 0;
  const temAtencaoNecessaria = parcelasVencidas > 0 || creditosIncumprimento > 0;

  return (
    <Box>
      {/* Cabeçalho */}
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} mb={0.5}>
          Dashboard Interno
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bem-vindo, {user?.nome}. Aqui tem uma visão geral do sistema.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* Aviso de atenção necessária — só aparece quando há algo a tratar */}
          {temAtencaoNecessaria && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                {parcelasVencidas > 0 && (
                  <Typography variant="body2">
                    <strong>{parcelasVencidas}</strong> parcela{parcelasVencidas !== 1 ? "s" : ""} vencida{parcelasVencidas !== 1 ? "s" : ""} por cobrar
                  </Typography>
                )}
                {creditosIncumprimento > 0 && (
                  <Typography variant="body2">
                    <strong>{creditosIncumprimento}</strong> crédito{creditosIncumprimento !== 1 ? "s" : ""} em incumprimento
                  </Typography>
                )}
              </Stack>
            </Alert>
          )}

          {/* Carteira */}
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
            Carteira
          </Typography>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Saldo da Carteira"
                value={formatCurrency(financeiro?.financeiro?.saldoCarteira)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Total Desembolsado"
                value={formatCurrency(financeiro?.financeiro?.valorDesembolsado)}
                color={CORES.info}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Total Recebido"
                value={formatCurrency(financeiro?.financeiro?.valorRecebido)}
                color={CORES.sucesso}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Parcelas Vencidas"
                value={parcelasVencidas}
                color={parcelasVencidas > 0 ? CORES.erro : CORES.marca}
              />
            </Grid>
          </Grid>

          {/* Pedidos */}
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
            Pedidos
          </Typography>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Total de Pedidos" value={resumo?.totalPedidos ?? 0} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Pedidos Pendentes" value={resumo?.pedidosPendentes ?? 0} color={CORES.aviso} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Pedidos Aprovados" value={resumo?.pedidosAprovados ?? 0} color={CORES.sucesso} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Total Mutuários" value={resumo?.totalMutuarios ?? 0} color={CORES.roxo} />
            </Grid>
          </Grid>

          {resumo?.pedidosPorStatus && Object.keys(resumo.pedidosPorStatus).length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                Pedidos por estado
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {Object.entries(resumo.pedidosPorStatus).map(([status, total]) => (
                  <Chip
                    key={status}
                    label={`${getStatusLabel(status)}: ${total}`}
                    color={getStatusColor(status)}
                    size="small"
                  />
                ))}
              </Stack>
            </Paper>
          )}

          {/* Créditos */}
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
            Créditos
          </Typography>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Créditos Ativos" value={financeiro?.resumo?.creditosAtivos ?? 0} color={CORES.sucesso} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Créditos Liquidados" value={financeiro?.resumo?.creditosLiquidados ?? 0} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Em Incumprimento"
                value={creditosIncumprimento}
                color={creditosIncumprimento > 0 ? CORES.erro : CORES.marca}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Reestruturados" value={financeiro?.resumo?.creditosReestruturados ?? 0} color={CORES.roxo} />
            </Grid>
          </Grid>
        </>
      )}

      <Divider sx={{ mb: 4 }} />

      {/* Módulos */}
      <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
        Módulos
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Pedidos"
            descricao="Consulte, acompanhe e trate pedidos de crédito."
            to="/interno/pedidos"
            buttonLabel="Abrir Pedidos"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Mutuários"
            descricao="Veja e gira os registos de mutuários."
            to="/interno/mutuarios"
            buttonLabel="Abrir Mutuários"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Aprovações"
            descricao="Acompanhe decisões e fluxo de aprovação."
            to="/interno/aprovacoes"
            buttonLabel="Abrir Aprovações"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Desembolsos"
            descricao="Registe e acompanhe desembolsos efetuados."
            to="/interno/desembolsos"
            buttonLabel="Abrir Desembolsos"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Reembolsos"
            descricao="Consulte e registe reembolsos dos pedidos."
            to="/interno/reembolsos"
            buttonLabel="Abrir Reembolsos"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Alertas de Prazo"
            descricao="Verifique pedidos com prazos a vencer."
            to="/interno/alertas-prazo"
            buttonLabel="Ver Alertas"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ModuloCard
            titulo="Relatórios"
            descricao="Análises e exportações de dados do sistema."
            to="/interno/relatorios"
            buttonLabel="Ver Relatórios"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
