import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  AppBar,
  Toolbar,
  Box,
  Button,
  Container,
  Link,
  Paper,
  TextField,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
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
      const data = await login(form);

      if (data.user.role === "MUTUARIO" || data.user.role === "USER") {
        navigate("/portal");
      } else {
        navigate("/interno");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao fazer login.");
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
              component="div"
              sx={{ fontWeight: "bold", color: "#1a237e", cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
              Sistema de Gestão de Crédito
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button color="inherit" onClick={() => navigate("/")}>
                Início
              </Button>

              <Button
                variant="outlined"
                color="primary"
                sx={{ borderRadius: 2 }}
                onClick={() => navigate("/register-mutuario")}
              >
                Criar Conta
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Conteúdo principal — centrado verticalmente */}
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, border: "1px solid #e0e0e0" }}>

            {/* Logo / título */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a237e" }}>
                Bem-vindo de volta
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Entre na sua conta para continuar.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
              </Stack>

              <Box sx={{ textAlign: "right", mt: 1 }}>
                <Link component={RouterLink} to="/forgot-password" variant="body2">
                  Esqueci a password
                </Link>
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{ mt: 3, borderRadius: 2, py: 1.5, fontWeight: "bold" }}
                disabled={submitting}
              >
                {submitting ? "A entrar..." : "Entrar"}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" align="center" color="text.secondary">
              Ainda não tem conta?{" "}
              <Link component={RouterLink} to="/register-mutuario" sx={{ fontWeight: 600 }}>
                Registe-se como mutuário
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
