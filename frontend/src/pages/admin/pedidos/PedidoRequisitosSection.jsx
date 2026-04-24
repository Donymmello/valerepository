import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  adicionarPedidoRequisitoRequest,
  getAllRequisitosRequest,
  getRequisitosByPedidoRequest,
  validarRequisitoPedidoRequest,
} from "../../../api/admin.api";
import { useAuth } from "../../../context/AuthContext";
import { formatDate } from "../../../utils/formatters";

function getEstadoColor(estado) {
  switch (estado) {
    case "APROVADO":
      return "success";
    case "REJEITADO":
      return "error";
    case "PENDENTE":
    default:
      return "warning";
  }
}

export default function PedidoRequisitosSection({ pedidoId, pedidoStatus, onUpdated }) {
  const { user } = useAuth();

  const [requisitosPedido, setRequisitosPedido] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingAdd, setSavingAdd] = useState(false);
  const [savingValidacaoId, setSavingValidacaoId] = useState(null);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  const [addForm, setAddForm] = useState({
    requisitoId: "",
    observacoes: "",
  });

  const [validacaoForms, setValidacaoForms] = useState({});

  const podeAdicionar = ["ADMIN", "GESTOR"].includes(user?.role);
  const podeValidar = ["ADMIN", "GESTOR", "ANALISTA"].includes(user?.role);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError("");

      const [resPedido, resCatalogo] = await Promise.all([
        getRequisitosByPedidoRequest(pedidoId),
        getAllRequisitosRequest(),
      ]);

      const requisitos = Array.isArray(resPedido?.requisitos) ? resPedido.requisitos : [];
      const catalogoData = Array.isArray(resCatalogo) ? resCatalogo : [];

      setRequisitosPedido(requisitos);
      setCatalogo(catalogoData);

      const forms = {};
      requisitos.forEach((item) => {
        forms[item.id] = {
          estado: item.estado || "PENDENTE",
          observacoes: item.observacoes || "",
        };
      });
      setValidacaoForms(forms);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao carregar requisitos do pedido.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pedidoId) {
      carregarDados();
    }
  }, [pedidoId]);

  const requisitosDisponiveis = useMemo(() => {
    const usados = new Set(
      requisitosPedido.map((item) => String(item.requisitoId))
    );

    return catalogo.filter((req) => !usados.has(String(req.id)));
  }, [catalogo, requisitosPedido]);

  const handleAddChange = (event) => {
    const { name, value } = event.target;
    setAddForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdicionar = async () => {
    if (!addForm.requisitoId) {
      setError("Selecione um requisito.");
      return;
    }

    try {
      setSavingAdd(true);
      setError("");

      await adicionarPedidoRequisitoRequest(pedidoId, {
        requisitoId: Number(addForm.requisitoId),
        observacoes: addForm.observacoes || null,
      });

      setAddForm({
        requisitoId: "",
        observacoes: "",
      });

      setSuccessOpen(true);
      await carregarDados();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao adicionar requisito ao pedido.");
    } finally {
      setSavingAdd(false);
    }
  };

  const handleValidacaoFormChange = (id, field, value) => {
    setValidacaoForms((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleValidar = async (itemId) => {
    const form = validacaoForms[itemId];

    if (!form?.estado) {
      setError("Selecione um estado para validação.");
      return;
    }

    try {
      setSavingValidacaoId(itemId);
      setError("");

      await validarRequisitoPedidoRequest(itemId, {
        estado: form.estado,
        observacoes: form.observacoes,
      });

      setSuccessOpen(true);
      await carregarDados();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao validar requisito do pedido.");
    } finally {
      setSavingValidacaoId(null);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography color="text.secondary">A carregar requisitos...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
        Requisitos do Pedido
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Associe e valide os requisitos necessários para este pedido.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {podeAdicionar && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} mb={2}>
            Adicionar Requisito
          </Typography>

          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              label="Requisito"
              name="requisitoId"
              value={addForm.requisitoId}
              onChange={handleAddChange}
            >
              <MenuItem value="">Selecionar</MenuItem>
              {requisitosDisponiveis.map((req) => (
                <MenuItem key={req.id} value={req.id}>
                  {req.nome} {req.obrigatorio ? "(Obrigatório)" : "(Opcional)"}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Observações"
              name="observacoes"
              multiline
              minRows={3}
              value={addForm.observacoes}
              onChange={handleAddChange}
            />

            <Box>
              <Button
                variant="contained"
                onClick={handleAdicionar}
                disabled={savingAdd}
              >
                {savingAdd ? "A adicionar..." : "Adicionar Requisito"}
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}

      {requisitosPedido.length === 0 ? (
        <Typography color="text.secondary">
          Ainda não existem requisitos associados a este pedido.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {requisitosPedido.map((item) => {
            const form = validacaoForms[item.id] || {
              estado: item.estado || "PENDENTE",
              observacoes: item.observacoes || "",
            };

            return (
              <Box key={item.id}>
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {item.requisito?.nome || `Requisito #${item.requisitoId}`}
                    </Typography>

                    <Chip
                      size="small"
                      label={item.estado || "PENDENTE"}
                      color={getEstadoColor(item.estado)}
                    />

                    {item.requisito?.obrigatorio && (
                      <Chip size="small" label="Obrigatório" variant="outlined" />
                    )}
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Descrição:</strong> {item.requisito?.descricao || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Observações:</strong> {item.observacoes || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Data de validação:</strong> {formatDate(item.dataValidacao)}
                  </Typography>

                  {podeValidar && (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} mb={2}>
                        Validar requisito
                      </Typography>

                      <Stack spacing={2}>
                        <TextField
                          select
                          fullWidth
                          label="Estado"
                          value={form.estado}
                          onChange={(e) =>
                            handleValidacaoFormChange(item.id, "estado", e.target.value)
                          }
                        >
                          <MenuItem value="PENDENTE">PENDENTE</MenuItem>
                          <MenuItem value="APROVADO">APROVADO</MenuItem>
                          <MenuItem value="REJEITADO">REJEITADO</MenuItem>
                        </TextField>

                        <TextField
                          fullWidth
                          label="Observações"
                          multiline
                          minRows={3}
                          value={form.observacoes}
                          onChange={(e) =>
                            handleValidacaoFormChange(
                              item.id,
                              "observacoes",
                              e.target.value
                            )
                          }
                        />

                        <Box>
                          <Button
                            variant="contained"
                            onClick={() => handleValidar(item.id)}
                            disabled={savingValidacaoId === item.id}
                          >
                            {savingValidacaoId === item.id
                              ? "A guardar..."
                              : "Guardar Validação"}
                          </Button>
                        </Box>
                      </Stack>
                    </Paper>
                  )}
                </Stack>

                <Divider sx={{ mt: 2 }} />
              </Box>
            );
          })}
        </Stack>
      )}

      <Snackbar
        open={successOpen}
        autoHideDuration={1800}
        onClose={() => setSuccessOpen(false)}
        message="Operação realizada com sucesso."
      />
    </Paper>
  );
}