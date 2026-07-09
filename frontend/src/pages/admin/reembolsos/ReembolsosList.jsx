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
  getCreditosElegiveisReembolsoRequest,
} from "../../../api/admin.api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../../utils/formatters";

export default function ReembolsosList() {
  const [reembolsos, setReembolsos] = useState([]);
  const [creditosElegiveis, setCreditosElegiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    creditoId: "",
    parcelaId: "",
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

      const [reembolsosData, creditosData] = await Promise.all([
        getAllReembolsosRequest(),
        getCreditosElegiveisReembolsoRequest(),
      ]);

      setReembolsos(Array.isArray(reembolsosData) ? reembolsosData : []);
      setCreditosElegiveis(Array.isArray(creditosData) ? creditosData : []);
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

  const handleSelecionarCredito = (event) => {
    const creditoId = event.target.value;

    const creditoSelecionado = creditosElegiveis.find(
      (credito) => String(credito.id) === String(creditoId)
    );

    if (!creditoSelecionado) {
      setForm((prev) => ({
        ...prev,
        creditoId,
        parcelaId: "",
        valorReembolsado: "",
      }));
      return;
    }

    // Atualizar form com dados do crédito
    setForm((prev) => ({
      ...prev,
      creditoId,
      parcelaId: "", // Usuário vai selecionar a parcela depois
      valorReembolsado: "", // Será preenchido quando selecionar parcela
    }));
  };

  const handleSelecionarParcela = (event) => {
    const parcelaId = event.target.value;

    const creditoSelecionado = creditosElegiveis.find(
      (credito) => String(credito.id) === String(form.creditoId)
    );

    if (!creditoSelecionado) return;

    const parcelaSelecionada = creditoSelecionado.parcelas?.find(
      (parcela) => String(parcela.id) === String(parcelaId)
    );

    if (!parcelaSelecionada) return;

    // Preencher valor com o saldo da parcela
    const valorParaReembolsar = Number(parcelaSelecionada.saldoParcela || 0);

    setForm((prev) => ({
      ...prev,
      parcelaId,
      valorReembolsado: valorParaReembolsar > 0 ? String(valorParaReembolsar) : "",
    }));
  };

  const limparFormulario = () => {
    setForm({
      creditoId: "",
      parcelaId: "",
      valorReembolsado: "",
      dataReembolso: "",
      meioPagamento: "TRANSFERENCIA",
      numeroTransacao: "",
      observacoes: "",
    });
  };

  const handleRegistarReembolso = async () => {
    if (!form.creditoId) {
      setError("Selecione um crédito elegível.");
      return;
    }

    if (!form.parcelaId) {
      setError("Selecione uma parcela.");
      return;
    }

    if (!form.valorReembolsado || Number(form.valorReembolsado) <= 0) {
      setError("Informe um valor de reembolso válido.");
      return;
    }

    const creditoSelecionado = creditosElegiveis.find(
      (credito) => String(credito.id) === String(form.creditoId)
    );

    const parcelaSelecionada = creditoSelecionado?.parcelas?.find(
      (parcela) => String(parcela.id) === String(form.parcelaId)
    );

    if (!parcelaSelecionada) {
      setError("Parcela não encontrada.");
      return;
    }

    if (Number(form.valorReembolsado) > Number(parcelaSelecionada.saldoParcela)) {
      setError(
        `O valor do reembolso não pode ser maior que o saldo da parcela (${formatCurrency(
          parcelaSelecionada.saldoParcela
        )}).`
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createReembolsoRequest({
        creditoId: Number(form.creditoId),
        parcelaId: Number(form.parcelaId),
        valorReembolsado: Number(form.valorReembolsado),
        dataReembolso: form.dataReembolso || new Date().toISOString().split("T")[0],
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
      const numeroContrato = String(
        reembolso.credito?.numeroContrato || ""
      ).toLowerCase();

      const estadoCredito = String(
        reembolso.credito?.estado || ""
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
        numeroContrato.includes(term) ||
        estadoCredito.includes(term) ||
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
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Reembolsos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registar e gerir reembolsos de créditos
          </Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <TextField
            select
            fullWidth
            label="Crédito Elegível"
            name="creditoId"
            value={form.creditoId}
            onChange={handleSelecionarCredito}
            helperText="Apenas créditos ATIVO com parcelas PENDENTE/ATRASADO aparecem aqui."
          >
            <MenuItem value="">Selecionar</MenuItem>
            {creditosElegiveis.map((credito) => (
              <MenuItem key={credito.id} value={credito.id}>
                {credito.numeroContrato} — {credito.mutuario?.nomeCompleto || "Sem mutuário"}
              </MenuItem>
            ))}
          </TextField>

          {form.creditoId && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              {(() => {
                const creditoSelecionado = creditosElegiveis.find(
                  (credito) => String(credito.id) === String(form.creditoId)
                );

                if (!creditoSelecionado) return null;

                return (
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Contrato:</strong> {creditoSelecionado.numeroContrato || "-"}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Mutuário:</strong>{" "}
                      {creditoSelecionado.mutuario?.nomeCompleto || "-"}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Valor Original:</strong>{" "}
                      {formatCurrency(creditoSelecionado.valorOriginal)}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Saldo Atual:</strong>{" "}
                      {formatCurrency(creditoSelecionado.saldoAtual)}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Total Pago:</strong>{" "}
                      {formatCurrency(creditoSelecionado.totalPago)}
                    </Typography>

                    <Box>
                      <Chip
                        size="small"
                        label={creditoSelecionado.estado}
                        color={creditoSelecionado.estado === "ATIVO" ? "success" : "default"}
                      />
                    </Box>
                  </Stack>
                );
              })()}
            </Paper>
          )}

          {form.creditoId && (
            <TextField
              select
              fullWidth
              label="Parcela"
              name="parcelaId"
              value={form.parcelaId}
              onChange={handleSelecionarParcela}
              helperText="Selecione a parcela a reembolsar."
            >
              <MenuItem value="">Selecionar</MenuItem>
              {creditosElegiveis
                .find((c) => String(c.id) === String(form.creditoId))
                ?.parcelas?.map((parcela) => (
                  <MenuItem key={parcela.id} value={parcela.id}>
                    Parcela #{parcela.numeroParcela} — Vencimento:{" "}
                    {formatDate(parcela.dataVencimento)} — Saldo:{" "}
                    {formatCurrency(parcela.saldoParcela)}
                  </MenuItem>
                ))}
            </TextField>
          )}

          <TextField
            fullWidth
            label="Valor Reembolsado"
            name="valorReembolsado"
            type="number"
            inputProps={{ step: "0.01" }}
            value={form.valorReembolsado}
            onChange={handleChange}
            helperText="Ao selecionar a parcela, este campo é preenchido com o saldo, mas pode ser ajustado."
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
              disabled={saving || !form.creditoId || !form.parcelaId}
            >
              {saving ? "A registar..." : "Registar Reembolso"}
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          label="Pesquisar por contrato, estado, criador, meio de pagamento, transação, referência ou observações"
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
          const estadoCredito = reembolso.credito?.estado;

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
                      {reembolso.credito?.numeroContrato || `Reembolso #${reembolso.id}`}
                    </Typography>

                    {estadoCredito && (
                      <Chip
                        label={estadoCredito}
                        color={estadoCredito === "ATIVO" ? "success" : "default"}
                        size="small"
                      />
                    )}
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Parcela:</strong> #{reembolso.parcela?.numeroParcela || "-"}
                  </Typography>

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
                  {reembolso.credito?.id && (
                    <Button
                      component={RouterLink}
                      to={`/backoffice/creditos/${reembolso.credito.id}`}
                      variant="outlined"
                    >
                      Ver Crédito
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