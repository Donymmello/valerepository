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
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { forgotPasswordRequest } from "../../api/auth.api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const data = await forgotPasswordRequest(email);
      setMessage(data.message);
      setEnviado(true);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao enviar email de recuperação.");
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
            <Button variant="outlined" color="primary" sx={{ borderRadius: 2 }} onClick={() => navigate("/login")}>
              Entrar
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Conteúdo */}
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, border: "1px solid #e0e0e0" }}>

            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a237e" }} mb={0.5}>
                Recuperar Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Introduza o seu email e enviaremos um link para redefinir a sua password.
              </Typography>
            </Box>

            {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {!enviado ? (
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ borderRadius: 2, py: 1.5, fontWeight: "bold" }}
                  disabled={submitting}
                >
                  {submitting ? "A enviar..." : "Enviar Link"}
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                size="large"
                sx={{ borderRadius: 2 }}
                onClick={() => navigate("/login")}
              >
                Voltar ao Login
              </Button>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" align="center" color="text.secondary">
              Lembrou-se da password?{" "}
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
