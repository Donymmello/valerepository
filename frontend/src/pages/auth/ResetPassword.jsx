import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { resetPasswordRequest } from "../../api/auth.api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [concluido, setConcluido] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmar) {
      setError("As passwords não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A password deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!token) {
      setError("Link de recuperação inválido ou expirado.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await resetPasswordRequest({ token, password });
      setMessage(data.message);
      setConcluido(true);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao redefinir password.");
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
                Nova Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Defina uma nova password para a sua conta.
              </Typography>
            </Box>

            {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {!token && !concluido && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Link de recuperação inválido ou expirado. Solicite um novo.
              </Alert>
            )}

            {!concluido ? (
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Nova Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={!token}
                  />
                  <TextField
                    fullWidth
                    label="Confirmar Password"
                    type="password"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    required
                    disabled={!token}
                  />
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ mt: 3, borderRadius: 2, py: 1.5, fontWeight: "bold" }}
                  disabled={submitting || !token}
                >
                  {submitting ? "A guardar..." : "Alterar Password"}
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                fullWidth
                size="large"
                sx={{ borderRadius: 2, py: 1.5 }}
                onClick={() => navigate("/login")}
              >
                Ir para o Login
              </Button>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" align="center" color="text.secondary">
              Precisa de ajuda?{" "}
              <span
                style={{ color: "#1a237e", fontWeight: 600, cursor: "pointer" }}
                onClick={() => navigate("/forgot-password")}
              >
                Solicitar novo link
              </span>
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
