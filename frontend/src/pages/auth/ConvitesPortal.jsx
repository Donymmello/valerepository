import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ContentCopy as ContentCopyIcon } from "@mui/icons-material";
import { createConvitePortalRequest } from "../../api/auth.api";
import { formatDate } from "../../utils/formatters";

// Página interna (backoffice) — gera convites de registo para mutuários (controlo de KYC)
export default function ConvitesPortal() {
  const [validadeDias, setValidadeDias] = useState(7);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [convite, setConvite] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const handleGerar = async (event) => {
    event.preventDefault();
    setError("");
    setCopiado(false);
    setSubmitting(true);

    try {
      const data = await createConvitePortalRequest({ validadeDias: Number(validadeDias) });
      setConvite(data);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao gerar convite.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopiar = async () => {
    if (!convite?.link) return;
    try {
      await navigator.clipboard.writeText(convite.link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar link:", err);
    }
  };

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} mb={0.5}>
          Convites de Registo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gera um link de registo para um novo mutuário. Sem este link, ninguém
          consegue criar conta no portal (controlo de KYC) — o registo público
          aberto está desativado.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, border: "1px solid #e0e0e0" }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleGerar}>
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Validade (dias)"
                name="validadeDias"
                type="number"
                inputProps={{ min: 1, max: 90 }}
                value={validadeDias}
                onChange={(e) => setValidadeDias(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                sx={{ borderRadius: 2, fontWeight: "bold" }}
                disabled={submitting}
              >
                {submitting ? "A gerar..." : "Gerar Convite"}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {convite && (
          <>
            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Link de registo gerado
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <TextField
                fullWidth
                size="small"
                value={convite.link}
                InputProps={{ readOnly: true }}
              />
              <Tooltip title={copiado ? "Copiado!" : "Copiar link"}>
                <IconButton onClick={handleCopiar} color={copiado ? "success" : "default"}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Typography variant="caption" color="text.secondary">
              Válido até {formatDate(convite.expiresAt)} · uso único.
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}
