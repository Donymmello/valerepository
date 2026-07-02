import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import {
  deleteNotificacaoRequest,
  getMinhasNotificacoesRequest,
  marcarNotificacaoComoLidaRequest,
  marcarTodasNotificacoesComoLidasRequest,
} from "../../api/portal.api";
import { formatDate } from "../../utils/formatters";

function getTipoColor(tipo) {
  switch (tipo) {
    case "APROVACAO":
      return "success";
    case "REJEICAO":
      return "error";
    case "ALERTA_PRAZO":
      return "warning";
    case "ALERTA_PAGAMENTO":
      return "info";
    case "SISTEMA":
    default:
      return "default";
  }
}

function getTipoLabel(tipo) {
  switch (tipo) {
    case "APROVACAO":
      return "Aprovação";
    case "REJEICAO":
      return "Rejeição";
    case "ALERTA_PRAZO":
      return "Alerta de Prazo";
    case "ALERTA_PAGAMENTO":
      return "Alerta de Pagamento";
    case "SISTEMA":
    default:
      return "Sistema";
  }
}

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  const carregarNotificacoes = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMinhasNotificacoesRequest();
      setNotificacoes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  const totalNaoLidas = useMemo(() => {
    return notificacoes.filter((item) => !item.lida).length;
  }, [notificacoes]);

  const handleMarcarComoLida = async (id) => {
    try {
      setActionLoadingId(id);
      setError("");

      await marcarNotificacaoComoLidaRequest(id);
      setSuccessOpen(true);
      await carregarNotificacoes();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Erro ao marcar notificação como lida."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarcarTodas = async () => {
    try {
      setBulkLoading(true);
      setError("");

      await marcarTodasNotificacoesComoLidasRequest();
      setSuccessOpen(true);
      await carregarNotificacoes();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
        "Erro ao marcar todas as notificações como lidas."
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const handleApagar = async (id) => {
    try {
      setActionLoadingId(id);
      setError("");

      await deleteNotificacaoRequest(id);
      setSuccessOpen(true);
      await carregarNotificacoes();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao apagar notificação.");
    } finally {
      setActionLoadingId(null);
    }
  };

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
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Minhas Notificações
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Consulte e gira as notificações ligadas à sua conta.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Chip
            label={`Não lidas: ${totalNaoLidas}`}
            color={totalNaoLidas > 0 ? "warning" : "default"}
          />

          <Button
            variant="outlined"
            onClick={handleMarcarTodas}
            disabled={bulkLoading || totalNaoLidas === 0}
          >
            {bulkLoading ? "A processar..." : "Marcar Todas como Lidas"}
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {notificacoes.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography color="text.secondary">
            Não existem notificações para mostrar.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {notificacoes.map((item) => (
            <Paper
              key={item.id}
              sx={{
                p: 3,
                borderRadius: 3,
                borderLeft: item.lida ? "4px solid transparent" : "4px solid #ed6c02",
                opacity: item.lida ? 0.9 : 1,
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={3}
              >
                <Box>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    mb={1}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {item.titulo || "Sem título"}
                    </Typography>

                    <Chip
                      size="small"
                      label={getTipoLabel(item.tipo)}
                      color={getTipoColor(item.tipo)}
                    />

                    <Chip
                      size="small"
                      label={item.lida ? "Lida" : "Não Lida"}
                      color={item.lida ? "default" : "warning"}
                      variant={item.lida ? "outlined" : "filled"}
                    />
                  </Stack>

                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {item.mensagem || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Pedido:</strong> {item.pedidoId || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Data:</strong> {formatDate(item.created_at || item.createdAt)}
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  {!item.lida && (
                    <Button
                      variant="contained"
                      onClick={() => handleMarcarComoLida(item.id)}
                      disabled={actionLoadingId === item.id}
                    >
                      {actionLoadingId === item.id
                        ? "A processar..."
                        : "Marcar como Lida"}
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleApagar(item.id)}
                    disabled={actionLoadingId === item.id}
                  >
                    {actionLoadingId === item.id ? "A processar..." : "Apagar"}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Snackbar
        open={successOpen}
        autoHideDuration={1800}
        onClose={() => setSuccessOpen(false)}
        message="Operação realizada com sucesso."
      />
    </Box>
  );
}