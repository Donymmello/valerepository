import React, { useState, useContext } from 'react';
import { TextField, Button, Container, Typography, Paper, Alert } from '@mui/material';
import api from '../services/api';
import { AuthContext } from "../context/AuthContext";


const EmprestimoForm = () => {
    const [valor, setValor] = useState("");
    const [motivo, setMotivo] = useState("");
    const [mensagem, setMensagem] = useState("");
    const { token } = useContext(AuthContext);


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          if (!valor || !motivo) {
            setMensagem("Todos os campos são obrigatórios.");
            return;
          }
    
          await api.post("/emprestimos", { valor, motivo }, {
            headers: { Authorization: `Bearer ${token}` },
          });
    
          setMensagem("Empréstimo solicitado com sucesso!");
          setValor("");
          setMotivo("");
        } catch (error) {
          console.error("Erro ao solicitar empréstimo:", error);
          setMensagem("Erro ao solicitar empréstimo.");
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
                <Typography variant="h4" gutterBottom>Solicitar Empréstimo</Typography>
            {mensagem && <Alert severity="info">{mensagem}</Alert>}
            <form onSubmit={handleSubmit}>
                <TextField
                    label="Valor"
                    type="number"
                    fullWidth
                    required
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    margin="normal"
                />
                <TextField
                    label="Motivo"
                    fullWidth
                    required
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    margin="normal"
                />
                <Button type="submit" variant="contained" color="primary" fullWidth>
                    Solicitar
                </Button>
            </form>
            </Paper>
        </Container>
    );
}

export default EmprestimoForm;
