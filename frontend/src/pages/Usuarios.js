import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { TextField, Button, Container, Typography, Paper } from '@mui/material';


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
        <div>
          <Typography variant="h4" fontWeight="bold">
            Gerenciar Usuários
          </Typography>

          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user._id}>
                    <td>{user.nome}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => atualizarRole(user._id, e.target.value)}
                      >
                        <option value="USER">Usuário</option>
                        <option value="GESTOR">Gestor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={() => excluirUsuario(user._id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Typography>
        </div>
      </Paper>
    </Container>
  );
}
export default Usuarios;