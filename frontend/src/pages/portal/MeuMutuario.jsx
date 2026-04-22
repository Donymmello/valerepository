import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  Paper,
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
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" mb={3}>
          Meu Perfil de Mutuário
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        {mutuario && (
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography><strong>Código:</strong> {mutuario.codigoMutuario || "-"}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography><strong>Nome Completo:</strong> {mutuario.nomeCompleto || "-"}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography><strong>Documento Tipo:</strong> {mutuario.documentoTipo || "-"}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography><strong>Documento Número:</strong> {mutuario.documentoNumero || "-"}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography><strong>Data de Nascimento:</strong> {mutuario.dataNascimento || "-"}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography><strong>Telefone:</strong> {mutuario.telefone || "-"}</Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography><strong>Província:</strong> {mutuario.provincia || "-"}</Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography><strong>Distrito:</strong> {mutuario.distrito || "-"}</Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography><strong>Residência:</strong> {mutuario.localResidencia || "-"}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography><strong>Email:</strong> {mutuario.email || "-"}</Typography>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
    </Container>
  );
}