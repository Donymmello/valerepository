import { useEffect, useState } from "react";
import { Link as RouterLink} from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { getMeuMutuarioRequest } from "../../api/portal.api";

export default function MeuMutuario() {
  const [mutuario, setMutuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMeuMutuario = async () => {
      try {
        const data = await getMeuMutuarioRequest();
        setMutuario(data);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Erro ao carregar dados do mutuário.");
      } finally {
        setLoading(false);
      }
    };

    fetchMeuMutuario();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const perfilIncompleto =
    mutuario && (!mutuario.documentoTipo || !mutuario.documentoNumero || !mutuario.nuit || !mutuario.dataNascimento);

  return (
    <Box>
      <Typography variant="h4" mb={1}>
        Meu Perfil de Mutuário
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Consulte os seus dados pessoais e de registo no sistema.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {perfilIncompleto && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button component={RouterLink} to="/portal/editar-perfil" color="inherit" size="small">
              Completar
            </Button>
          }
        >
          O teu perfil está incompleto. Documento, NUIT e data de nascimento são necessários antes de
          poderes submeter um pedido de crédito.
        </Alert>
      )}

      {mutuario && (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography><strong>Código:</strong> {mutuario.codigoMutuario || "-"}</Typography>
            <Typography><strong>Nome Completo:</strong> {mutuario.nomeCompleto || "-"}</Typography>
            <Typography><strong>Documento Tipo:</strong> {mutuario.documentoTipo || "-"}</Typography>
            <Typography><strong>Documento Número:</strong> {mutuario.documentoNumero || "-"}</Typography>
            <Typography><strong>NUIT:</strong> {mutuario.nuit || "-"}</Typography>
            <Typography><strong>Data de Nascimento:</strong> {mutuario.dataNascimento || "-"}</Typography>
            <Typography><strong>Telefone:</strong> {mutuario.telefone || "-"}</Typography>
            <Typography><strong>Província:</strong> {mutuario.provincia || "-"}</Typography>
            <Typography><strong>Distrito:</strong> {mutuario.distrito || "-"}</Typography>
            <Typography><strong>Residência:</strong> {mutuario.localResidencia || "-"}</Typography>
            <Typography><strong>Email:</strong> {mutuario.email || "-"}</Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Button
              component={RouterLink}
              to="/portal/editar-perfil"
              variant="contained"
            >
              Editar Perfil
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}