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
  createDesembolsoRequest,
  getAllDesembolsosRequest,
  getAllPedidosRequest,
} from "../../../api/admin.api";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import PageHeader from "../../../components/common/PageHeader";
import LoadingState from "../../../components/common/LoadingState";
import StatusChip from "../../../components/common/StatusChip";

export default function DesembolsosList() {
  const [desembolsos, setDesembolsos] = useState([]);
  const [pedidosElegiveis, setPedidosElegiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    pedidoId: "",
    valorDesembolsado: "",
    dataDesembolso: "",
    meioPagamento: "TRANSFERENCIA",
    numeroTransacao: "",
    referencia: "",
    observacoes: "",
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError("");

      const [resDesembolsos, resPedidos] = await Promise.all([
        getAllDesembolsosRequest(),
        getAllPedidosRequest(),
      ]);

      // CORREÇÃO: Garante a extração correta caso a API retorne { data: [...] } ou direto o array
      const desembolsosData = resDesembolsos?.data ?? resDesembolsos;
      const pedidosData = resPedidos?.data ?? resPedidos;

      const listaDesembolsos = Array.isArray(desembolsosData) ? desembolsosData : [];
      const listaPedidos = Array.isArray(pedidosData) ? pedidosData : [];

      // CORREÇÃO: Mapeia de forma tolerante a 'status' ou 'estado' do pedido
      const elegiveis = listaPedidos.filter((pedido) => {
        const status = pedido?.status || pedido?.estado;
        return status === "APROVADO";
      });

      setDesembolsos(listaDesembolsos);
      setPedidosElegiveis(elegiveis);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Erro ao carregar dados de desembolsos."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelecionarPedido = (event) => {
    const pedidoId = event.target.value;
    const pedidoSelecionado = pedidosElegiveis.find(
      (pedido) => String(pedido.id) === String(pedidoId)
    );

    setForm((prev) => ({
      ...prev,
      pedidoId,
      valorDesembolsado: pedidoSelecionado?.valorSolicitado
        ? String(pedidoSelecionado.valorSolicitado)
        : "",
    }));
  };

  const limparFormulario = () => {
    setForm({
      pedidoId: "",
      valorDesembolsado: "",
      dataDesembolso: "",
      meioPagamento: "TRANSFERENCIA",
      numeroTransacao: "",
      referencia: "",
      observacoes: "",
    });
  };

  const handleRegistarDesembolso = async () => {
    if (!form.pedidoId) {
      setError("Selecione um pedido elegível.");
      return;
    }

    if (!form.valorDesembolsado || Number(form.valorDesembolsado) <= 0) {
      setError("Informe um valor de desembolso válido.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createDesembolsoRequest({
        pedidoId: Number(form.pedidoId),
        valorDesembolsado: Number(form.valorDesembolsado),
        dataDesembolso: form.dataDesembolso || null,
        meioPagamento: form.meioPagamento || "TRANSFERENCIA",
        numeroTransacao: form.numeroTransacao || null,
        referencia: form.referencia || null,
        observacoes: form.observacoes || null,
      });

      limparFormulario();
      setSuccessOpen(true);
      await carregarDados();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao registar desembolso.");
    } finally {
      setSaving(false);
    }
  };

  const desembolsosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return desembolsos;

    return desembolsos.filter((desembolso) => {
      // CORREÇÃO: Optional chaining preventivo para evitar crash por campos nulos
      const pedidoNumero = String(desembolso?.pedido?.numeroPedido || "").toLowerCase();
      const statusPedido = String(desembolso?.pedido?.status || desembolso?.pedido?.estado || "").toLowerCase();
      const criadorNome = String(desembolso?.criador?.nome || "").toLowerCase();
      const meioPagamento = String(desembolso?.meioPagamento || "").toLowerCase();
      const numeroTransacao = String(desembolso?.numeroTransacao || "").toLowerCase();
      const referencia = String(desembolso?.referencia || "").toLowerCase();
      const observacoes = String(desembolso?.observacoes || "").toLowerCase();

      return (
        pedidoNumero.includes(term) ||
        statusPedido.includes(term) ||
        criadorNome.includes(term) ||
        meioPagamento.includes(term) ||
        numeroTransacao.includes(term) ||
        referencia.includes(term) ||
        observacoes.includes(term)
      );
    });
  }, [desembolsos, search]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="Desembolsos"
        subtitle="Registe e consulte os desembolsos do sistema."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
          Registar Desembolso
        </Typography>

        <Stack spacing={2}>
          <TextField
            select
            fullWidth
            label="Pedido Elegível"
            name="pedidoId"
            value={form.pedidoId}
            onChange={handleSelecionarPedido}
            helperText="Apenas pedidos com status APROVADO aparecem aqui."
          >
            <MenuItem value="">Selecionar</MenuItem>
            {pedidosElegiveis.map((pedido) => (
              <MenuItem key={pedido.id} value={pedido.id}>
                {pedido?.numeroPedido} — {pedido?.mutuario?.nomeCompleto || "Sem mutuário"}
              </MenuItem>
            ))}
          </TextField>

          {form.pedidoId && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              {(() => {
                const pedidoSelecionado = pedidosElegiveis.find(
                  (pedido) => String(pedido.id) === String(form.pedidoId)
                );

                if (!pedidoSelecionado) return null;
                const status = pedidoSelecionado.status || pedidoSelecionado.estado;

                return (
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Pedido:</strong> {pedidoSelecionado?.numeroPedido || "-"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Mutuário:</strong>{" "}
                      {pedidoSelecionado?.mutuario?.nomeCompleto || "-"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Valor solicitado:</strong>{" "}
                      {formatCurrency(pedidoSelecionado?.valorSolicitado)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Finalidade:</strong> {pedidoSelecionado?.finalidade || "-"}
                    </Typography>
                    <Box>
                      <StatusChip status={status} />
                    </Box>
                  </Stack>
                );
              })()}
            </Paper>
          )}

          <TextField
            fullWidth
            label="Valor Desembolsado"
            name="valorDesembolsado"
            type="number"
            value={form.valorDesembolsado}
            onChange={handleChange}
            helperText="Ao selecionar o pedido, este campo é preenchido automaticamente, mas pode ser ajustado."
          />

          <TextField
            fullWidth
            label="Data do Desembolso"
            name="dataDesembolso"
            type="date"
            value={form.dataDesembolso}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            select
            fullWidth
            label="Meio de Pagamento"
            name="meioPagamento"
            value={form.meioPagamento}
            onChange={handleChange}
          >
            <MenuItem value="TRANSFERENCIA">TRANSFERENCIA</MenuItem>
            <MenuItem value="CHEQUE">CHEQUE</MenuItem>
            <MenuItem value="DINHEIRO">DINHEIRO</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Número da Transação"
            name="numeroTransacao"
            value={form.numeroTransacao}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            label="Observações"
            name="observacoes"
            multiline
            minRows={4}
            value={form.observacoes}
            onChange={handleChange}
          />

          <Box>
            <Button
              variant="contained"
              onClick={handleRegistarDesembolso}
              disabled={saving}
            >
              {saving ? "A registar..." : "Registar Desembolso"}
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          label="Pesquisar por pedido, status, criador, meio de pagamento, transação, referência ou observações"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      {!error && desembolsosFiltrados.length === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography>Nenhum desembolso encontrado.</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {desembolsosFiltrados.map((desembolso) => {
          const statusPedido = desembolso?.pedido?.status || desembolso?.pedido?.estado;

          return (
            <Paper key={desembolso.id} sx={{ p: 3, borderRadius: 3 }}>
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
                      {desembolso?.pedido?.numeroPedido || `Desembolso #${desembolso.id}`}
                    </Typography>

                    {statusPedido && <StatusChip status={statusPedido} />}
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Valor desembolsado:</strong>{" "}
                    {formatCurrency(desembolso?.valorDesembolsado)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Data do desembolso:</strong>{" "}
                    {formatDate(desembolso?.dataDesembolso)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Meio de pagamento:</strong> {desembolso?.meioPagamento || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Número da transação:</strong>{" "}
                    {desembolso?.numeroTransacao || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Referência:</strong> {desembolso?.referencia || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Registado por:</strong> {desembolso?.criador?.nome || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Observações:</strong> {desembolso?.observacoes || "-"}
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  {desembolso?.pedido?.id && (
                    <Button
                      component={RouterLink}
                      to={`/interno/pedidos/${desembolso.pedido.id}`}
                      variant="outlined"
                    >
                      Ver Pedido
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      <Snackbar
        open={successOpen}
        autoHideDuration={1800}
        onClose={() => setSuccessOpen(false)}
        message="Desembolso registado com sucesso."
      />
    </Box>
  );
}