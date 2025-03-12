import React, { useState } from 'react';
import api from '../services/api';
import { TextField, Button, Container, Typography, Paper, Box } from '@mui/material';


function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleRecuperacao = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/recuperar-senha', { email });
      setMensagem('Se o email existir, um link de recuperação foi enviado.');
    } catch (error) {
      setMensagem('Erro ao enviar solicitação. Tente novamente.');
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
        <Typography variant="h6" fontWeight="bold">
          Recuperação de Senha
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Preencha o campo para recuperar a sua senha
        </Typography>

        <Box component="form" onSubmit={handleRecuperacao} sx={{ mt: 2 }}>
          <TextField
            type="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, padding: "12px", fontWeight: "bold" }}
          >
            Recuperar Senha
          </Button>
        </Box>
        {mensagem && <p>{mensagem}</p>}
        
      </Paper>
    </Container>
  );
}
export default RecuperarSenha;