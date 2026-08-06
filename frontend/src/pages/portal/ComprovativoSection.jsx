import { useRef, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { Upload as UploadIcon } from "@mui/icons-material";

export default function ComprovativoSection({ parcela, onEnviar, disabled = false }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const enviar = async () => {
    if (!file) return setError("Selecione o comprovativo de pagamento.");
    try {
      setLoading(true); setError("");
      await onEnviar(file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err?.response?.data?.message || "Nao foi possivel enviar o comprovativo.");
    } finally { setLoading(false); }
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle1" fontWeight={700}>Enviar comprovativo</Typography>
        <Typography variant="body2" color="text.secondary">
          Parcela {parcela?.numeroParcela}: o pagamento ficara pendente ate validacao pelo backoffice.
        </Typography>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Button component="label" variant="outlined" startIcon={<UploadIcon />} disabled={disabled || loading}>
        {file ? file.name : "Selecionar ficheiro"}
        <input ref={inputRef} hidden type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </Button>
      <Button variant="contained" onClick={enviar} disabled={!file || disabled || loading}>
        {loading ? <CircularProgress size={22} color="inherit" /> : "Enviar para validacao"}
      </Button>
      <Chip label="Estado inicial: PENDENTE" color="warning" size="small" sx={{ alignSelf: "flex-start" }} />
    </Stack>
  );
}
