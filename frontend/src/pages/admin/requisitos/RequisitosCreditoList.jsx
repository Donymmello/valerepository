import { useEffect, useState } from "react";
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
  Switch,
  TextField,
  Typography,
  FormControlLabel,
} from "@mui/material";
import {
  createRequisitoRequest,
  getAllRequisitosRequest,
  updateRequisitoRequest,
} from "../../../api/admin.api";
import { useAuth } from "../../../context/useAuth";

export default function RequisitosCreditoList() {
  const { user } = useAuth();

  const [requisitos, setRequisitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEditId, setSavingEditId] = useState(null);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    nome: "",
    descricao: "",
    obrigatorio: true,
    ativo: true,
  });

  const [editForms, setEditForms] = useState({});

  const podeGerir = ["ADMIN", "GESTOR"].includes(user?.role);

  const carregarRequisitos = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllRequisitosRequest();
      const lista = Array.isArray(data) ? data : [];

      setRequisitos(lista);

      const forms = {};
      lista.forEach((item) => {
        forms[item.id] = {
          nome: item.nome || "",
          descricao: item.descricao || "",
          obrigatorio: item.obrigatorio !== undefined ? item.obrigatorio : true,
          ativo: item.ativo !== undefined ? item.ativo : true,
        };
      });

      setEditForms(forms);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao carregar requisitos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarRequisitos();
  }, []);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;

    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateSwitch = (name) => (event) => {
    setCreateForm((prev) => ({
      ...prev,
      [name]: event.target.checked,
    }));
  };

  const handleCriar = async () => {
    if (!createForm.nome.trim()) {
      setError("O nome do requisito é obrigatório.");
      return;
    }

    try {
      setSavingCreate(true);
      setError("");

      await createRequisitoRequest({
        nome: createForm.nome.trim(),
        descricao: createForm.descricao || null,
        obrigatorio: createForm.obrigatorio,
        ativo: createForm.ativo,
      });

      setCreateForm({
        nome: "",
        descricao: "",
        obrigatorio: true,
        ativo: true,
      });

      setSuccessOpen(true);
      await carregarRequisitos();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao criar requisito.");
    } finally {
      setSavingCreate(false);
    }
  };

  const handleEditChange = (id, field, value) => {
    setEditForms((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleEditSwitch = (id, field) => (event) => {
    setEditForms((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: event.target.checked,
      },
    }));
  };

  const handleGuardarEdicao = async (id) => {
    const form = editForms[id];

    if (!form?.nome?.trim()) {
      setError("O nome do requisito é obrigatório.");
      return;
    }

    try {
      setSavingEditId(id);
      setError("");

      await updateRequisitoRequest(id, {
        nome: form.nome.trim(),
        descricao: form.descricao || null,
        obrigatorio: form.obrigatorio,
        ativo: form.ativo,
      });

      setSuccessOpen(true);
      await carregarRequisitos();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao atualizar requisito.");
    } finally {
      setSavingEditId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700 }} mb={1}>
        Requisitos de Crédito
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Gira o catálogo de requisitos utilizados nos pedidos de crédito.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {podeGerir && (
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
            Novo Requisito
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Nome"
              name="nome"
              value={createForm.nome}
              onChange={handleCreateChange}
            />

            <TextField
              fullWidth
              label="Descrição"
              name="descricao"
              multiline
              minRows={3}
              value={createForm.descricao}
              onChange={handleCreateChange}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={createForm.obrigatorio}
                    onChange={handleCreateSwitch("obrigatorio")}
                  />
                }
                label="Obrigatório"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={createForm.ativo}
                    onChange={handleCreateSwitch("ativo")}
                  />
                }
                label="Ativo"
              />
            </Stack>

            <Box>
              <Button
                variant="contained"
                onClick={handleCriar}
                disabled={savingCreate}
              >
                {savingCreate ? "A guardar..." : "Criar Requisito"}
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}

      {requisitos.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography color="text.secondary">
            Ainda não existem requisitos cadastrados.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {requisitos.map((item) => {
            const form = editForms[item.id] || {
              nome: item.nome || "",
              descricao: item.descricao || "",
              obrigatorio: item.obrigatorio ?? true,
              ativo: item.ativo ?? true,
            };

            return (
              <Paper key={item.id} sx={{ p: 3, borderRadius: 3 }}>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {item.nome}
                    </Typography>

                    <Chip
                      size="small"
                      label={item.obrigatorio ? "Obrigatório" : "Opcional"}
                      color={item.obrigatorio ? "warning" : "default"}
                    />

                    <Chip
                      size="small"
                      label={item.ativo ? "Ativo" : "Inativo"}
                      color={item.ativo ? "success" : "default"}
                      variant="outlined"
                    />
                  </Stack>

                  {podeGerir ? (
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Nome"
                        value={form.nome}
                        onChange={(e) =>
                          handleEditChange(item.id, "nome", e.target.value)
                        }
                      />

                      <TextField
                        fullWidth
                        label="Descrição"
                        multiline
                        minRows={3}
                        value={form.descricao}
                        onChange={(e) =>
                          handleEditChange(item.id, "descricao", e.target.value)
                        }
                      />

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!form.obrigatorio}
                              onChange={handleEditSwitch(item.id, "obrigatorio")}
                            />
                          }
                          label="Obrigatório"
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!form.ativo}
                              onChange={handleEditSwitch(item.id, "ativo")}
                            />
                          }
                          label="Ativo"
                        />
                      </Stack>

                      <Box>
                        <Button
                          variant="contained"
                          onClick={() => handleGuardarEdicao(item.id)}
                          disabled={savingEditId === item.id}
                        >
                          {savingEditId === item.id
                            ? "A guardar..."
                            : "Guardar Alterações"}
                        </Button>
                      </Box>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {item.descricao || "-"}
                    </Typography>
                  )}
                </Stack>
              </Paper>
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
    </Box>
  );
}