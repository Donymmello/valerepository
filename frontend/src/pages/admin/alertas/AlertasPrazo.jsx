import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { verificarAlertasPrazoRequest } from "../../../api/admin.api";
import PageHeader from "../../../components/common/PageHeader";

export default function AlertasPrazo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleVerificar = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await verificarAlertasPrazoRequest();
      setResultado(data);
      setSuccessOpen(true);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Erro ao verificar alertas de prazo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Alertas de Prazo"
        subtitle="Verifique pedidos com prazo de avaliação ou validação vencido ou próximo e gere notificações para acompanhamento."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Executar Verificação
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Esta ação verifica pedidos com prazo de avaliação ou validação
            próximo do vencimento e gera notificações no módulo de notificações.
          </Typography>

          <Box>
            <Button
              variant="contained"
              onClick={handleVerificar}
              disabled={loading}
            >
              {loading ? "A verificar..." : "Verificar Alertas"}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {resultado && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
              Resultado da Verificação
            </Typography>

            <Stack spacing={1}>
              <Typography>
                <strong>Mensagem:</strong> {resultado.message || "-"}
              </Typography>

              <Typography>
                <strong>Total de alertas criados:</strong>{" "}
                {resultado.totalAlertas || 0}
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={2}>
              <Button
                component={RouterLink}
                to="/interno/notificacoes"
                variant="outlined"
              >
                Ver Notificações
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
              Alertas Criados
            </Typography>

            {resultado.alertasCriados?.length ? (
              <Stack spacing={2}>
                {resultado.alertasCriados.map((item, index) => (
                  <Paper
                    key={`${item.pedidoId}-${index}`}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2 }}
                  >
                    <Stack spacing={1}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {item.numeroPedido || `Pedido #${item.pedidoId}`}
                        </Typography>

                        <Chip
                          size="small"
                          label={item.tipo || "-"}
                          color={item.tipo === "VALIDACAO" ? "info" : "warning"}
                        />

                        <Chip
                          size="small"
                          label={item.vencido ? "Vencido" : "Próximo"}
                          color={item.vencido ? "error" : "warning"}
                          variant={item.vencido ? "filled" : "outlined"}
                        />
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        <strong>Pedido ID:</strong> {item.pedidoId || "-"}
                      </Typography>

                      {item.pedidoId && (
                        <Box>
                          <Button
                            component={RouterLink}
                            to={`/interno/pedidos/${item.pedidoId}`}
                            variant="outlined"
                            size="small"
                          >
                            Ver Pedido
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Nenhum alerta novo foi criado nesta verificação.
              </Typography>
            )}
          </Paper>
        </Stack>
      )}

      <Snackbar
        open={successOpen}
        autoHideDuration={1800}
        onClose={() => setSuccessOpen(false)}
        message="Verificação concluída com sucesso."
      />
    </Box>
  );
}