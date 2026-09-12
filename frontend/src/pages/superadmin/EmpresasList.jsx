import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  listarEmpresasSuperadminRequest,
  atualizarEmpresaSuperadminRequest,
} from "../../api/superadmin.api";
import { bootstrapAdminRequest } from "../../api/auth.api";
import { formatDate } from "../../utils/formatters";

const PLANOS = ["STARTER", "BUSINESS", "ENTERPRISE"];
const ESTADOS = ["TESTE", "ATIVA", "SUSPENSA", "CANCELADA"];

const ESTADO_COR = {
  TESTE: "info",
  ATIVA: "success",
  SUSPENSA: "warning",
  CANCELADA: "default",
};

function diasRestantes(trialEndsAt) {
  if (!trialEndsAt) return null;
  const dias = Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
  return dias;
}

export default function EmpresasList() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [editando, setEditando] = useState(null); // empresa selecionada
  const [form, setForm] = useState({ plano: "", estado: "" });
  const [salvando, setSalvando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");

  const [criando, setCriando] = useState(false); // dialog "Nova Empresa" aberto?
  const [novaEmpresa, setNovaEmpresa] = useState({ nomeEmpresa: "", nome: "", email: "", password: "" });
  const [criandoSalvando, setCriandoSalvando] = useState(false);
  const [erroCriacao, setErroCriacao] = useState("");

  // "Apagar" empresa: não remove nada da BD, só marca estado=CANCELADA
  // (bloqueia o acesso, ver avaliarAcessoEmpresa), reversível a qualquer
  // momento reabrindo "Editar" e escolhendo outro estado.
  const [apagando, setApagando] = useState(null); // empresa selecionada para confirmar
  const [apagandoSalvando, setApagandoSalvando] = useState(false);
  const [erroApagar, setErroApagar] = useState("");

  const carregar = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listarEmpresasSuperadminRequest();
      setEmpresas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao carregar empresas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const empresasFiltradas = useMemo(() => {
    const termo = search.trim().toLowerCase();
    if (!termo) return empresas;
    return empresas.filter((e) =>
      String(e.nome || "").toLowerCase().includes(termo) ||
      String(e.slug || "").toLowerCase().includes(termo) ||
      String(e.email || "").toLowerCase().includes(termo)
    );
  }, [empresas, search]);

  const abrirEdicao = (empresa) => {
    setEditando(empresa);
    setForm({ plano: empresa.plano, estado: empresa.estado });
    setErroEdicao("");
  };

  const fecharEdicao = () => {
    setEditando(null);
  };

  const guardarEdicao = async () => {
    setSalvando(true);
    setErroEdicao("");
    try {
      const data = await atualizarEmpresaSuperadminRequest(editando.id, form);
      setEmpresas((prev) =>
        prev.map((e) => (e.id === editando.id ? { ...e, ...data.empresa } : e))
      );
      fecharEdicao();
    } catch (err) {
      console.error(err);
      setErroEdicao(err?.response?.data?.message || "Erro ao atualizar empresa.");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarApagar = async () => {
    setApagandoSalvando(true);
    setErroApagar("");
    try {
      const data = await atualizarEmpresaSuperadminRequest(apagando.id, { estado: "CANCELADA" });
      setEmpresas((prev) =>
        prev.map((e) => (e.id === apagando.id ? { ...e, ...data.empresa } : e))
      );
      setApagando(null);
    } catch (err) {
      console.error(err);
      setErroApagar(err?.response?.data?.message || "Erro ao apagar empresa.");
    } finally {
      setApagandoSalvando(false);
    }
  };

  const criarEmpresa = async () => {
    setCriandoSalvando(true);
    setErroCriacao("");
    try {
      await bootstrapAdminRequest(novaEmpresa);
      setCriando(false);
      setNovaEmpresa({ nomeEmpresa: "", nome: "", email: "", password: "" });
      carregar();
    } catch (err) {
      console.error(err);
      setErroCriacao(err?.response?.data?.message || "Erro ao criar empresa.");
    } finally {
      setCriandoSalvando(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Empresas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Todas as empresas (tenants) da plataforma. Muda plano ou estado manualmente.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setCriando(true)}>
          Nova Empresa
        </Button>
      </Stack>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          label="Pesquisar por nome, slug ou email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {empresasFiltradas.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography color="text.secondary">Nenhuma empresa encontrada.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empresa</TableCell>
                <TableCell>Plano</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Utilizadores</TableCell>
                <TableCell>Criada em</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empresasFiltradas.map((empresa) => {
                const restantes = empresa.estado === "TESTE" ? diasRestantes(empresa.trialEndsAt) : null;
                return (
                  <TableRow key={empresa.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{empresa.nome}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {empresa.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={empresa.plano} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Chip label={empresa.estado} size="small" color={ESTADO_COR[empresa.estado] || "default"} />
                        {restantes !== null && (
                          <Typography variant="caption" color={restantes < 0 ? "error" : "text.secondary"}>
                            {restantes < 0 ? "trial expirado" : `${restantes} dia(s) restantes`}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{empresa.totalUtilizadores}</TableCell>
                    <TableCell>{formatDate(empresa.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => abrirEdicao(empresa)}>
                          Editar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={empresa.estado === "CANCELADA"}
                          onClick={() => { setApagando(empresa); setErroApagar(""); }}
                        >
                          Apagar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={!!editando} onClose={fecharEdicao} fullWidth maxWidth="xs">
        <DialogTitle>Editar {editando?.nome}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} mt={0.5}>
            {erroEdicao && <Alert severity="error">{erroEdicao}</Alert>}

            <TextField
              select
              fullWidth
              label="Plano"
              value={form.plano}
              onChange={(e) => setForm({ ...form, plano: e.target.value })}
            >
              {PLANOS.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Estado"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              {ESTADOS.map((e) => (
                <MenuItem key={e} value={e}>{e}</MenuItem>
              ))}
            </TextField>

            {form.estado === "ATIVA" && editando?.estado !== "ATIVA" && (
              <Alert severity="info">
                Ao ativar, o período de teste desta empresa é encerrado.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao} disabled={salvando}>Cancelar</Button>
          <Button onClick={guardarEdicao} variant="contained" disabled={salvando}>
            {salvando ? "A guardar..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!apagando} onClose={() => setApagando(null)} fullWidth maxWidth="xs">
        <DialogTitle>Apagar {apagando?.nome}?</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {erroApagar && <Alert severity="error">{erroApagar}</Alert>}
            <Typography variant="body2" color="text.secondary">
              A empresa passa a estado <strong>CANCELADA</strong> e o acesso fica bloqueado. Nada é apagado
              da base de dados, podes reverter a qualquer momento em "Editar".
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApagando(null)} disabled={apagandoSalvando}>Cancelar</Button>
          <Button onClick={confirmarApagar} variant="contained" color="error" disabled={apagandoSalvando}>
            {apagandoSalvando ? "A apagar..." : "Apagar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={criando} onClose={() => setCriando(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nova Empresa</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} mt={0.5}>
            {erroCriacao && <Alert severity="error">{erroCriacao}</Alert>}

            <TextField
              fullWidth
              label="Nome da empresa"
              value={novaEmpresa.nomeEmpresa}
              onChange={(e) => setNovaEmpresa({ ...novaEmpresa, nomeEmpresa: e.target.value })}
            />
            <TextField
              fullWidth
              label="Nome do administrador"
              value={novaEmpresa.nome}
              onChange={(e) => setNovaEmpresa({ ...novaEmpresa, nome: e.target.value })}
            />
            <TextField
              fullWidth
              type="email"
              label="Email do administrador"
              value={novaEmpresa.email}
              onChange={(e) => setNovaEmpresa({ ...novaEmpresa, email: e.target.value })}
            />
            <TextField
              fullWidth
              type="password"
              label="Password inicial"
              value={novaEmpresa.password}
              onChange={(e) => setNovaEmpresa({ ...novaEmpresa, password: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCriando(false)} disabled={criandoSalvando}>Cancelar</Button>
          <Button onClick={criarEmpresa} variant="contained" disabled={criandoSalvando}>
            {criandoSalvando ? "A criar..." : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
