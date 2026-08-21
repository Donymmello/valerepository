import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CalculateOutlined as CalculateOutlinedIcon, Close as CloseIcon } from "@mui/icons-material";
import { createMeuPedidoRequest } from "../../api/portal.api";
import {
  getMinhasSimulacoesRequest,
  simularCreditoRequest,
} from "../../api/public.api";

export default function CriarPedido() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    valorSolicitado: "",
    finalidade: "",
    pacoteFinanciamento: "",
    prazo: "",

    taxa: "",
    prestacao: "",
    jurosTotal: "",
    montanteTotal: "",

    observacoes: "",
  });

  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Simulação mais recente do user, usada para pré-preencher o formulário
  const [simulacao, setSimulacao] = useState(null);
  const [loadingSimulacao, setLoadingSimulacao] = useState(true);
  const [simulacaoDescartada, setSimulacaoDescartada] = useState(false);

  useEffect(() => {
    const carregarUltimaSimulacao = async () => {
      try {
        const simulacoes = await getMinhasSimulacoesRequest();

        if (Array.isArray(simulacoes) && simulacoes.length > 0) {
          // a API já devolve ordenado por created_at DESC, mas garantimos aqui também
          const maisRecente = simulacoes[0];
          setSimulacao(maisRecente);

          setForm((prev) => ({
            ...prev,
            valorSolicitado: String(maisRecente.valorSolicitado),
            prazo: String(maisRecente.prazo),
            taxa: Number(maisRecente.taxa).toFixed(2),
            prestacao: Number(maisRecente.prestacao).toFixed(2),
            jurosTotal: Number(maisRecente.jurosTotal).toFixed(2),
            montanteTotal: Number(maisRecente.montanteTotal).toFixed(2),
          }));
        }
      } catch (err) {
        // Não é crítico: se falhar, o user simplesmente preenche manualmente
        console.error("Erro ao carregar simulação recente:", err);
      } finally {
        setLoadingSimulacao(false);
      }
    };

    carregarUltimaSimulacao();
  }, []);

  const handleChange = async (event) => {
    const { name, value } = event.target;

    const novoForm = {
      ...form,
      [name]: value,
    };

    setForm(novoForm);

    if (name === "valorSolicitado" || name === "prazo") {
      await atualizarSimulacao(
        name === "valorSolicitado"
          ? value
          : novoForm.valorSolicitado,

        name === "prazo"
          ? value
          : novoForm.prazo
      );
    }
  };

  const handleDescartarSimulacao = () => {
  setSimulacao(null);
  setSimulacaoDescartada(true);

  setForm((prev) => ({
    ...prev,
    valorSolicitado: "",
    prazo: "",
    taxa: "",
    prestacao: "",
    jurosTotal: "",
    montanteTotal: "",
  }));
};

  const atualizarSimulacao = async (valor, prazo) => {
    if (!valor || !prazo) return;

    if (Number(valor) <= 0 || Number(prazo) <= 0) return;

    try {
      const resultado = await simularCreditoRequest({
        valorSolicitado: Number(valor),
        prazo: Number(prazo),
      });

      setForm((prev) => ({
        ...prev,
        taxa: Number(resultado.taxa).toFixed(2),
        prestacao: Number(resultado.prestacao).toFixed(2),
        jurosTotal: Number(resultado.jurosTotal).toFixed(2),
        montanteTotal: Number(resultado.montanteTotal).toFixed(2),
      }));
    } catch (error) {
      console.error("Erro ao recalcular simulação:", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.valorSolicitado || Number(form.valorSolicitado) <= 0) {
      setError("Informe um valor solicitado válido.");
      return;
    }

    if (!form.finalidade.trim()) {
      setError("A finalidade do pedido é obrigatória.");
      return;
    }

    setSubmitting(true);

    try {
      await createMeuPedidoRequest({
        valorSolicitado: Number(form.valorSolicitado),
        prazo: Number(form.prazo),
        finalidade: form.finalidade,
        pacoteFinanciamento: form.pacoteFinanciamento || null,
        observacoes: form.observacoes || null,
      });

      setSuccessOpen(true);

      setTimeout(() => {
        navigate("/portal/meus-pedidos");
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao criar pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  const mostrarResumoSimulacao =
    !loadingSimulacao && simulacao && !simulacaoDescartada;

  return (
    <Box sx={{ maxWidth: 820, mx: "auto" }}>
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} mb={0.5}>
          Criar Pedido de Crédito
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Preencha os dados abaixo para submeter um novo pedido.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        A taxa de juros apresentada abaixo é uma estimativa. A taxa final do seu crédito é definida na aprovação, e pode variar consoante o seu histórico e a avaliação de risco.
      </Alert>

      {loadingSimulacao && (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            A verificar simulações recentes...
          </Typography>
        </Stack>
      )}

      {mostrarResumoSimulacao && (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            borderColor: "success.light",
            bgcolor: "success.50",
            position: "relative",
          }}
        >
          <Button
            size="small"
            onClick={handleDescartarSimulacao}
            startIcon={<CloseIcon fontSize="small" />}
            sx={{ position: "absolute", top: 8, right: 8 }}
            color="inherit"
          >
            Ignorar
          </Button>

          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <CalculateOutlinedIcon color="success" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Baseado na sua simulação
            </Typography>
            <Chip label="Pré-preenchido" size="small" color="success" variant="outlined" />
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={6} sm={2.4}>
              <Typography variant="caption" color="text.secondary">
                Valor
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                MZN {Number(simulacao.valorSolicitado).toLocaleString()}
              </Typography>
            </Grid>

            <Grid item xs={6} sm={2.4}>
              <Typography variant="caption" color="text.secondary">
                Prazo
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {simulacao.prazo} meses
              </Typography>
            </Grid>

            <Grid item xs={6} sm={2.4}>
              <Typography variant="caption" color="text.secondary">
                Taxa Estimada
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {Number(simulacao.taxa).toFixed(2)}% a.a.
              </Typography>
            </Grid>

            <Grid item xs={6} sm={2.4}>
              <Typography variant="caption" color="text.secondary">
                Prestação Mensal
              </Typography>
              <Typography sx={{ fontWeight: 700, color: "success.dark" }}>
                MZN {Number(simulacao.prestacao).toFixed(2)}
              </Typography>
            </Grid>

            <Grid item xs={6} sm={2.4}>
              <Typography variant="caption" color="text.secondary">
                Total a Pagar
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                MZN {Number(simulacao.montanteTotal).toFixed(2)}
              </Typography>
            </Grid>
          </Grid>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
            O valor solicitado abaixo foi preenchido automaticamente. Pode ajustá-lo se necessário. A taxa apresentada é uma estimativa — pode variar na aprovação final, consoante o histórico e a avaliação de risco (ver aviso abaixo).
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valor Solicitado (MZN)"
                name="valorSolicitado"
                type="number"
                value={form.valorSolicitado}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Pacote de Financiamento"
                name="pacoteFinanciamento"
                value={form.pacoteFinanciamento}
                onChange={handleChange}
              >
                <MenuItem value="">Selecionar</MenuItem>
                <MenuItem value="Agricultura">Agricultura</MenuItem>
                <MenuItem value="Comércio">Comércio</MenuItem>
                <MenuItem value="Serviços">Serviços</MenuItem>
                <MenuItem value="Habitação">Habitação</MenuItem>
                <MenuItem value="Educação">Educação</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Finalidade"
                name="finalidade"
                placeholder="Para que pretende utilizar este crédito?"
                multiline
                minRows={4}
                value={form.finalidade}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Prazo (Meses)"
                name="prazo"
                type="number"
                value={form.prazo}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Taxa Estimada (% a.a.)"
                name="taxa"
                value={form.taxa}
                InputProps={{
                  readOnly: true,
                }}
                helperText="Estimativa — a taxa final é decidida na aprovação, dentro da faixa praticada pela financeira."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Prestação Mensal"
                name="prestacao"
                value={form.prestacao}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Juros Totais"
                value={form.jurosTotal}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Montante Total"
                name="montanteTotal"
                value={form.montanteTotal}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações (opcional)"
                name="observacoes"
                multiline
                minRows={3}
                value={form.observacoes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button
              variant="text"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{ borderRadius: 2, px: 4 }}
            >
              {submitting ? "A submeter..." : "Submeter Pedido"}
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Snackbar
        open={successOpen}
        autoHideDuration={1200}
        onClose={() => setSuccessOpen(false)}
        message="Pedido submetido com sucesso."
      />
    </Box>
  );
}
