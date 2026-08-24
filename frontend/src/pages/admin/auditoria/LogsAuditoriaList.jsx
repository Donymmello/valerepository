import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PageHeader from "../../../components/common/PageHeader";
import LoadingState from "../../../components/common/LoadingState";
import {
  getAllLogsAuditoriaRequest,
  getLogAuditoriaByIdRequest,
  getMeusLogsAuditoriaRequest,
} from "../../../api/admin.api";
import { useAuth } from "../../../context/useAuth";
import { formatDate } from "../../../utils/formatters";

export default function LogsAuditoriaList() {
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const podeVerTodos = ["ADMIN", "GESTOR"].includes(user?.role);

  const carregarLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const data = podeVerTodos
        ? await getAllLogsAuditoriaRequest()
        : await getMeusLogsAuditoriaRequest();

      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Erro ao carregar logs de auditoria."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLogs();
  }, []);

  const logsFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return logs;

    return logs.filter((item) => {
      const acao = String(item.acao || "").toLowerCase();
      const entidade = String(item.entidade || "").toLowerCase();
      const descricao = String(item.descricao || "").toLowerCase();
      const userNome = String(item.user?.nome || "").toLowerCase();
      const userEmail = String(item.user?.email || "").toLowerCase();
      const entidadeId = String(item.entidadeId || "").toLowerCase();

      return (
        acao.includes(term) ||
        entidade.includes(term) ||
        descricao.includes(term) ||
        userNome.includes(term) ||
        userEmail.includes(term) ||
        entidadeId.includes(term)
      );
    });
  }, [logs, search]);

  const handleVerDetalhe = async (id) => {
    try {
      setDetailLoading(true);
      setError("");

      const data = podeVerTodos
        ? await getLogAuditoriaByIdRequest(id)
        : logs.find((item) => item.id === id);

      setSelectedLog(data || null);
      setDetailOpen(true);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Erro ao carregar detalhe do log."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFecharDetalhe = () => {
    setDetailOpen(false);
    setSelectedLog(null);
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="Logs de Auditoria"
        subtitle={
          podeVerTodos
            ? "Consulte o histórico de ações registadas no sistema."
            : "Consulte o histórico das suas ações registadas no sistema."
        }
        actions={
          <Chip
            label={podeVerTodos ? "Visão Global" : "Meus Logs"}
            color={podeVerTodos ? "primary" : "default"}
          />
        }
      />

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          label="Pesquisar por ação, entidade, descrição, utilizador ou entidade ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {logsFiltrados.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography color="text.secondary">
            Nenhum log de auditoria encontrado.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {logsFiltrados.map((item) => (
            <Paper key={item.id} sx={{ p: 3, borderRadius: 3 }}>
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
                      {item.acao || "Sem ação"}
                    </Typography>

                    <Chip
                      size="small"
                      label={item.entidade || "Sem entidade"}
                      variant="outlined"
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Descrição:</strong> {item.descricao || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Entidade ID:</strong> {item.entidadeId ?? "-"}
                  </Typography>

                  {item.user && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Utilizador:</strong> {item.user.nome || "-"}{" "}
                      {item.user.email ? `(${item.user.email})` : ""}
                    </Typography>
                  )}

                  <Typography variant="body2" color="text.secondary">
                    <strong>Data:</strong> {formatDate(item.created_at || item.createdAt)}
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => handleVerDetalhe(item.id)}
                    disabled={detailLoading}
                  >
                    {detailLoading ? "A carregar..." : "Ver Detalhe"}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog
        open={detailOpen}
        onClose={handleFecharDetalhe}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Detalhe do Log</DialogTitle>

        <DialogContent dividers>
          {selectedLog ? (
            <Stack spacing={1.5}>
              <Typography>
                <strong>ID:</strong> {selectedLog.id || "-"}
              </Typography>

              <Typography>
                <strong>Ação:</strong> {selectedLog.acao || "-"}
              </Typography>

              <Typography>
                <strong>Entidade:</strong> {selectedLog.entidade || "-"}
              </Typography>

              <Typography>
                <strong>Entidade ID:</strong> {selectedLog.entidadeId ?? "-"}
              </Typography>

              <Typography>
                <strong>Descrição:</strong> {selectedLog.descricao || "-"}
              </Typography>

              {selectedLog.user && (
                <>
                  <Typography>
                    <strong>Utilizador:</strong> {selectedLog.user.nome || "-"}
                  </Typography>

                  <Typography>
                    <strong>Email:</strong> {selectedLog.user.email || "-"}
                  </Typography>

                  <Typography>
                    <strong>Role:</strong> {selectedLog.user.role || "-"}
                  </Typography>
                </>
              )}

              <Typography>
                <strong>Data:</strong>{" "}
                {formatDate(selectedLog.created_at || selectedLog.createdAt)}
              </Typography>
            </Stack>
          ) : (
            <Typography color="text.secondary">
              Nenhum detalhe disponível.
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleFecharDetalhe}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}