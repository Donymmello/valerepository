import { useEffect, useState } from "react";
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
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import {
  getComprovatiosByPedidoRequest,
  validarComprovatioRequest,
  downloadComprovatioRequest,
} from "../../api/admin.api";
import { formatDate } from "../../utils/formatters";

// ─── Badge de estado ──────────────────────────────────────────────────────────
function EstadoChip({ estado }) {
  const map = {
    PENDENTE: { label: "Pendente", color: "warning" },
    VALIDADO: { label: "Validado", color: "success" },
    REJEITADO: { label: "Rejeitado", color: "error" },
  };
  const config = map[estado] ?? { label: estado, color: "default" };
  return <Chip label={config.label} color={config.color} size="small" />;
}

// ─── Formulário de validação ──────────────────────────────────────────────────
function FormValidacao({ comprativoId, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    estado: "",
    observacoes: "",
    valorReembolsado: "",
    dataReembolso: new Date().toISOString().split("T")[0],
    meioPagamento: "TRANSFERENCIA",
    numeroTransacao: "",
  });

  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setErro("");

    if (!form.estado) {
      setErro("Selecione uma decisão.");
      return;
    }

    if (form.estado === "VALIDADO" && (!form.valorReembolsado || Number(form.valorReembolsado) <= 0)) {
      setErro("Informe o valor reembolsado para validar.");
      return;
    }

    try {
      setSaving(true);
      await validarComprovatioRequest(comprativoId, {
        estado: form.estado,
        observacoes: form.observacoes || null,
        valorReembolsado: form.estado === "VALIDADO" ? Number(form.valorReembolsado) : undefined,
        dataReembolso: form.estado === "VALIDADO" ? form.dataReembolso : undefined,
        meioPagamento: form.estado === "VALIDADO" ? form.meioPagamento : undefined,
        numeroTransacao: form.estado === "VALIDADO" ? form.numeroTransacao || null : undefined,
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      setErro(err?.response?.data?.message || "Erro ao validar comprovativo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mt: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 2 }}>
        Decisão
      </Typography>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      <Stack spacing={2}>
        <TextField
          select
          fullWidth
          label="Decisão"
          name="estado"
          value={form.estado}
          onChange={handleChange}
          size="small"
        >
          <MenuItem value="">Selecionar</MenuItem>
          <MenuItem value="VALIDADO">Validar — criar reembolso</MenuItem>
          <MenuItem value="REJEITADO">Rejeitar</MenuItem>
        </TextField>

        {form.estado === "VALIDADO" && (
          <>
            <TextField
              fullWidth
              label="Valor Reembolsado (MZN)"
              name="valorReembolsado"
              type="number"
              value={form.valorReembolsado}
              onChange={handleChange}
              size="small"
              inputProps={{ min: 0 }}
            />

            <TextField
              fullWidth
              label="Data do Reembolso"
              name="dataReembolso"
              type="date"
              value={form.dataReembolso}
              onChange={handleChange}
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              fullWidth
              label="Meio de Pagamento"
              name="meioPagamento"
              value={form.meioPagamento}
              onChange={handleChange}
              size="small"
            >
              <MenuItem value="TRANSFERENCIA">Transferência</MenuItem>
              <MenuItem value="CHEQUE">Cheque</MenuItem>
              <MenuItem value="DINHEIRO">Dinheiro</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Número de Transação (opcional)"
              name="numeroTransacao"
              value={form.numeroTransacao}
              onChange={handleChange}
              size="small"
            />
          </>
        )}

        <TextField
          fullWidth
          label={form.estado === "REJEITADO" ? "Motivo da rejeição" : "Observações (opcional)"}
          name="observacoes"
          multiline
          minRows={2}
          value={form.observacoes}
          onChange={handleChange}
          size="small"
        />

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="text" size="small" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "A guardar..." : "Guardar Decisão"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

// ─── Componente principal (usado no backoffice) ───────────────────────────────
/**
 * Props:
 *   pedidoId  {string|number}
 *   onUpdated {function}  — callback para recarregar dados do pedido pai
 */
export default function ComprovativoBackofficeSection({ pedidoId, onUpdated }) {
  const [comprovativos, setComprovativos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [validandoId, setValidandoId] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const carregar = async () => {
    try {
      setLoading(true);
      setErro("");
      const data = await getComprovatiosByPedidoRequest(pedidoId);
      setComprovativos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setErro("Erro ao carregar comprovativos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pedidoId) carregar();
  }, [pedidoId]);

  const handleDownload = async (c) => {
    try {
      setDownloadingId(c.id);
      await downloadComprovatioRequest(c.id, c.nome);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleValidacaoSuccess = async () => {
    setValidandoId(null);
    setSuccessOpen(true);
    await carregar();
    if (onUpdated) onUpdated();
  };

  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center" py={2}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          A carregar comprovativos...
        </Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }} mb={1}>
        Comprovativos de Pagamento
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Comprovativos enviados pelo mutuário para validação.
      </Typography>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {comprovativos.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
          Nenhum comprovativo enviado ainda.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {comprovativos.map((c) => (
            <Box key={c.id}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                    <ReceiptIcon color="action" fontSize="small" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                        {c.nome}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                        <EstadoChip estado={c.estado} />
                        <Typography variant="caption" color="text.secondary">
                          Enviado em {formatDate(c.created_at)}
                        </Typography>
                        {c.remetente && (
                          <Typography variant="caption" color="text.secondary">
                            por {c.remetente.nome}
                          </Typography>
                        )}
                      </Stack>
                      {c.estado !== "PENDENTE" && c.observacoes && (
                        <Typography variant="caption" color={c.estado === "REJEITADO" ? "error" : "text.secondary"} sx={{ display: "block", mt: 0.5 }}>
                          {c.estado === "REJEITADO" ? `Motivo: ${c.observacoes}` : c.observacoes}
                        </Typography>
                      )}
                      {c.estado !== "PENDENTE" && c.validador && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {c.estado === "VALIDADO" ? "Validado" : "Rejeitado"} por {c.validador.nome} em {formatDate(c.dataValidacao)}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon fontSize="small" />}
                      onClick={() => handleDownload(c)}
                      disabled={downloadingId === c.id}
                    >
                      {downloadingId === c.id ? "A baixar..." : "Baixar"}
                    </Button>

                    {c.estado === "PENDENTE" && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() => setValidandoId(validandoId === c.id ? null : c.id)}
                      >
                        {validandoId === c.id ? "Cancelar" : "Validar"}
                      </Button>
                    )}
                  </Stack>
                </Stack>

                {validandoId === c.id && (
                  <FormValidacao
                    comprativoId={c.id}
                    onSuccess={handleValidacaoSuccess}
                    onCancel={() => setValidandoId(null)}
                  />
                )}
              </Paper>
            </Box>
          ))}
        </Stack>
      )}

      <Snackbar
        open={successOpen}
        autoHideDuration={1800}
        onClose={() => setSuccessOpen(false)}
        message="Comprovativo processado com sucesso."
      />
    </Box>
  );
}
