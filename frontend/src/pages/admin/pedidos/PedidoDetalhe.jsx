import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  decidirAprovacaoRequest,
  getAprovacoesByPedidoRequest,
  getPedidoByIdRequest,
} from "../../../api/admin.api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../../utils/formatters";
import { useAuth } from "../../../context/AuthContext";
import PedidoRequisitosSection from "../../../pages/admin/pedidos/PedidoRequisitosSection";

export default function PedidoDetalhe() {
  const { id } = useParams();
  const { user } = useAuth();

  const [pedido, setPedido] = useState(null);
  const [aprovacoes, setAprovacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  const [form, setForm] = useState({
    nivel: "",
    decisao: "",
    comentario: "",
  });

  const podeDecidir = ["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"].includes(
    user?.role
  );

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError("");

      const [pedidoData, aprovacoesData] = await Promise.all([
        getPedidoByIdRequest(id),
        getAprovacoesByPedidoRequest(id),
      ]);

      setPedido(pedidoData);

      setAprovacoes(
        Array.isArray(aprovacoesData?.aprovacoes)
          ? aprovacoesData.aprovacoes
          : []
      );

      setForm((prev) => ({
        ...prev,
        nivel: String(pedidoData?.etapaAtual || ""),
      }));
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Erro ao carregar detalhe do pedido."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [id]);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleDecidir = async () => {
    setError("");

    if (!form.nivel) {
      setError("O nível é obrigatório.");
      return;
    }

    if (!form.decisao) {
      setError("Selecione a decisão.");
      return;
    }

    setActionLoading(true);

    try {
      await decidirAprovacaoRequest(id, {
        nivel: Number(form.nivel),
        decisao: form.decisao,
        comentario: form.comentario,
      });

      setSuccessOpen(true);

      setForm((prev) => ({
        ...prev,
        decisao: "",
        comentario: "",
      }));

      await carregarDados();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Erro ao registar decisão de aprovação."
      );
    } finally {
      setActionLoading(false);
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
          <Typography variant="h4" sx={{ fontWeight: 700 }} mb={1}>
            Detalhe do Pedido
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Visualização interna e decisão do pedido de crédito.
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to={`/interno/pedidos/${id}/extrato`}
          variant="outlined"
        >
          Ver Extrato
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {pedido && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={2}
              mb={2}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {pedido.numeroPedido}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Submetido em {formatDate(pedido.dataSubmissao)}
                </Typography>
              </Box>

              <Chip
                label={getStatusLabel(pedido.status)}
                color={getStatusColor(pedido.status)}
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.2}>
              <Typography>
                <strong>Mutuário:</strong> {pedido.mutuario?.nomeCompleto || "-"}
              </Typography>

              <Typography>
                <strong>Valor Solicitado:</strong>{" "}
                {formatCurrency(pedido.valorSolicitado)}
              </Typography>

              <Typography>
                <strong>Finalidade:</strong> {pedido.finalidade || "-"}
              </Typography>

              <Typography>
                <strong>Pacote de Financiamento:</strong>{" "}
                {pedido.pacoteFinanciamento || "-"}
              </Typography>

              <Typography>
                <strong>Etapa Atual:</strong> {pedido.etapaAtual || "-"}
              </Typography>

              <Typography>
                <strong>Prazo de Avaliação:</strong>{" "}
                {formatDate(pedido.prazoAvaliacao)}
              </Typography>

              <Typography>
                <strong>Prazo de Validação:</strong>{" "}
                {formatDate(pedido.prazoValidacao)}
              </Typography>

              <Typography>
                <strong>Observações:</strong> {pedido.observacoes || "-"}
              </Typography>
            </Stack>
          </Paper>

          <PedidoRequisitosSection
            pedidoId={id}
            pedidoStatus={pedido?.status}
            onUpdated={carregarDados}
          />

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
              Histórico de Aprovações
            </Typography>

            {aprovacoes.length ? (
              <Stack spacing={2}>
                {aprovacoes.map((item) => (
                  <Box key={item.id}>
                    <Typography>
                      <strong>Nível:</strong> {item.nivel || "-"}
                    </Typography>
                    <Typography>
                      <strong>Decisão:</strong> {item.decisao || "-"}
                    </Typography>
                    <Typography>
                      <strong>Comentário:</strong> {item.comentario || "-"}
                    </Typography>
                    <Typography>
                      <strong>Aprovador:</strong> {item.aprovador?.nome || "-"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Data: {formatDate(item.dataDecisao)}
                    </Typography>
                    <Divider sx={{ mt: 1.5 }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Ainda não existem aprovações registadas.
              </Typography>
            )}
          </Paper>

          {podeDecidir && (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
                Registar Decisão
              </Typography>

              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Nível"
                  name="nivel"
                  value={form.nivel}
                  onChange={handleChange}
                  type="number"
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Este valor segue a etapa atual do pedido."
                />

                <TextField
                  select
                  fullWidth
                  label="Decisão"
                  name="decisao"
                  value={form.decisao}
                  onChange={handleChange}
                >
                  <MenuItem value="">Selecionar</MenuItem>
                  <MenuItem value="APROVADO">Aprovar</MenuItem>
                  <MenuItem value="REJEITADO">Rejeitar</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  label="Comentário"
                  name="comentario"
                  multiline
                  minRows={4}
                  value={form.comentario}
                  onChange={handleChange}
                />

                <Box>
                  <Button
                    variant="contained"
                    onClick={handleDecidir}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "A guardar..." : "Guardar Decisão"}
                  </Button>
                </Box>
              </Stack>
            </Paper>
          )}
        </Stack>
      )}

      <Snackbar
        open={successOpen}
        autoHideDuration={1500}
        onClose={() => setSuccessOpen(false)}
        message="Decisão registada com sucesso."
      />
    </Box>
  );
}