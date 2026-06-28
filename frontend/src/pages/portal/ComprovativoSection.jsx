import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
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

// ─── Linha de um comprovativo ─────────────────────────────────────────────────
function ComprovatioItem({ comprovativo, onDownload, downloadingId }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <ReceiptIcon color="action" fontSize="small" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
            {comprovativo.nome}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
            <EstadoChip estado={comprovativo.estado} />
            <Typography variant="caption" color="text.secondary">
              {formatDate(comprovativo.created_at)}
            </Typography>
          </Stack>
          {comprovativo.estado === "REJEITADO" && comprovativo.observacoes && (
            <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
              Motivo: {comprovativo.observacoes}
            </Typography>
          )}
        </Box>
      </Stack>

      <Button
        size="small"
        startIcon={<DownloadIcon fontSize="small" />}
        onClick={() => onDownload(comprovativo)}
        disabled={downloadingId === comprovativo.id}
      >
        {downloadingId === comprovativo.id ? "A baixar..." : "Baixar"}
      </Button>
    </Paper>
  );
}

// ─── Componente principal (usado no portal do mutuário) ───────────────────────
/**
 * Props:
 *   pedidoId           {string|number}
 *   pedidoStatus       {string}        — só mostra upload se DESEMBOLSADO
 *   getMeusComprovativos  {function}   — da portal_api
 *   enviarComprovativo    {function}   — da portal_api
 *   downloadComprovativo  {function}   — da portal_api
 */
export default function ComprovativoSection({
  pedidoId,
  pedidoStatus,
  getMeusComprovativos,
  enviarComprovativo,
  downloadComprovativo,
}) {
  const [comprovativos, setComprovativos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const inputRef = useRef(null);

  const podeEnviar = pedidoStatus === "DESEMBOLSADO";

  const carregar = async () => {
    try {
      setLoading(true);
      setErro("");
      const data = await getMeusComprovativos(pedidoId);
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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setErro("");
      await enviarComprovativo(pedidoId, file);
      await carregar();
    } catch (err) {
      console.error(err);
      setErro(err?.response?.data?.message || "Erro ao enviar comprovativo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDownload = async (comprovativo) => {
    try {
      setDownloadingId(comprovativo.id);
      await downloadComprovativo(comprovativo.id, comprovativo.nome);
    } catch (err) {
      console.error(err);
      setErro("Erro ao baixar comprovativo.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Box>
      {/* Cabeçalho + botão de upload */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Comprovativos de Pagamento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {podeEnviar
              ? "Envie o comprovativo após efectuar o pagamento."
              : "Os comprovativos ficam disponíveis após o desembolso do crédito."}
          </Typography>
        </Box>

        {podeEnviar && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={handleFileChange}
              disabled={uploading}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={uploading ? <CircularProgress size={14} /> : <UploadIcon />}
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "A enviar..." : "Enviar Comprovativo"}
            </Button>
          </>
        )}
      </Stack>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {loading ? (
        <Stack direction="row" spacing={1} alignItems="center" py={2}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            A carregar comprovativos...
          </Typography>
        </Stack>
      ) : comprovativos.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
          {podeEnviar
            ? "Ainda não enviou nenhum comprovativo para este pedido."
            : "Nenhum comprovativo disponível."}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {comprovativos.map((c) => (
            <ComprovatioItem
              key={c.id}
              comprovativo={c}
              onDownload={handleDownload}
              downloadingId={downloadingId}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}