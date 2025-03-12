import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Container, Typography, Paper } from '@mui/material';


function Dashboard() {
  const [stats, setStats] = useState(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Erro ao buscar estatísticas', error);
      }
    };
    fetchStats();
  }, [token]);

  if (!stats) return <p>Carregando...</p>;

  return (
    <Container component="main" maxWidth="md">
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
          Dashboard
        </Typography>

        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          <p>Total de Usuários: {stats.totalUsuarios}</p>
          <p>Total de Empréstimos: {stats.totalEmprestimos}</p>
          <p>Empréstimos Aprovados: {stats.emprestimosAprovados}</p>
          <p>Empréstimos Pendentes: {stats.emprestimosPendentes}</p>
          <p>Empréstimos Rejeitados: {stats.emprestimosRejeitados}</p>
        </Typography>
      </Paper>
    </Container>
  );
}
export default Dashboard;