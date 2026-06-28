import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Notifications as NotificationsIcon } from "@mui/icons-material";
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
    { label: "Simulações", to: "/simulacao/minhas" },
    { label: "Meus Créditos", to: "/portal/meus-creditos" },
    { label: "Notificações", to: "/portal/notificacoes" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/portal") return location.pathname === "/portal";
    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <AppBar position="sticky" elevation={1} sx={{ backgroundColor: "#0f172a" }}>
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
          {/* Logo — clicável, vai para landing */}
          <Stack
            spacing={0.5}
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Portal do Mutuário
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Acompanhe os seus pedidos e extratos
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ width: { xs: "100%", md: "auto" } }}
          >
            {/* Notificações com ícone MUI real */}
            <Tooltip title="Notificações">
              <IconButton
                component={RouterLink}
                to="/portal/notificacoes"
                color="inherit"
              >
                <Badge color="error" variant="dot">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Avatar + info do user */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{ width: 36, height: 36, bgcolor: "#3b82f6", fontWeight: 700 }}
              >
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
                    fontSize: "0.65rem",
                  }}
                />
              </Box>
            </Stack>

            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={handleLogout}
              sx={{
                borderColor: "rgba(255,255,255,0.35)",
                "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" },
              }}
            >
              Sair
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Barra de navegação */}
      <Box sx={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#fff" }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={0.5}
            sx={{ py: 1.5, overflowX: "auto" }}
          >
            {links.map((link) => {
              const active = isActive(link.to);
              return (
                <Button
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  variant={active ? "contained" : "text"}
                  size="small"
                  sx={{
                    whiteSpace: "nowrap",
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 2,
                    py: 1,
                    backgroundColor: active ? "#0f172a" : "transparent",
                    color: active ? "#fff" : "#374151",
                    "&:hover": {
                      backgroundColor: active ? "#0f172a" : "#f1f5f9",
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