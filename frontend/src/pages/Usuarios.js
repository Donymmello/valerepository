import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, Button } from '@mui/material';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await api.get('/usuarios', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsuarios(response.data);
      } catch (error) {
        console.error('Erro ao buscar usuários', error);
      }
    };
    fetchUsuarios();
  }, [token]);

  const atualizarRole = async (id, novaRole) => {
    try {
      await api.put(`/usuarios/${id}`, { role: novaRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(prevUsuarios => prevUsuarios.map(user => user._id === id ? { ...user, role: novaRole } : user));
    } catch (error) {
      console.error('Erro ao atualizar usuário', error);
    }
  };

  const excluirUsuario = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(prevUsuarios => prevUsuarios.filter(user => user._id !== id));
    } catch (error) {
      console.error('Erro ao excluir usuário', error);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={6} sx={{ padding: '30px', marginTop: '80px', borderRadius: '10px', textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Gerenciar Usuários
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nome</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.nome}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onChange={(e) => atualizarRole(user._id, e.target.value)}
                      fullWidth
                    >
                      <MenuItem value="USER">Usuário</MenuItem>
                      <MenuItem value="GESTOR">Gestor</MenuItem>
                      <MenuItem value="ADMIN">Admin</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="contained" color="error" onClick={() => excluirUsuario(user._id)}>
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default Usuarios;
