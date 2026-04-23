import { useEffect, useState } from "react";
import { Link as RouterLink, useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  getMutuarioByIdRequest,
  updateMutuarioRequest,
  deleteMutuarioRequest,
} from "../../../api/admin.api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../../utils/formatters";

export default function MutuarioDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mutuario, setMutuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  const [form, setForm] = useState({
    nomeCompleto: "",
    documentoTipo: "",
    documentoNumero: "",
    dataNascimento: "",
    provincia: "",
    distrito: "",
    localResidencia: "",
    telefone: "",
    email: "",
  });

  const preencherFormulario = (data) => {
    setForm({
      nomeCompleto: data?.nomeCompleto || "",
      documentoTipo: data?.documentoTipo || "",
      documentoNumero: data?.documentoNumero || "",
      dataNascimento: data?.dataNascimento
        ? String(data.dataNascimento).slice(0, 10)
        : "",
      provincia: data?.provincia || "",
      distrito: data?.distrito || "",
      localResidencia: data?.localResidencia || "",
      telefone: data?.telefone || "",
      email: data?.email || "",
    });
  };

  const carregarMutuario = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMutuarioByIdRequest(id);
      setMutuario(data);
      preencherFormulario(data);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Erro ao carregar detalhe do mutuário."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMutuario();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditar = () => {
    if (mutuario) {
      preencherFormulario(mutuario);
    }

    setError("");
    setEditing(true);
  };

  const handleCancelar = () => {
    if (mutuario) {
      preencherFormulario(mutuario);
    }

    setError("");
    setEditing(false);
  };

  const handleGuardar = async () => {
    if (!form.nomeCompleto.trim()) {
      setError("O nome completo é obrigatório.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await updateMutuarioRequest(id, {
        nomeCompleto: form.nomeCompleto.trim(),
        documentoTipo: form.documentoTipo || null,
        documentoNumero: form.documentoNumero || null,
        dataNascimento: form.dataNascimento || null,
        provincia: form.provincia || null,
        distrito: form.distrito || null,
        localResidencia: form.localResidencia || null,
        telefone: form.telefone || null,
        email: form.email || null,
      });

      setSuccessOpen(true);
      setEditing(false);
      await carregarMutuario();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao atualizar mutuário.");
    } finally {
      setSaving(false);
    }
  };

  const handleApagar = async () => {
    const confirmar = window.confirm(
      "Tem certeza que deseja apagar este mutuário? Esta ação não pode ser desfeita."
    );

    if (!confirmar) return;

    try {
      setDeleting(true);
      setError("");

      await deleteMutuarioRequest(id);
      navigate("/interno/mutuarios");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao apagar mutuário.");
    } finally {
      setDeleting(false);
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
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} mb={1}>
            Detalhe do Mutuário
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Visualização e gestão cadastral interna do mutuário.
          </Typography>
        </Box>

        {mutuario && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {!editing ? (
              <>
                <Button variant="contained" onClick={handleEditar}>
                  Editar
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleApagar}
                  disabled={deleting || saving}
                >
                  {deleting ? "A apagar..." : "Apagar"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={handleCancelar}
                  disabled={saving || deleting}
                >
                  Cancelar
                </Button>

                <Button
                  variant="contained"
                  onClick={handleGuardar}
                  disabled={saving || deleting}
                >
                  {saving ? "A guardar..." : "Guardar Alterações"}
                </Button>
              </>
            )}
          </Stack>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && !mutuario && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography>Mutuário não encontrado.</Typography>
        </Paper>
      )}

      {mutuario && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={2}
              mb={2}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {mutuario.nomeCompleto || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Código: {mutuario.codigoMutuario || "-"}
                </Typography>
              </Box>

              {mutuario.user && (
                <Chip
                  label={mutuario.user.ativo ? "Utilizador ativo" : "Utilizador inativo"}
                  color={mutuario.user.ativo ? "success" : "default"}
                />
              )}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Nome Completo"
                name="nomeCompleto"
                value={form.nomeCompleto}
                onChange={handleChange}
                disabled={!editing}
              />

              <TextField
                fullWidth
                label="Tipo de Documento"
                name="documentoTipo"
                value={form.documentoTipo}
                onChange={handleChange}
                disabled={!editing}
              />

              <TextField
                fullWidth
                label="Número do Documento"
                name="documentoNumero"
                value={form.documentoNumero}
                onChange={handleChange}
                disabled={!editing}
              />

              <TextField
                fullWidth
                label="Data de Nascimento"
                name="dataNascimento"
                type="date"
                value={form.dataNascimento}
                onChange={handleChange}
                disabled={!editing}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="Província"
                name="provincia"
                value={form.provincia}
                onChange={handleChange}
                disabled={!editing}
              />

              <TextField
                fullWidth
                label="Distrito"
                name="distrito"
                value={form.distrito}
                onChange={handleChange}
                disabled={!editing}
              />

              <TextField
                fullWidth
                label="Local de Residência"
                name="localResidencia"
                value={form.localResidencia}
                onChange={handleChange}
                disabled={!editing}
              />

              <TextField
                fullWidth
                label="Telefone"
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                disabled={!editing}
              />

              <TextField
                fullWidth
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled={!editing}
              />

              <Typography variant="body2" color="text.secondary">
                <strong>Data de registo:</strong> {formatDate(mutuario.createdAt)}
              </Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
              Utilizador Associado
            </Typography>

            {mutuario.user ? (
              <Stack spacing={1.2}>
                <Typography>
                  <strong>ID:</strong> {mutuario.user.id || "-"}
                </Typography>

                <Typography>
                  <strong>Nome:</strong> {mutuario.user.nome || "-"}
                </Typography>

                <Typography>
                  <strong>Email:</strong> {mutuario.user.email || "-"}
                </Typography>

                <Typography>
                  <strong>Role:</strong> {mutuario.user.role || "-"}
                </Typography>

                <Typography>
                  <strong>Estado:</strong> {mutuario.user.ativo ? "Ativo" : "Inativo"}
                </Typography>
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Este mutuário não tem utilizador associado.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
              Pedidos de Crédito
            </Typography>

            {Array.isArray(mutuario.pedidosCredito) &&
            mutuario.pedidosCredito.length > 0 ? (
              <Stack spacing={2}>
                {mutuario.pedidosCredito.map((pedido) => {
                  const statusPedido = pedido.status || pedido.estado;

                  return (
                    <Box key={pedido.id}>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Box>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            mb={1}
                          >
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {pedido.numeroPedido || `Pedido #${pedido.id}`}
                            </Typography>

                            <Chip
                              size="small"
                              label={getStatusLabel(statusPedido)}
                              color={getStatusColor(statusPedido)}
                            />
                          </Stack>

                          <Typography variant="body2" color="text.secondary">
                            <strong>Valor solicitado:</strong>{" "}
                            {formatCurrency(pedido.valorSolicitado)}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">
                            <strong>Finalidade:</strong> {pedido.finalidade || "-"}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">
                            <strong>Etapa atual:</strong> {pedido.etapaAtual || "-"}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">
                            <strong>Data de submissão:</strong>{" "}
                            {formatDate(pedido.dataSubmissao)}
                          </Typography>
                        </Box>

                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          alignItems={{ xs: "stretch", sm: "center" }}
                        >
                          <Button
                            component={RouterLink}
                            to={`/interno/pedidos/${pedido.id}`}
                            variant="outlined"
                          >
                            Ver Pedido
                          </Button>
                        </Stack>
                      </Stack>

                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Este mutuário ainda não possui pedidos de crédito registados.
              </Typography>
            )}
          </Paper>
        </Stack>
      )}

      <Snackbar
        open={successOpen}
        autoHideDuration={1800}
        onClose={() => setSuccessOpen(false)}
        message="Mutuário atualizado com sucesso."
      />
    </Box>
  );
}