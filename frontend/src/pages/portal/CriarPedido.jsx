import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Paper,
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
    setSubmitting(true);

    try {
      await createMeuPedidoRequest(form);
      navigate("/portal/meus-pedidos");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao criar pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" mb={3}>
            Criar Pedido
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Pacote de Financiamento"
                  name="pacoteFinanciamento"
                  value={form.pacoteFinanciamento}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Finalidade"
                  name="finalidade"
                  multiline
                  minRows={3}
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

            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 3 }}
              disabled={submitting}
            >
              {submitting ? "A guardar..." : "Submeter Pedido"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}