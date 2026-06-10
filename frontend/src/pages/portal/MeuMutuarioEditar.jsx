import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  getMeuMutuarioRequest,
  updateMeuMutuarioRequest,
} from "../../api/portal.api";

export default function MeuMutuarioEditar() {
  const navigate = useNavigate();

  const [mutuario, setMutuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  const [form, setForm] = useState({
    nomeCompleto: "",
    telefone: "",
    provincia: "",
    distrito: "",
    localResidencia: "",
    email: "",
  });

  useEffect(() => {
    const fetchMeuMutuario = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMeuMutuarioRequest();
        setMutuario(data);

        setForm({
          nomeCompleto: data?.nomeCompleto || "",
          telefone: data?.telefone || "",
          provincia: data?.provincia || "",
          distrito: data?.distrito || "",
          localResidencia: data?.localResidencia || "",
          email: data?.email || "",
        });
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Erro ao carregar perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchMeuMutuario();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGuardar = async () => {
    if (!form.nomeCompleto.trim()) {
      setError("O nome completo é obrigatório.");
      return;
    }

    if (!form.email.trim()) {
      setError("O email é obrigatório.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await updateMeuMutuarioRequest({
        nomeCompleto: form.nomeCompleto.trim(),
        telefone: form.telefone || null,
        provincia: form.provincia || null,
        distrito: form.distrito || null,
        localResidencia: form.localResidencia || null,
        email: form.email || null,
      });

      setSuccessOpen(true);
      setTimeout(() => {
        navigate("/portal/meu-mutuario");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = () => {
    navigate("/portal/meu-mutuario");
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
            Editar Perfil
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Atualize seus dados pessoais.
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {mutuario && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={2.5} mb={3}>
            <TextField
              fullWidth
              label="Nome Completo"
              name="nomeCompleto"
              value={form.nomeCompleto}
              onChange={handleChange}
              placeholder="Digite seu nome completo"
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Digite seu email"
            />

            <TextField
              fullWidth
              label="Telefone"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              placeholder="Digite seu telefone"
            />

            <TextField
              fullWidth
              label="Província"
              name="provincia"
              value={form.provincia}
              onChange={handleChange}
              placeholder="Digite sua província"
            />

            <TextField
              fullWidth
              label="Distrito"
              name="distrito"
              value={form.distrito}
              onChange={handleChange}
              placeholder="Digite seu distrito"
            />

            <TextField
              fullWidth
              label="Local de Residência"
              name="localResidencia"
              value={form.localResidencia}
              onChange={handleChange}
              placeholder="Digite seu local de residência"
            />
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="flex-end"
          >
            <Button
              variant="outlined"
              onClick={handleCancelar}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              variant="contained"
              onClick={handleGuardar}
              disabled={saving}
            >
              {saving ? "A guardar..." : "Guardar Alterações"}
            </Button>
          </Stack>
        </Paper>
      )}

      <Snackbar
        open={successOpen}
        autoHideDuration={1500}
        onClose={() => setSuccessOpen(false)}
        message="Perfil atualizado com sucesso!"
      />
    </Box>
  );
}
