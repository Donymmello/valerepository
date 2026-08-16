import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";

// Página interna (backoffice) — sem header/footer público
export default function RegisterUser() {
  const navigate = useNavigate();
  const { registerUser } = useAuth();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    role: "",
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
      await registerUser(form);
      const role = form?.role?.toUpperCase();
      if (role === "MUTUARIO" || role === "USER") {
        navigate("/portal");
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao registar utilizador.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", py: 4 }}>
      <PageHeader
        title="Registar Utilizador"
        subtitle="Cria uma nova conta de acesso ao sistema interno."
        mb={4}
      />

      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, border: "1px solid #e0e0e0" }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome de utilizador"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
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
                required
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
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Perfil"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <MenuItem value="ADMIN">Administrador</MenuItem>
                <MenuItem value="ANALISTA">Analista</MenuItem>
                <MenuItem value="DIRETOR">Diretor</MenuItem>
                <MenuItem value="GESTOR">Gestor</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="text" onClick={() => navigate(-1)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ borderRadius: 2, px: 4, fontWeight: "bold" }}
              disabled={submitting}
            >
              {submitting ? "A registar..." : "Registar"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
