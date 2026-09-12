import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  getMinhaEmpresaRequest,
  atualizarMinhaEmpresaRequest,
  uploadLogoEmpresaRequest,
  listarUtilizadoresEmpresaRequest,
  atualizarEstadoUtilizadorRequest,
} from "../../../api/admin.api";
import { useAuth } from "../../../context/useAuth";
import { formatDate } from "../../../utils/formatters";

// Página de configurações da empresa (tenant): perfil + utilizadores internos.
export default function EmpresaConfiguracoes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const podeEditar = user?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [empresa, setEmpresa] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    nuit: "",
    email: "",
    telefone: "",
    taxaJurosMin: "",
    taxaJurosMax: "",
  });
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [empresaMsg, setEmpresaMsg] = useState("");

  const inputLogoRef = useRef(null);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [erroLogo, setErroLogo] = useState("");

  const [usuarios, setUsuarios] = useState([]);
  const [usuariosError, setUsuariosError] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const carregar = async () => {
    try {
      setLoading(true);
      setError("");

      const empresaData = await getMinhaEmpresaRequest();
      setEmpresa(empresaData);
      setForm({
        nome: empresaData.nome || "",
        nuit: empresaData.nuit || "",
        email: empresaData.email || "",
        telefone: empresaData.telefone || "",
        taxaJurosMin: empresaData.taxaJurosMin ?? "",
        taxaJurosMax: empresaData.taxaJurosMax ?? "",
      });

      if (["ADMIN", "GESTOR"].includes(user?.role)) {
        try {
          const users = await listarUtilizadoresEmpresaRequest();
          setUsuarios(Array.isArray(users) ? users : []);
        } catch (err) {
          console.error(err);
          setUsuariosError(err?.response?.data?.message || "Erro ao carregar utilizadores.");
        }
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao carregar dados da empresa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSalvarEmpresa = async (event) => {
    event.preventDefault();
    setEmpresaMsg("");
    setError("");
    setSavingEmpresa(true);

    try {
      const data = await atualizarMinhaEmpresaRequest(form);
      setEmpresa(data.empresa);
      setEmpresaMsg("Dados da empresa atualizados com sucesso.");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao atualizar empresa.");
    } finally {
      setSavingEmpresa(false);
    }
  };

  const handleEscolherLogo = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite escolher o mesmo ficheiro outra vez, se preciso
    if (!file) return;

    setErroLogo("");
    setEnviandoLogo(true);

    uploadLogoEmpresaRequest(file)
      .then((data) => {
        setEmpresa(data.empresa);
        setEmpresaMsg("Logo atualizado com sucesso.");
      })
      .catch((err) => {
        console.error(err);
        setErroLogo(err?.response?.data?.message || "Erro ao enviar o logo. Tenta novamente.");
      })
      .finally(() => setEnviandoLogo(false));
  };

  const handleToggleAtivo = async (usuario) => {
    setUsuariosError("");
    setTogglingId(usuario.id);

    try {
      await atualizarEstadoUtilizadorRequest(usuario.id, !usuario.ativo);
      setUsuarios((prev) =>
        prev.map((item) => (item.id === usuario.id ? { ...item, ativo: !usuario.ativo } : item))
      );
    } catch (err) {
      console.error(err);
      setUsuariosError(err?.response?.data?.message || "Erro ao atualizar estado do utilizador.");
    } finally {
      setTogglingId(null);
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
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} mb={0.5}>
          Empresa
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dados da tua empresa e gestão dos utilizadores internos do backoffice.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Perfil da empresa */}
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, border: "1px solid #e0e0e0", mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Perfil da Empresa
          </Typography>
          {empresa?.estado && (
            <Chip
              label={empresa.estado}
              color={empresa.estado === "ATIVA" ? "success" : "default"}
              size="small"
            />
          )}
        </Stack>

        {empresaMsg && <Alert severity="success" sx={{ mb: 3 }}>{empresaMsg}</Alert>}
        {erroLogo && <Alert severity="error" sx={{ mb: 3 }}>{erroLogo}</Alert>}

        <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 3 }}>
          <Avatar src={empresa?.logo || undefined} variant="rounded" sx={{ width: 64, height: 64 }}>
            {(empresa?.nome || "?").charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Logo da empresa
            </Typography>
            {podeEditar ? (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={enviandoLogo}
                  onClick={() => inputLogoRef.current?.click()}
                >
                  {enviandoLogo ? "A enviar..." : "Alterar logo"}
                </Button>
                <input
                  ref={inputLogoRef}
                  type="file"
                  hidden
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleEscolherLogo}
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  PNG, JPG, WEBP ou SVG, até 2 MB.
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">Só o ADMIN pode alterar o logo.</Typography>
            )}
          </Box>
        </Stack>

        <Box component="form" onSubmit={handleSalvarEmpresa}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome da empresa"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                disabled={!podeEditar}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="NUIT"
                value={form.nuit}
                onChange={(e) => setForm({ ...form, nuit: e.target.value })}
                disabled={!podeEditar}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!podeEditar}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                disabled={!podeEditar}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Plano" value={empresa?.plano || "-"} disabled />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Taxa de juros praticada
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Faixa de taxa anual (%) desta empresa. É usada como estimativa quando um pedido é submetido, e o analista escolhe a taxa final dentro desta faixa ao aprovar o pedido.
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Taxa Mínima Anual (%)"
                type="number"
                inputProps={{ step: "0.01", min: 0 }}
                value={form.taxaJurosMin}
                onChange={(e) => setForm({ ...form, taxaJurosMin: e.target.value })}
                disabled={!podeEditar}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Taxa Máxima Anual (%)"
                type="number"
                inputProps={{ step: "0.01", min: 0 }}
                value={form.taxaJurosMax}
                onChange={(e) => setForm({ ...form, taxaJurosMax: e.target.value })}
                disabled={!podeEditar}
              />
            </Grid>

            {podeEditar && (
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ borderRadius: 2, fontWeight: "bold" }}
                  disabled={savingEmpresa}
                >
                  {savingEmpresa ? "A guardar..." : "Guardar Alterações"}
                </Button>
              </Grid>
            )}
          </Grid>
        </Box>
      </Paper>

      {/* Utilizadores internos */}
      {["ADMIN", "GESTOR"].includes(user?.role) && (
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Utilizadores Internos
            </Typography>
            {podeEditar && (
              <Button
                variant="contained"
                size="small"
                sx={{ borderRadius: 2, fontWeight: "bold" }}
                onClick={() => navigate("/interno/register-interno")}
              >
                Adicionar Utilizador
              </Button>
            )}
          </Stack>

          {usuariosError && <Alert severity="error" sx={{ mb: 3 }}>{usuariosError}</Alert>}

          {usuarios.length === 0 ? (
            <Typography color="text.secondary">Nenhum utilizador interno encontrado.</Typography>
          ) : (
            <Stack divider={<Divider />} spacing={0}>
              {usuarios.map((item) => (
                <Stack
                  key={item.id}
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                  sx={{ py: 2 }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>
                      {item.nome}{" "}
                      {Number(item.id) === Number(user?.id) && (
                        <Chip label="Tu" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.email} · desde {formatDate(item.created_at)}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip label={item.role} size="small" variant="outlined" />
                    <Chip
                      label={item.ativo ? "Ativo" : "Inativo"}
                      color={item.ativo ? "success" : "default"}
                      size="small"
                    />
                    {user?.role === "ADMIN" && (
                      <Switch
                        checked={!!item.ativo}
                        onChange={() => handleToggleAtivo(item)}
                        disabled={togglingId === item.id || Number(item.id) === Number(user?.id)}
                      />
                    )}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      )}
    </Box>
  );
}
