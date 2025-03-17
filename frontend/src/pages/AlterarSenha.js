import React, { useState } from "react";
import { Container, Paper, Typography, TextField, Button } from "@mui/material";

const AlterarSenha = () => {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Alteração de senha enviada:", { senhaAtual, novaSenha });
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={6} sx={{ padding: "30px", marginTop: "50px", textAlign: "center" }}>
        <Typography variant="h4" fontWeight="bold">Alterar Senha</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Senha Atual"
            type="password"
            fullWidth
            margin="normal"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
          />
          <TextField
            label="Nova Senha"
            type="password"
            fullWidth
            margin="normal"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
          <Button type="submit" variant="contained" color="primary" sx={{ marginTop: "20px" }}>
            Atualizar Senha
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default AlterarSenha;
