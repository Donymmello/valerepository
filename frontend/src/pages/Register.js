import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  Link,
} from "@mui/material";


function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState("");


  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { nome, email, password });
      navigate('/login');
    } catch (error) {
      console.error('Erro ao registrar', error);
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
          Bem-vindo!
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Preencha os campos para se registrar
        </Typography>

        <Box component="form" onSubmit={handleRegister} sx={{ mt: 2 }}>
          <TextField
            label="Nome"
            fullWidth
            margin="normal"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            variant="outlined"
          />
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
            Criar conta
          </Button>
        </Box>

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Link href="/login" variant="body2">
            Tem conta? Faça login
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;