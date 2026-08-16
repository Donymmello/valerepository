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

const DEFAULT_LINKS = [
  { label: "Dashboard", to: "/interno" },
  { label: "Pedidos", to: "/interno/pedidos" },
  { label: "Mutuários", to: "/interno/mutuarios" },
  { label: "Aprovações", to: "/interno/aprovacoes" },
  { label: "Desembolsos", to: "/interno/desembolsos" },
  { label: "Reembolsos", to: "/interno/reembolsos" },
  { label: "Relatórios", to: "/interno/relatorios" },
  { label: "Alertas de Prazo", to: "/interno/alertas-prazo" },
];

// variant="minimal" (usado pelo painel SUPERADMIN): mesma casca de
// layout (AppBar + barra de navegação), sem notificações/avatar — só
// um chip com o nome do utilizador.
export default function BackofficeLayout({
  children,
  links,
  title = "Backoffice",
  subtitle = "Gestão interna do sistema de crédito",
  homePath = "/interno",
  variant = "full",
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const resolvedLinks =
    links ??
    [
      ...DEFAULT_LINKS,
      ...(["ADMIN", "GESTOR"].includes(user?.role)
        ? [{ label: "Convites de Registo", to: "/interno/convites-portal" }]
        : []),
      ...(["ADMIN", "GESTOR"].includes(user?.role)
        ? [{ label: "Empresa", to: "/interno/empresa" }]
        : []),
    ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === homePath) return location.pathname === homePath;
    return location.pathname.startsWith(path);
  };

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
          {/* Logo — clicável, mantem na home deste layout */}
          <Stack
            spacing={0.5}
            sx={{ cursor: "pointer" }}
            onClick={() => navigate(homePath)}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {subtitle}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            {variant === "full" ? (
              <>
                {/* Notificações com ícone MUI real */}
                <Tooltip title="Notificações">
                  <IconButton
                    component={RouterLink}
                    to="/interno/notificacoes"
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
                      label={user?.role || "-"}
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
              </>
            ) : (
              <Chip
                label={user?.nome || "SUPERADMIN"}
                size="small"
                sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}
              />
            )}

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
      <Box sx={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={0.5}
            sx={{ py: 1.5, overflowX: "auto" }}
          >
            {resolvedLinks.map((link) => {
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
                    "&:hover": {
                      backgroundColor: active ? "#111827" : "#f3f4f6",
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