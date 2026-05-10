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
import NotificationsIcon from "@mui/icons-material/Notifications";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function BackofficeLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { label: "Dashboard", to: "/interno" },
    { label: "Pedidos", to: "/interno/pedidos" },
    { label: "Mutuários", to: "/interno/mutuarios" },
    { label: "Aprovações", to: "/interno/aprovacoes" },
    { label: "Desembolsos", to: "/interno/desembolsos" },
    { label: "Reembolsos", to: "/interno/reembolsos" },
    { label: "Relatórios", to: "/interno/relatorios" },
    { label: "Alertas de Prazo", to: "/interno/alertas-prazo" },
  
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/interno") {
      return location.pathname === "/interno";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <AppBar
        position="sticky"
        elevation={1}
        sx={{ backgroundColor: "#111827" }}
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
              Backoffice
            </Typography>

            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Gestão interna do sistema de crédito
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Button
              component={RouterLink}
              to="/interno/notificacoes"
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
                  label={user?.role || "-"}
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
                "&:hover": { borderColor: "#fff" },
              }}
            >
              Sair
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
        <Container maxWidth="xl">
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
                    backgroundColor: active ? "#111827" : "transparent",
                    color: active ? "#fff" : "#111827",
                    "&:hover": {
                      backgroundColor: active ? "#111827" : "#e5e7eb",
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

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}