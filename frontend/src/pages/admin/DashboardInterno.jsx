import { Box, Container, Paper, Typography, Button } from "@mui/material";
import { useAuth } from "../../context/AuthContext";

export default function DashboardInterno() {
  const { user, logout } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" mb={1}>
            Backoffice
          </Typography>

          <Typography variant="body1" mb={2}>
            Bem-vindo, {user?.nome}.
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={3}>
            Perfil atual: {user?.role}
          </Typography>

          <Button variant="outlined" onClick={logout}>
            Terminar sessão
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}