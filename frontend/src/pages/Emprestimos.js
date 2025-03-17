// frontend/src/pages/Emprestimos.js
import React, { useEffect, useState, useContext } from 'react';
import {
  Container, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Button
} from '@mui/material';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

function Emprestimos() {
  const [emprestimos, setEmprestimos] = useState([]);
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    const fetchEmprestimos = async () => {
        try {
            const token = localStorage.getItem('token');  // Obtendo token
            if (!token) {
                console.error("Erro: Token não encontrado. Faça login novamente.");
                return;
            }

            const response = await api.get("/emprestimos", {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Empréstimos recebidos:", response.data); // Debug
            setEmprestimos(response.data);
        } catch (error) {
            console.error("Erro ao buscar empréstimos:", error);
        }
    };

    fetchEmprestimos();
}, []);


  const atualizarEmprestimo = async (id, acao) => {
    try {
      if (!token) {
        console.error("Erro: Token não encontrado.");
        return;
      }

      const response = await api.put(`/emprestimos/${id}/${acao}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEmprestimos(prevEmprestimos =>
        prevEmprestimos.map(emp =>
          emp._id === id
            ? { ...emp, aprovado: acao === "aprovar", rejeitado: acao === "rejeitar" }
            : emp
        )
      );

      console.log(`Empréstimo ${acao}:`, response.data);
    } catch (error) {
      console.error(`Erro ao ${acao} empréstimo:`, error);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={6} sx={{ padding: "30px", marginTop: "80px", borderRadius: "10px", textAlign: "center" }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
          Empréstimos
        </Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell><Typography variant="body1" fontWeight="bold">Valor</Typography></TableCell>
              <TableCell><Typography variant="body1" fontWeight="bold">Status</Typography></TableCell>
              <TableCell><Typography variant="body1" fontWeight="bold">Ações</Typography></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {emprestimos.map(emp => (
              <TableRow key={emp._id}>
                <TableCell>{emp.valor}</TableCell>
                <TableCell>
                  {emp.aprovado ? <span style={{ color: "green" }}>Aprovado</span> : emp.rejeitado ? <span style={{ color: "red" }}>Rejeitado</span> : "Pendente"}
                </TableCell>
                <TableCell>
                {(user.role === 'ADMIN' || user.role === 'GESTOR') && !emp.aprovado && !emp.rejeitado && (
                    <>
                      <Button
                        onClick={() => atualizarEmprestimo(emp._id, "aprovar")}
                        variant="contained"
                        color="success"
                        sx={{ mr: 1 }}
                      >
                        Aprovar
                      </Button>
                      <Button
                        onClick={() => atualizarEmprestimo(emp._id, "rejeitar")}
                        variant="contained"
                        color="error"
                      >
                        Rejeitar
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}

export default Emprestimos;
