import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { createMeuPedidoRequest } from "../../api/portal.api";

export default function CriarPedido() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    valorSolicitado: "",
    finalidade: "",
    pacoteFinanciamento: "",
    prazoAvaliacao: "",
    prazoValidacao: "",
    observacoes: "",
  });

  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
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
        ...form,
        valorSolicitado: Number(form.valorSolicitado),
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
    <Box>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" mb={1}>
          Criar Pedido
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Preencha os dados abaixo para submeter um novo pedido de crédito.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valor Solicitado"
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
                multiline
                minRows={4}
                value={form.finalidade}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prazo de Avaliação"
                name="prazoAvaliacao"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.prazoAvaliacao}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prazo de Validação"
                name="prazoValidacao"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.prazoValidacao}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                name="observacoes"
                multiline
                minRows={3}
                value={form.observacoes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
            >
              {submitting ? "A submeter..." : "Submeter Pedido"}
            </Button>
          </Box>
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