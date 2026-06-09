import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  TextField,
  Typography,
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
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Paper elevation={4} sx={{ p: 4, width: "100%" }}>
          <Typography variant="h4" mb={1}>
            Entrar
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={3}>
            Faça login para acessar o sistema.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              margin="normal"
              value={form.email}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              margin="normal"
              value={form.password}
              onChange={handleChange}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ mt: 3 }}
              disabled={submitting}
            >
              {submitting ? "A entrar..." : "Entrar"}
            </Button>
          </Box>

          <Link
            component={RouterLink}
            to="/forgot-password"
          >
            Esqueci a senha
          </Link>

          <Box mt={3}>
            <Typography variant="body2">
              Ainda não tem conta?{" "}
              <Link component={RouterLink} to="/register-mutuario">
                Registe-se como mutuário
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}