import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Link,
  Paper,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

export default function RegisterMutuario() {
  const navigate = useNavigate();
  const { registerMutuario } = useAuth();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    nomeCompleto: "",
    documentoTipo: "",
    documentoNumero: "",
    dataNascimento: "",
    provincia: "",
    distrito: "",
    localResidencia: "",
    telefone: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await registerMutuario(form);
      navigate("/portal");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao registar mutuário.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          py: 5,
        }}
      >
        <Paper elevation={4} sx={{ p: 4 }}>
          <Typography variant="h4" mb={1}>
            Registo de Mutuário
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={3}>
            Crie a sua conta para acompanhar os seus pedidos de crédito.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do utilizador"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome completo"
                  name="nomeCompleto"
                  value={form.nomeCompleto}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de documento"
                  name="documentoTipo"
                  value={form.documentoTipo}
                  onChange={handleChange}
                >
                  {/* 2. Opções que vão aparecer para o usuário clicar */}
                  <MenuItem value="B.I">Bilhete de Identidade</MenuItem>
                  <MenuItem value="PASSAPORTE">Passaporte</MenuItem>
                  <MenuItem value="CARTA">Carta de Condução</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Número do documento"
                  name="documentoNumero"
                  value={form.documentoNumero}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data de nascimento"
                  name="dataNascimento"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.dataNascimento}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Província"
                  name="provincia"
                  value={form.provincia}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Distrito"
                  name="distrito"
                  value={form.distrito}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Local de residência"
                  name="localResidencia"
                  value={form.localResidencia}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 3 }}
              disabled={submitting}
            >
              {submitting ? "A registar..." : "Registar"}
            </Button>
          </Box>

          <Box mt={3}>
            <Typography variant="body2">
              Já tem conta?{" "}
              <Link component={RouterLink} to="/login">
                Entrar
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}