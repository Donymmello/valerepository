import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  Link,
} from "@mui/material";
import api from "../services/api";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", { email, password });
      login(response.data.token, response.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError("Email ou senha inválidos");
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={6}
        sx={{
          padding: "30px",
          marginTop: "80px",
          borderRadius: "10px",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Bem-vindo de volta!
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Faça login para continuar
        </Typography>

        {error && <Typography color="error">{error}</Typography>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
          />
          <TextField
            label="Senha"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, padding: "12px", fontWeight: "bold" }}
          >
            Entrar
          </Button>
        </Box>

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Link component={RouterLink} to="/register" variant="body2">
            Criar conta
          </Link>
          <Link component={RouterLink} to="/recuperar-senha" variant="body2">
            Esqueceu a senha?
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
