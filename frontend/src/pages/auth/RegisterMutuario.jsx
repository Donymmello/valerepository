import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  AppBar,
  Toolbar,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { registerMutuarioWithOTPRequest } from "../../api/auth.api";

export default function RegisterMutuario() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    nomeCompleto: "",
    documentoTipo: "",
    documentoNumero: "",
    nuuit: "",
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
      await registerMutuarioWithOTPRequest(form);
      navigate("/verify-otp", { state: { email: form.email } });
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao registar mutuário.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f4f6f8" }}>

      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: "1px solid #e0e0e0", bgcolor: "#fff" }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: "space-between", px: "0 !important" }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#1a237e", cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
              Sistema de Gestão de Crédito
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button color="inherit" onClick={() => navigate("/")}>
                Início
              </Button>
              <Button variant="outlined" color="primary" sx={{ borderRadius: 2 }} onClick={() => navigate("/login")}>
                Entrar
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Conteúdo */}
      <Box sx={{ flex: 1, py: 6 }}>
        <Container maxWidth="md">
          <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, border: "1px solid #e0e0e0" }}>

            <Box mb={4}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a237e" }} mb={0.5}>
                Criar Conta
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Preencha os seus dados para solicitar crédito. Receberá um código de verificação por email.
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>

              {/* Secção: Dados de acesso */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Dados de Acesso
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Nome de utilizador" name="nome" value={form.nome} onChange={handleChange} required />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
                </Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              {/* Secção: Dados pessoais */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Dados Pessoais
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Nome completo" name="nomeCompleto" value={form.nomeCompleto} onChange={handleChange} required />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Data de nascimento" name="dataNascimento" type="date" InputLabelProps={{ shrink: true }} value={form.dataNascimento} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth label="Tipo de documento" name="documentoTipo" value={form.documentoTipo} onChange={handleChange} required>
                    <MenuItem value="B.I">Bilhete de Identidade</MenuItem>
                    <MenuItem value="PASSAPORTE">Passaporte</MenuItem>
                    <MenuItem value="CARTA">Carta de Condução</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Número do documento" name="documentoNumero" value={form.documentoNumero} onChange={handleChange} required />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="NUIT" name="nuit" value={form.nuit} onChange={handleChange} required />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Telefone" name="telefone" value={form.telefone} onChange={handleChange} />
                </Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              {/* Secção: Localização */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Localização
              </Typography>
              <Grid container spacing={2} mb={4}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Província" name="provincia" value={form.provincia} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Distrito" name="distrito" value={form.distrito} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Local de residência" name="localResidencia" value={form.localResidencia} onChange={handleChange} />
                </Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Button variant="text" onClick={() => navigate("/login")} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" size="large" sx={{ borderRadius: 2, px: 4, fontWeight: "bold" }} disabled={submitting}>
                  {submitting ? "A registar..." : "Continuar"}
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" align="center" color="text.secondary">
              Já tem conta?{" "}
              <Link component={RouterLink} to="/login" sx={{ fontWeight: 600 }}>
                Entrar
              </Link>
            </Typography>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: "#1a237e", color: "#ffffff", py: 3 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" align="center">
            &copy; {new Date().getFullYear()} Sistema de Gestão de Crédito. Todos os direitos reservados. Desenvolvido por Sidonio Aly.
          </Typography>
        </Container>
      </Box>

    </Box>
  );
}
