import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
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
import { CalculateOutlined as CalculateOutlinedIcon } from "@mui/icons-material";
import { createMeuPedidoRequest } from "../../api/portal.api";
import { simularCalculoCreditoRequest } from "../../api/public.api";

// Tempo de espera depois da última tecla antes de recalcular, evita um
// pedido à API a cada dígito escrito (ver nota no handleChange).
const DEBOUNCE_MS = 450;

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

  // Estado do simulador: calcula-se em /simulacao/calcular (não persiste
  // nada, ver simulacao.controller.js) enquanto o utilizador escreve.
  // Antes disto chamava /simulacao/simular (que grava uma linha na BD) a
  // cada tecla, o que enchia a tabela Simulacao de lixo sem necessidade.
  const [calculando, setCalculando] = useState(false);
  const [erroSimulacao, setErroSimulacao] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    // Limpa o timer pendente se o componente desmontar a meio da espera.
    return () => clearTimeout(debounceRef.current);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const novoForm = { ...form, [name]: value };
    setForm(novoForm);

    if (name === "valorSolicitado" || name === "prazo") {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        atualizarSimulacao(novoForm.valorSolicitado, novoForm.prazo);
      }, DEBOUNCE_MS);
    }
  };

  const atualizarSimulacao = async (valor, prazo) => {
    setErroSimulacao("");

    if (!valor || !prazo || Number(valor) <= 0 || Number(prazo) <= 0) {
      setForm((prev) => ({ ...prev, taxa: "", prestacao: "", jurosTotal: "", montanteTotal: "" }));
      return;
    }

    setCalculando(true);
    try {
      const resultado = await simularCalculoCreditoRequest({
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
    } catch (err) {
      console.error("Erro ao simular crédito:", err);
      setErroSimulacao("Não foi possível calcular a simulação. Tenta novamente.");
    } finally {
      setCalculando(false);
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
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Simulador: recalcula sozinho enquanto o valor/prazo acima
              mudam (ver atualizarSimulacao). Rotulado explicitamente para
              ficar claro que isto é o simulador, e não só campos soltos. */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <CalculateOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Simulação
            </Typography>
            {calculando && <CircularProgress size={16} />}
          </Stack>

          {erroSimulacao && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {erroSimulacao}
            </Alert>
          )}

          {!form.prestacao && !calculando && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Preenche o valor e o prazo acima para veres a estimativa da prestação.
            </Typography>
          )}

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Taxa Estimada (% a.a.)"
                name="taxa"
                value={form.taxa}
                InputProps={{ readOnly: true }}
                helperText="Definida na aprovação, dentro da faixa da financeira."
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Prestação Mensal"
                name="prestacao"
                value={form.prestacao}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Juros Totais"
                value={form.jurosTotal}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Montante Total"
                name="montanteTotal"
                value={form.montanteTotal}
                InputProps={{ readOnly: true }}
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
