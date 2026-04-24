import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PortalLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { label: "Dashboard", to: "/portal" },
    { label: "Meu Perfil", to: "/portal/meu-mutuario" },
    { label: "Meus Pedidos", to: "/portal/meus-pedidos" },
    { label: "Criar Pedido", to: "/portal/criar-pedido" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/portal") {
      return location.pathname === "/portal";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          backgroundColor: "#0f172a",
        }}
      >
        <Toolbar
          sx={{
            py: 1.5,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Portal do Mutuário
            </Typography>

            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Acompanhe os seus pedidos e extratos
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ width: { xs: "100%", md: "auto" } }}
          >
            <Button
              component={RouterLink}
              to="/portal/notificacoes"
              variant="outlined"
              color="inherit"
              startIcon={
                <Badge color="error" variant="dot">
                  <span style={{ fontSize: "16px" }}>🔔</span>
                </Badge>
              }
              sx={{
                borderColor: "rgba(255,255,255,0.35)",
                "&:hover": { borderColor: "#fff" },
              }}
            >
              
            </Button>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 36, height: 36 }}>
                {user?.nome ? user.nome.charAt(0).toUpperCase() : "U"}
              </Avatar>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.nome || "Utilizador"}
                </Typography>

                <Chip
                  label={user?.role || "USER"}
                  size="small"
                  sx={{
                    mt: 0.5,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    color: "#fff",
                  }}
                />
              </Box>
            </Stack>

            <Button
              variant="outlined"
              color="inherit"
              onClick={handleLogout}
              sx={{
                borderColor: "rgba(255,255,255,0.35)",
                "&:hover": {
                  borderColor: "#fff",
                },
              }}
            >
              Sair
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            sx={{ py: 2 }}
          >
            {links.map((link) => {
              const active = isActive(link.to);

              return (
                <Button
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  variant={active ? "contained" : "text"}
                  sx={{
                    justifyContent: "flex-start",
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 2,
                    py: 1.2,
                    backgroundColor: active ? "#0f172a" : "transparent",
                    color: active ? "#fff" : "#0f172a",
                    "&:hover": {
                      backgroundColor: active ? "#0f172a" : "#e2e8f0",
                    },
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}