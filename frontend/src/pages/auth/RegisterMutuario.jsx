import { useState } from "react";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
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
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { registerMutuarioWithOTPRequest } from "../../api/auth.api";

export default function RegisterMutuario() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conviteToken = searchParams.get("convite");

  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    nomeCompleto: "",
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
      await registerMutuarioWithOTPRequest({ ...form, token: conviteToken });
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

            {!conviteToken ? (
              <>
                <Box mb={3}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a237e" }} mb={0.5}>
                    Criar Conta
                  </Typography>
                </Box>
                <Alert severity="warning">
                  Este registo requer um convite válido. Peça ao administrador da sua
                  instituição de crédito o link de registo e aceda através dele.
                </Alert>
                <Button
                  variant="outlined"
                  sx={{ mt: 3 }}
                  onClick={() => navigate("/login")}
                >
                  Voltar ao Login
                </Button>
              </>
            ) : (
            <>
            <Box mb={4}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a237e" }} mb={0.5}>
                Criar Conta
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registo rápido — só o essencial. Receberá um código de verificação por email, e completa o
                resto do perfil (documento, NUIT, morada) depois, dentro do portal.
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
                  <TextField fullWidth label="Telefone" name="telefone" value={form.telefone} onChange={handleChange} required />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mb: 3 }}>
                Documento de identificação, NUIT, data de nascimento e morada ficam para completar depois,
                no portal — precisas deles só quando for submeter o teu primeiro pedido de crédito.
              </Alert>

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
            </>
            )}
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
