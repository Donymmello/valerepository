import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  createPedidoRequest,
  getAllMutuariosRequest,
  getAllPedidosRequest,
} from "../../../api/admin.api";
import { useAuth } from "../../../context/useAuth";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import PageHeader from "../../../components/common/PageHeader";
import LoadingState from "../../../components/common/LoadingState";
import StatusChip from "../../../components/common/StatusChip";

const FORM_VAZIO = {
  mutuarioId: "",
  valorSolicitado: "",
  prazo: "",
  finalidade: "",
  observacoes: "",
};

export default function PedidosList() {
  const { user } = useAuth();

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  /*
    Abrir um pedido em nome do mutuário faltava na interface: POST
    /pedidos-credito existia no backend mas só o portal do mutuário o
    chamava. Sem isto, o staff não conseguia registar quem apareceu ao
    balcão — e como o mutuário criado pelo backoffice não tem conta de
    utilizador, também não havia ninguém do outro lado para submeter o
    pedido. Mesmos perfis que o backend aceita.
  */
  const podeCriar = ["ADMIN", "GESTOR", "ANALISTA"].includes(user?.role);
  const [criarAberto, setCriarAberto] = useState(false);
  const [createForm, setCreateForm] = useState(FORM_VAZIO);
  const [mutuarios, setMutuarios] = useState([]);
  const [savingCreate, setSavingCreate] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllPedidosRequest();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  // A lista de mutuários só é carregada quando o formulário abre: quem só
  // vem consultar pedidos não paga o pedido extra.
  const abrirCriar = async () => {
    const aAbrir = !criarAberto;
    setCriarAberto(aAbrir);

    if (aAbrir && mutuarios.length === 0) {
      try {
        const data = await getAllMutuariosRequest();
        setMutuarios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Erro ao carregar mutuários.");
      }
    }
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCriar = async () => {
    const valor = Number(createForm.valorSolicitado);
    const prazo = Number(createForm.prazo);

    if (!createForm.mutuarioId) {
      setError("Escolhe o mutuário.");
      return;
    }

    if (!valor || valor <= 0 || !prazo || prazo <= 0) {
      setError("Valor solicitado e prazo têm de ser maiores que zero.");
      return;
    }

    if (!createForm.finalidade.trim()) {
      setError("A finalidade é obrigatória.");
      return;
    }

    try {
      setSavingCreate(true);
      setError("");

      // A taxa, a prestação e o montante total não vão daqui: o servidor
      // calcula-os com a taxa mínima da empresa, e a taxa final é decidida
      // pelo analista na aprovação de nível 1.
      await createPedidoRequest({
        mutuarioId: Number(createForm.mutuarioId),
        valorSolicitado: valor,
        prazo,
        finalidade: createForm.finalidade.trim(),
        observacoes: createForm.observacoes || null,
      });

      setCreateForm(FORM_VAZIO);
      setCriarAberto(false);
      setSuccessOpen(true);
      await carregarPedidos();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao criar pedido.");
    } finally {
      setSavingCreate(false);
    }
  };

  const pedidosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return pedidos;

    return pedidos.filter((pedido) => {
      const numeroPedido = String(pedido.numeroPedido || "").toLowerCase();
      const status = String(pedido.status || "").toLowerCase();
      const finalidade = String(pedido.finalidade || "").toLowerCase();
      const nomeMutuario = String(pedido.mutuario?.nomeCompleto || "").toLowerCase();

      return (
        numeroPedido.includes(term) ||
        status.includes(term) ||
        finalidade.includes(term) ||
        nomeMutuario.includes(term)
      );
    });
  }, [pedidos, search]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="Pedidos"
        subtitle="Consulte e acompanhe os pedidos de crédito no sistema."
      />

      {podeCriar && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant={criarAberto ? "outlined" : "contained"}
            onClick={abrirCriar}
          >
            {criarAberto ? "Cancelar" : "Novo Pedido"}
          </Button>
        </Box>
      )}

      {podeCriar && criarAberto && (
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={0.5}>
            Novo Pedido
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={2}>
            O pedido entra como submetido, na etapa 1. A taxa de juro e a
            prestação são calculadas pelo sistema com a taxa mínima da
            empresa; a taxa final é decidida na aprovação do analista.
          </Typography>

          {mutuarios.length === 0 ? (
            <Alert severity="info">
              Ainda não há mutuários registados. Cria primeiro um mutuário em
              Mutuários, e volta aqui para abrir o pedido.
            </Alert>
          ) : (
            <Stack spacing={2}>
              <TextField
                select
                fullWidth
                required
                label="Mutuário"
                name="mutuarioId"
                value={createForm.mutuarioId}
                onChange={handleCreateChange}
              >
                {mutuarios.map((mutuario) => (
                  <MenuItem key={mutuario.id} value={mutuario.id}>
                    {mutuario.nomeCompleto}
                    {mutuario.codigoMutuario ? ` (${mutuario.codigoMutuario})` : ""}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Valor Solicitado (MT)"
                  name="valorSolicitado"
                  value={createForm.valorSolicitado}
                  onChange={handleCreateChange}
                />

                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Prazo (meses)"
                  name="prazo"
                  value={createForm.prazo}
                  onChange={handleCreateChange}
                />
              </Stack>

              <TextField
                fullWidth
                required
                label="Finalidade"
                name="finalidade"
                value={createForm.finalidade}
                onChange={handleCreateChange}
              />

              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Observações"
                name="observacoes"
                value={createForm.observacoes}
                onChange={handleCreateChange}
              />

              <Box>
                <Button
                  variant="contained"
                  onClick={handleCriar}
                  disabled={savingCreate}
                >
                  {savingCreate ? "A guardar..." : "Criar Pedido"}
                </Button>
              </Box>
            </Stack>
          )}
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          label="Pesquisar por número, mutuário, status ou finalidade"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && pedidosFiltrados.length === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography>Nenhum pedido encontrado.</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {pedidosFiltrados.map((pedido) => (
          <Paper key={pedido.id} sx={{ p: 3, borderRadius: 3 }}>
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
                    {pedido.numeroPedido}
                  </Typography>

                  <StatusChip status={pedido.status} />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  <strong>Mutuário:</strong> {pedido.mutuario?.nomeCompleto || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Valor solicitado:</strong> {formatCurrency(pedido.valorSolicitado)}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Finalidade:</strong> {pedido.finalidade || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Etapa atual:</strong> {pedido.etapaAtual || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Data de submissão:</strong> {formatDate(pedido.dataSubmissao)}
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
          Pedido criado.
        </Alert>
      </Snackbar>
    </Box>
  );
}