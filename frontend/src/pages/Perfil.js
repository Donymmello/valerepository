import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Container, Paper, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Perfil = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) return <p>Carregando...</p>;

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={6} sx={{ padding: '30px', marginTop: '80px', borderRadius: '10px', textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold">Perfil do Usuário</Typography>
        <img
          src={user.foto || "https://via.placeholder.com/150"}
          alt="User"
          style={{ width: "100px", borderRadius: "50%", margin: "20px auto" }}
        />
        <Typography variant="h6">{user.nome}</Typography>
        <Typography variant="body1" color="textSecondary">{user.email}</Typography>
        <Typography variant="body2" sx={{ marginTop: "10px" }}>Cargo: {user.role}</Typography>

        <Button
          variant="contained"
          color="primary"
          sx={{ marginTop: "20px" }}
          onClick={() => navigate("/alterar-senha")}
        >
          Alterar Senha
        </Button>
      </Paper>
    </Container>
  );
};

export default Perfil;
