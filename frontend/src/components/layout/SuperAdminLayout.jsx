import {
  AppBar,
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

export default function SuperAdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { label: "Empresas", to: "/superadmin/empresas" },
    { label: "Pedidos de Acesso", to: "/superadmin/solicitacoes-acesso" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <AppBar position="sticky" elevation={1} sx={{ backgroundColor: "#111827" }}>
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
          <Stack spacing={0.5} sx={{ cursor: "pointer" }} onClick={() => navigate("/superadmin/empresas")}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Plataforma
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Gestão de empresas e subscrições
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Chip
              label={user?.nome || "SUPERADMIN"}
              size="small"
              sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}
            />

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

      <Box sx={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
        <Container maxWidth="xl">
          <Stack direction={{ xs: "column", md: "row" }} spacing={0.5} sx={{ py: 1.5, overflowX: "auto" }}>
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
                    backgroundColor: active ? "#111827" : "transparent",
                    color: active ? "#fff" : "#374151",
                    "&:hover": { backgroundColor: active ? "#111827" : "#f3f4f6" },
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
