import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  createMutuarioRequest,
  getAllMutuariosRequest,
} from "../../../api/admin.api";
import { useAuth } from "../../../context/useAuth";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import PageHeader from "../../../components/common/PageHeader";
import LoadingState from "../../../components/common/LoadingState";

const FORM_VAZIO = {
  nomeCompleto: "",
  documentoTipo: "",
  documentoNumero: "",
  dataNascimento: "",
  provincia: "",
  distrito: "",
  localResidencia: "",
  telefone: "",
  email: "",
};

export default function MutuariosList() {
  const { user } = useAuth();

  const [mutuarios, setMutuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  /*
    Criar mutuario faltava por completo na interface: dava para listar,
    editar e apagar, nunca para criar. As unicas entradas eram o
    auto-registo pelo portal (convite + OTP, conduzido pelo proprio
    mutuario) e a importacao por Excel, exclusiva do plano Empresarial.
    Uma financeira no Starter nao conseguia registar quem atendeu ao
    balcao. Mesmos perfis que o backend aceita em POST /mutuarios.
  */
  const podeCriar = ["ADMIN", "GESTOR", "ANALISTA"].includes(user?.role);
  const [criarAberto, setCriarAberto] = useState(false);
  const [createForm, setCreateForm] = useState(FORM_VAZIO);
  const [savingCreate, setSavingCreate] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const carregarMutuarios = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllMutuariosRequest();
      setMutuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao carregar mutuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMutuarios();
  }, []);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCriar = async () => {
    if (!createForm.nomeCompleto.trim()) {
      setError("O nome completo é obrigatório.");
      return;
    }

    try {
      setSavingCreate(true);
      setError("");

      // Campos vazios vão como null, não como "": o backend guarda o que
      // receber, e "" ficaria gravado como documento/telefone em branco em
      // vez de ausente. Mesmo tratamento do formulário de edição.
      await createMutuarioRequest({
        nomeCompleto: createForm.nomeCompleto.trim(),
        documentoTipo: createForm.documentoTipo || null,
        documentoNumero: createForm.documentoNumero || null,
        dataNascimento: createForm.dataNascimento || null,
        provincia: createForm.provincia || null,
        distrito: createForm.distrito || null,
        localResidencia: createForm.localResidencia || null,
        telefone: createForm.telefone || null,
        email: createForm.email || null,
      });

      setCreateForm(FORM_VAZIO);
      setCriarAberto(false);
      setSuccessOpen(true);
      await carregarMutuarios();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao criar mutuário.");
    } finally {
      setSavingCreate(false);
    }
  };

  const mutuariosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return mutuarios;

    return mutuarios.filter((mutuario) => {
      const codigo = String(mutuario.codigoMutuario || "").toLowerCase();
      const nome = String(mutuario.nomeCompleto || "").toLowerCase();
      const documento = String(mutuario.documentoNumero || "").toLowerCase();
      const telefone = String(mutuario.telefone || "").toLowerCase();
      const email = String(mutuario.email || "").toLowerCase();
      const nomeUser = String(mutuario.user?.nome || "").toLowerCase();

      return (
        codigo.includes(term) ||
        nome.includes(term) ||
        documento.includes(term) ||
        telefone.includes(term) ||
        email.includes(term) ||
        nomeUser.includes(term)
      );
    });
  }, [mutuarios, search]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="Mutuários"
        subtitle="Consulte e acompanhe os mutuários registados no sistema."
      />

      {podeCriar && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant={criarAberto ? "outlined" : "contained"}
            onClick={() => setCriarAberto((aberto) => !aberto)}
          >
            {criarAberto ? "Cancelar" : "Novo Mutuário"}
          </Button>
        </Box>
      )}

      {podeCriar && criarAberto && (
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={0.5}>
            Novo Mutuário
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={2}>
            Só o nome completo é obrigatório. O código do mutuário é gerado
            automaticamente. Para o mutuário poder entrar no portal, envia-lhe
            depois um convite de registo.
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              required
              label="Nome Completo"
              name="nomeCompleto"
              value={createForm.nomeCompleto}
              onChange={handleCreateChange}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Tipo de Documento"
                name="documentoTipo"
                value={createForm.documentoTipo}
                onChange={handleCreateChange}
              />

              <TextField
                fullWidth
                label="Número do Documento"
                name="documentoNumero"
                value={createForm.documentoNumero}
                onChange={handleCreateChange}
              />

              <TextField
                fullWidth
                type="date"
                label="Data de Nascimento"
                name="dataNascimento"
                InputLabelProps={{ shrink: true }}
                value={createForm.dataNascimento}
                onChange={handleCreateChange}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Província"
                name="provincia"
                value={createForm.provincia}
                onChange={handleCreateChange}
              />

              <TextField
                fullWidth
                label="Distrito"
                name="distrito"
                value={createForm.distrito}
                onChange={handleCreateChange}
              />

              <TextField
                fullWidth
                label="Local de Residência"
                name="localResidencia"
                value={createForm.localResidencia}
                onChange={handleCreateChange}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Telefone"
                name="telefone"
                value={createForm.telefone}
                onChange={handleCreateChange}
              />

              <TextField
                fullWidth
                label="Email"
                name="email"
                value={createForm.email}
                onChange={handleCreateChange}
              />
            </Stack>

            <Box>
              <Button
                variant="contained"
                onClick={handleCriar}
                disabled={savingCreate}
              >
                {savingCreate ? "A guardar..." : "Criar Mutuário"}
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          label="Pesquisar por código, nome, documento, telefone, email ou utilizador"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && mutuariosFiltrados.length === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography>Nenhum mutuário encontrado.</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {mutuariosFiltrados.map((mutuario) => (
          <Paper key={mutuario.id} sx={{ p: 3, borderRadius: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={3}
            >
              <Box>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  mb={1}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {mutuario.nomeCompleto || "-"}
                  </Typography>

                  {mutuario.user && (
                    <Chip
                      size="small"
                      label={mutuario.user.ativo ? "Utilizador ativo" : "Utilizador inativo"}
                      color={mutuario.user.ativo ? "success" : "default"}
                    />
                  )}
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  <strong>Código:</strong> {mutuario.codigoMutuario || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Documento:</strong> {mutuario.documentoNumero || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Telefone:</strong> {mutuario.telefone || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong> {mutuario.email || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Utilizador associado:</strong> {mutuario.user?.nome || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Data de registo:</strong> {formatDate(mutuario.createdAt)}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={1.5}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${mutuario.situacao?.pedidosAtivos ?? 0} pedido(s) ativo(s)`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    color={mutuario.situacao?.creditosIncumprimento > 0 ? "error" : "default"}
                    label={`${mutuario.situacao?.creditosAtivos ?? 0} crédito(s) ativo(s)`}
                  />
                  {mutuario.situacao?.creditosIncumprimento > 0 && (
                    <Chip
                      size="small"
                      color="error"
                      label={`${mutuario.situacao.creditosIncumprimento} em incumprimento`}
                    />
                  )}
                  {mutuario.situacao?.parcelasEmAtraso > 0 && (
                    <Chip
                      size="small"
                      color="warning"
                      label={`${mutuario.situacao.parcelasEmAtraso} parcela(s) em atraso`}
                    />
                  )}
                  {mutuario.situacao?.saldoEmDivida > 0 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Saldo em dívida: ${formatCurrency(mutuario.situacao.saldoEmDivida)}`}
                    />
                  )}
                </Stack>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Button
                  component={RouterLink}
                  to={`/interno/mutuarios/${mutuario.id}`}
                  variant="outlined"
                >
                  Ver Detalhe
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessOpen(false)}>
          Mutuário criado.
        </Alert>
      </Snackbar>
    </Box>
  );
}