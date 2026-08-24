import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Button,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getMeusCreditosRequest } from "../../api/portal.api";
import { formatCurrency } from "../../utils/formatters";
import PageHeader from "../../components/common/PageHeader";
import LoadingState from "../../components/common/LoadingState";

export default function MeusCreditos() {
  const navigate = useNavigate();
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregarCreditos = async () => {
    try {
      setLoading(true);
      const response = await getMeusCreditosRequest();
      setCreditos(response || []);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar créditos:", err);
      setError("Não foi possível carregar seus créditos.");
      setCreditos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCreditos();
  }, []);

  // Separar créditos por estado
  const creditosAtivos = creditos.filter((c) => c.estado === "ATIVO");
  const creditosLiquidados = creditos.filter((c) => c.estado === "LIQUIDADO");
  const creditosIncumprimento = creditos.filter(
    (c) => c.estado === "INCUMPRIMENTO"
  );

  // Cores para chips de estado
  const getCorEstado = (estado) => {
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

  // Rótulo de estado em português
  const getRótulEstado = (estado) => {
    switch (estado) {
      case "ATIVO":
        return "Ativo";
      case "LIQUIDADO":
        return "Liquidado";
      case "INCUMPRIMENTO":
        return "Incumprimento";
      default:
        return estado;
    }
  };

  // Calcular progresso de reembolso
  const calcularProgresso = (totalPago, montanteTotal) => {
    if (!montanteTotal || montanteTotal === 0) return 0;
    return Math.min((totalPago / montanteTotal) * 100, 100);
  };

  // Componente de card de crédito
  const CartaoCredito = ({ credito }) => {
    const progresso = calcularProgresso(credito.totalPago, credito.montanteTotal);

    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: 4,
            transform: "translateY(-4px)",
          },
          cursor: "pointer",
        }}
        onClick={() => navigate(`/portal/meus-creditos/${credito.id}`)}
      >
        <CardHeader
          title={`Contrato #${credito.id}`}
          subheader={`Desde ${new Date(credito.createdAt).toLocaleDateString("pt-PT")}`}
          action={
            <Chip
              label={getRótulEstado(credito.estado)}
              color={getCorEstado(credito.estado)}
              size="small"
            />
          }
          sx={{ pb: 1 }}
        />

        <CardContent sx={{ flex: 1 }}>
          {/* Valores principais */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Valor Original
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatCurrency(credito.valorOriginal)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Prestação
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatCurrency(credito.prestacao)}
              </Typography>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Prazo
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {credito.prazo} meses
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Taxa Anual
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {Number(credito.taxa || 0).toFixed(2) || "0,00"}%
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Saldo e Total Pago */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Saldo Atual
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "error.main" }}>
                {formatCurrency(credito.saldoAtual)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Total Pago
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "success.main" }}>
                {formatCurrency(credito.totalPago)}
              </Typography>
            </Grid>
          </Grid>

          {/* Barra de Progresso */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="caption" color="textSecondary">
                Progresso de Reembolso
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {progresso.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progresso} />
          </Box>

          {/* Resumo */}
          <Box sx={{ mt: 2, p: 1, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Montante Total:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatCurrency(credito.montanteTotal)}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Seção vazia
  const SecaoVazia = ({ titulo }) => (
    <Box sx={{ textAlign: "center", py: 4 }}>
      <Typography variant="h6" color="textSecondary">
        {titulo}
      </Typography>
    </Box>
  );

  // Carregamento
  if (loading) {
    return <LoadingState />;
  }

  // Erro
  if (error) {
    return (
      <Box>
        <PageHeader title="Meus Créditos" subtitle="Consulte os seus créditos ativos e o histórico de pagamentos." />
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={carregarCreditos} sx={{ mt: 2 }}>
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  // Sem créditos
  if (creditos.length === 0) {
    return (
      <Box>
        <PageHeader title="Meus Créditos" subtitle="Consulte os seus créditos ativos e o histórico de pagamentos." />
        <Alert severity="info">
          Você ainda não possui créditos. Crie um novo pedido para começar.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/portal/criar-pedido")}
          sx={{ mt: 2 }}
        >
          Solicitar Crédito
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Meus Créditos" subtitle="Consulte os seus créditos ativos e o histórico de pagamentos." />

      {/* Créditos Ativos */}
      {creditosAtivos.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            💰 Créditos Ativos
          </Typography>
          <Grid container spacing={3}>
            {creditosAtivos.map((credito) => (
              <Grid item xs={12} sm={6} md={4} key={credito.id}>
                <CartaoCredito credito={credito} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Créditos Liquidados */}
      {creditosLiquidados.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            ✅ Créditos Liquidados
          </Typography>
          <Grid container spacing={3}>
            {creditosLiquidados.map((credito) => (
              <Grid item xs={12} sm={6} md={4} key={credito.id}>
                <CartaoCredito credito={credito} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Créditos em Incumprimento */}
      {creditosIncumprimento.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: "error.main" }}>
            ⚠️ Créditos em Incumprimento
          </Typography>
          <Grid container spacing={3}>
            {creditosIncumprimento.map((credito) => (
              <Grid item xs={12} sm={6} md={4} key={credito.id}>
                <CartaoCredito credito={credito} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}