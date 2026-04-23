import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getAllMutuariosRequest } from "../../../api/admin.api";
import { formatDate } from "../../../utils/formatters";

export default function MutuariosList() {
  const [mutuarios, setMutuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const carregarMutuarios = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAllMutuariosRequest();
        setMutuarios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Erro ao carregar mutuários.");
      } finally {
        setLoading(false);
      }
    };

    carregarMutuarios();
  }, []);

  const mutuariosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return mutuarios;

    return mutuarios.filter((mutuario) => {
      const codigo = String(mutuario.codigoMutuario || "").toLowerCase();
      const nome = String(mutuario.nomeCompleto || "").toLowerCase();
      const documento = String(mutuario.documentoNumero || "").toLowerCase();
      const telefone = String(mutuario.telefone || "").toLowerCase();
      const email = String(mutuario.email || "").toLowerCase();
      const nomeUser = String(mutuario.user?.nome || "").toLowerCase();

      return (
        codigo.includes(term) ||
        nome.includes(term) ||
        documento.includes(term) ||
        telefone.includes(term) ||
        email.includes(term) ||
        nomeUser.includes(term)
      );
    });
  }, [mutuarios, search]);

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
            Mutuários
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Consulte e acompanhe os mutuários registados no sistema.
          </Typography>
        </Box>
      </Stack>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          label="Pesquisar por código, nome, documento, telefone, email ou utilizador"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && mutuariosFiltrados.length === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography>Nenhum mutuário encontrado.</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {mutuariosFiltrados.map((mutuario) => (
          <Paper key={mutuario.id} sx={{ p: 3, borderRadius: 3 }}>
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
                    {mutuario.nomeCompleto || "-"}
                  </Typography>

                  {mutuario.user && (
                    <Chip
                      size="small"
                      label={mutuario.user.ativo ? "Utilizador ativo" : "Utilizador inativo"}
                      color={mutuario.user.ativo ? "success" : "default"}
                    />
                  )}
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  <strong>Código:</strong> {mutuario.codigoMutuario || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Documento:</strong> {mutuario.documentoNumero || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Telefone:</strong> {mutuario.telefone || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong> {mutuario.email || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Utilizador associado:</strong> {mutuario.user?.nome || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Data de registo:</strong> {formatDate(mutuario.createdAt)}
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Button
                  component={RouterLink}
                  to={`/interno/mutuarios/${mutuario.id}`}
                  variant="outlined"
                >
                  Ver Detalhe
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}