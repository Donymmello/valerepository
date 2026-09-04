import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
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
    documentoTipo: "",
    documentoNumero: "",
    nuit: "",
    dataNascimento: "",
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
          documentoTipo: data?.documentoTipo || "",
          documentoNumero: data?.documentoNumero || "",
          nuit: data?.nuit || "",
          dataNascimento: data?.dataNascimento || "",
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

  // Uma vez que o backend só grava documento/NUIT/data de nascimento
  // enquanto estiverem vazios, aqui bloqueamos os campos assim que já
  // vierem preenchidos do servidor, evita a falsa sensação de que dá
  // para editar um documento já declarado.
  const perfilKycCompleto = Boolean(
    mutuario?.documentoTipo && mutuario?.documentoNumero && mutuario?.nuit && mutuario?.dataNascimento
  );

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

    // Os campos de identificação só podem ser definidos uma vez (ver
    // backend). Se ainda estão editáveis (perfil incompleto) e o
    // utilizador começou a preencher, exige os quatro juntos, evita
    // gravar um documento sem NUIT, por exemplo.
    if (!perfilKycCompleto) {
      const algumPreenchido =
        form.documentoTipo || form.documentoNumero || form.nuit || form.dataNascimento;
      const todosPreenchidos =
        form.documentoTipo && form.documentoNumero && form.nuit && form.dataNascimento;

      if (algumPreenchido && !todosPreenchidos) {
        setError("Para completar o perfil, preenche tipo de documento, número, NUIT e data de nascimento todos juntos.");
        return;
      }
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
        documentoTipo: form.documentoTipo || null,
        documentoNumero: form.documentoNumero || null,
        nuit: form.nuit || null,
        dataNascimento: form.dataNascimento || null,
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

          <Divider sx={{ mb: 3 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mb: 1 }}>
            Identificação (necessária para pedir crédito)
          </Typography>

          {perfilKycCompleto ? (
            <Alert severity="success" sx={{ mb: 2.5 }}>
              Identificação já registada. Para alterar o documento ou o NUIT, contacta a tua instituição.
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 2.5 }}>
              Preenche estes dados para poderes submeter um pedido de crédito. Uma vez guardados, só o
              backoffice consegue alterá-los.
            </Alert>
          )}

          <Grid container spacing={2.5} mb={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Tipo de Documento"
                name="documentoTipo"
                value={form.documentoTipo}
                onChange={handleChange}
                disabled={perfilKycCompleto}
              >
                <MenuItem value="B.I">Bilhete de Identidade</MenuItem>
                <MenuItem value="PASSAPORTE">Passaporte</MenuItem>
                <MenuItem value="CARTA">Carta de Condução</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número do Documento"
                name="documentoNumero"
                value={form.documentoNumero}
                onChange={handleChange}
                disabled={perfilKycCompleto}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="NUIT"
                name="nuit"
                value={form.nuit}
                onChange={handleChange}
                disabled={perfilKycCompleto}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Nascimento"
                name="dataNascimento"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.dataNascimento}
                onChange={handleChange}
                disabled={perfilKycCompleto}
              />
            </Grid>
          </Grid>

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
