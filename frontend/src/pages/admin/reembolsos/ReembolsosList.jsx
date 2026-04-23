import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  createReembolsoRequest,
  getAllReembolsosRequest,
  getPedidosElegiveisReembolsoRequest,
} from "../../../api/admin.api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../../utils/formatters";

export default function ReembolsosList() {
  const [reembolsos, setReembolsos] = useState([]);
  const [pedidosElegiveis, setPedidosElegiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    pedidoId: "",
    valorReembolsado: "",
    dataReembolso: "",
    meioPagamento: "TRANSFERENCIA",
    numeroTransacao: "",
    observacoes: "",
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError("");

      const [reembolsosData, pedidosElegiveisData] = await Promise.all([
        getAllReembolsosRequest(),
        getPedidosElegiveisReembolsoRequest(),
      ]);

      setReembolsos(Array.isArray(reembolsosData) ? reembolsosData : []);
      setPedidosElegiveis(
        Array.isArray(pedidosElegiveisData) ? pedidosElegiveisData : []
      );
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Erro ao carregar dados de reembolsos."
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

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelecionarPedido = (event) => {
    const pedidoId = event.target.value;

    const pedidoSelecionado = pedidosElegiveis.find(
      (pedido) => String(pedido.id) === String(pedidoId)
    );

    const totalDesembolsado = Array.isArray(pedidoSelecionado?.desembolsos)
      ? pedidoSelecionado.desembolsos.reduce(
          (total, item) => total + Number(item.valorDesembolsado || 0),
          0
        )
      : 0;

    const totalReembolsado = Array.isArray(pedidoSelecionado?.reembolsos)
      ? pedidoSelecionado.reembolsos.reduce(
          (total, item) => total + Number(item.valorReembolsado || 0),
          0
        )
      : 0;

    const saldoEmAberto = totalDesembolsado - totalReembolsado;

    setForm((prev) => ({
      ...prev,
      pedidoId,
      valorReembolsado: saldoEmAberto > 0 ? String(saldoEmAberto) : "",
    }));
  };

  const limparFormulario = () => {
    setForm({
      pedidoId: "",
      valorReembolsado: "",
      dataReembolso: "",
      meioPagamento: "TRANSFERENCIA",
      numeroTransacao: "",
      observacoes: "",
    });
  };

  const handleRegistarReembolso = async () => {
    if (!form.pedidoId) {
      setError("Selecione um pedido elegível.");
      return;
    }

    if (!form.valorReembolsado || Number(form.valorReembolsado) <= 0) {
      setError("Informe um valor de reembolso válido.");
      return;
    }

    const pedidoSelecionado = pedidosElegiveis.find(
      (pedido) => String(pedido.id) === String(form.pedidoId)
    );

    if (pedidoSelecionado) {
      const totalDesembolsado = Array.isArray(pedidoSelecionado.desembolsos)
        ? pedidoSelecionado.desembolsos.reduce(
            (total, item) => total + Number(item.valorDesembolsado || 0),
            0
          )
        : 0;

      const totalReembolsado = Array.isArray(pedidoSelecionado.reembolsos)
        ? pedidoSelecionado.reembolsos.reduce(
            (total, item) => total + Number(item.valorReembolsado || 0),
            0
          )
        : 0;

      const saldoEmAberto = totalDesembolsado - totalReembolsado;

      if (Number(form.valorReembolsado) > saldoEmAberto) {
        setError(
          `O valor do reembolso não pode ser maior que o saldo em aberto (${formatCurrency(
            saldoEmAberto
          )}).`
        );
        return;
      }
    }

    try {
      setSaving(true);
      setError("");

      await createReembolsoRequest({
        pedidoId: Number(form.pedidoId),
        valorReembolsado: Number(form.valorReembolsado),
        dataReembolso: form.dataReembolso || null,
        meioPagamento: form.meioPagamento || "TRANSFERENCIA",
        numeroTransacao: form.numeroTransacao || null,
        observacoes: form.observacoes || null,
      });

      limparFormulario();
      setSuccessOpen(true);
      await carregarDados();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao registar reembolso.");
    } finally {
      setSaving(false);
    }
  };

  const reembolsosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return reembolsos;

    return reembolsos.filter((reembolso) => {
      const pedidoNumero = String(
        reembolso.pedido?.numeroPedido || ""
      ).toLowerCase();

      const statusPedido = String(
        reembolso.pedido?.status || reembolso.pedido?.estado || ""
      ).toLowerCase();

      const criadorNome = String(
        reembolso.criador?.nome || ""
      ).toLowerCase();

      const meioPagamento = String(
        reembolso.meioPagamento || ""
      ).toLowerCase();

      const numeroTransacao = String(
        reembolso.numeroTransacao || ""
      ).toLowerCase();

      const referencia = String(
        reembolso.referencia || ""
      ).toLowerCase();

      const observacoes = String(
        reembolso.observacoes || ""
      ).toLowerCase();

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
  }, [reembolsos, search]);

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
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Reembolsos
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Registe e consulte os reembolsos do sistema.
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
          Registar Reembolso
        </Typography>

        <Stack spacing={2}>
          <TextField
            select
            fullWidth
            label="Pedido Elegível"
            name="pedidoId"
            value={form.pedidoId}
            onChange={handleSelecionarPedido}
            helperText="Apenas pedidos desembolsados com saldo em aberto aparecem aqui."
          >
            <MenuItem value="">Selecionar</MenuItem>
            {pedidosElegiveis.map((pedido) => (
              <MenuItem key={pedido.id} value={pedido.id}>
                {pedido.numeroPedido} — {pedido.mutuario?.nomeCompleto || "Sem mutuário"}
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

                const totalDesembolsado = Array.isArray(pedidoSelecionado.desembolsos)
                  ? pedidoSelecionado.desembolsos.reduce(
                      (total, item) => total + Number(item.valorDesembolsado || 0),
                      0
                    )
                  : 0;

                const totalReembolsado = Array.isArray(pedidoSelecionado.reembolsos)
                  ? pedidoSelecionado.reembolsos.reduce(
                      (total, item) => total + Number(item.valorReembolsado || 0),
                      0
                    )
                  : 0;

                const saldoEmAberto = totalDesembolsado - totalReembolsado;
                const status = pedidoSelecionado.status || pedidoSelecionado.estado;

                return (
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Pedido:</strong> {pedidoSelecionado.numeroPedido || "-"}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Mutuário:</strong>{" "}
                      {pedidoSelecionado.mutuario?.nomeCompleto || "-"}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Total desembolsado:</strong>{" "}
                      {formatCurrency(totalDesembolsado)}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Total reembolsado:</strong>{" "}
                      {formatCurrency(totalReembolsado)}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Saldo em aberto:</strong>{" "}
                      {formatCurrency(saldoEmAberto)}
                    </Typography>

                    <Box>
                      <Chip
                        size="small"
                        label={getStatusLabel(status)}
                        color={getStatusColor(status)}
                      />
                    </Box>
                  </Stack>
                );
              })()}
            </Paper>
          )}

          <TextField
            fullWidth
            label="Valor Reembolsado"
            name="valorReembolsado"
            type="number"
            value={form.valorReembolsado}
            onChange={handleChange}
            helperText="Ao selecionar o pedido, este campo é preenchido com o saldo em aberto, mas pode ser ajustado."
          />

          <TextField
            fullWidth
            label="Data do Reembolso"
            name="dataReembolso"
            type="date"
            value={form.dataReembolso}
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
            helperText="Preencher apenas se existir referência externa da operação."
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
              onClick={handleRegistarReembolso}
              disabled={saving}
            >
              {saving ? "A registar..." : "Registar Reembolso"}
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

      {!error && reembolsosFiltrados.length === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography>Nenhum reembolso encontrado.</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {reembolsosFiltrados.map((reembolso) => {
          const statusPedido =
            reembolso.pedido?.status || reembolso.pedido?.estado;

          return (
            <Paper key={reembolso.id} sx={{ p: 3, borderRadius: 3 }}>
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
                      {reembolso.pedido?.numeroPedido || `Reembolso #${reembolso.id}`}
                    </Typography>

                    {statusPedido && (
                      <Chip
                        label={getStatusLabel(statusPedido)}
                        color={getStatusColor(statusPedido)}
                        size="small"
                      />
                    )}
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Valor reembolsado:</strong>{" "}
                    {formatCurrency(reembolso.valorReembolsado)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Data do reembolso:</strong>{" "}
                    {formatDate(reembolso.dataReembolso)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Meio de pagamento:</strong> {reembolso.meioPagamento || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Número da transação:</strong>{" "}
                    {reembolso.numeroTransacao || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Referência:</strong> {reembolso.referencia || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Registado por:</strong> {reembolso.criador?.nome || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Observações:</strong> {reembolso.observacoes || "-"}
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  {reembolso.pedido?.id && (
                    <Button
                      component={RouterLink}
                      to={`/interno/pedidos/${reembolso.pedido.id}`}
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
        message="Reembolso registado com sucesso."
      />
    </Box>
  );
}