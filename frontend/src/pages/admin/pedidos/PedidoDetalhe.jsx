import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  CheckCircleOutline as CheckCircleIcon,
  Gavel as GavelIcon,
  Receipt as ReceiptIcon,
  UploadFile as UploadFileIcon,
} from "@mui/icons-material";
import {
  decidirAprovacaoRequest,
  getAprovacoesByPedidoRequest,
  getExtratoPedidoInternoRequest,
  getPedidoByIdRequest,
} from "../../../api/admin.api";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { useAuth } from "../../../context/useAuth";
import PedidoRequisitosSection from "../../../pages/admin/pedidos/PedidoRequisitosSection";
import ComprovativoBackofficeSection from "../../../pages/admin/ComprovativoBackofficeSection";
import PageHeader from "../../../components/common/PageHeader";
import LoadingState from "../../../components/common/LoadingState";
import StatusChip from "../../../components/common/StatusChip";

// ─── Painel de tab ────────────────────────────────────────────────────────────
function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box pt={3}>{children}</Box>;
}

export default function PedidoDetalhe() {
  const { id } = useParams();
  const { user } = useAuth();

  const [pedido, setPedido] = useState(null);
  const [aprovacoes, setAprovacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [tab, setTab] = useState(0);

  // Extrato
  const [extrato, setExtrato] = useState(null);
  const [loadingExtrato, setLoadingExtrato] = useState(false);
  const [erroExtrato, setErroExtrato] = useState("");

  const [form, setForm] = useState({
    nivel: "",
    decisao: "",
    comentario: "",
    taxaFinal: "",
  });

  // Aprovação de nível 1 é a etapa de análise de risco (ANALISTA,
  // ou GESTOR/ADMIN a agir nessa etapa): é aqui que a taxa de juros é
  // definida, dentro da faixa da empresa. Os níveis 2 e 3 (GESTOR,
  // DIRETOR/ADMIN) só confirmam ou rejeitam — não têm autoridade para
  // redefinir a taxa já fixada no nível 1.
  const definindoTaxaNestaEtapa = Number(form.nivel) === 1 && form.decisao === "APROVADO";

  const podeDecidir = ["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"].includes(user?.role);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError("");

      const [pedidoData, aprovacoesData] = await Promise.all([
        getPedidoByIdRequest(id),
        getAprovacoesByPedidoRequest(id),
      ]);

      setPedido(pedidoData);
      setAprovacoes(
        Array.isArray(aprovacoesData?.aprovacoes) ? aprovacoesData.aprovacoes : []
      );
      setForm((prev) => ({
        ...prev,
        nivel: String(pedidoData?.etapaAtual || ""),
      }));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao carregar detalhe do pedido.");
    } finally {
      setLoading(false);
    }
  };

  const carregarExtrato = async () => {
    if (extrato) return;
    try {
      setLoadingExtrato(true);
      setErroExtrato("");
      const data = await getExtratoPedidoInternoRequest(id);
      setExtrato(data);
    } catch (err) {
      console.error(err);
      setErroExtrato("Erro ao carregar extrato.");
    } finally {
      setLoadingExtrato(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [id]);

  useEffect(() => {
    if (tab === 3) carregarExtrato();
  }, [tab]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleDecidir = async () => {
    setError("");

    if (!form.nivel) { setError("O nível é obrigatório."); return; }
    if (!form.decisao) { setError("Selecione a decisão."); return; }
    if (definindoTaxaNestaEtapa && !form.taxaFinal) { setError("A taxa de juros é obrigatória para aprovar nesta etapa."); return; }

    setActionLoading(true);

    try {
      await decidirAprovacaoRequest(id, {
        nivel: Number(form.nivel),
        decisao: form.decisao,
        comentario: form.comentario,
        ...(definindoTaxaNestaEtapa ? { taxaFinal: Number(form.taxaFinal) } : {}),
      });

      setSuccessOpen(true);
      setForm((prev) => ({ ...prev, decisao: "", comentario: "", taxaFinal: "" }));
      await carregarDados();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao registar decisão de aprovação.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  // O extrato devolve { pedido, resumoFinanceiro }, não campos soltos de
  // desembolsos/reembolsos no topo — os reembolsos, em particular, só
  // existem aninhados em pedido.creditos[].reembolsos (Reembolso não se
  // liga diretamente a PedidoCredito).
  const desembolsosDoExtrato = extrato?.pedido?.desembolsos || [];
  const reembolsosDoExtrato = (extrato?.pedido?.creditos || []).flatMap(
    (c) => c.reembolsos || []
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      {/* Cabeçalho */}
      <PageHeader
        title="Detalhe do Pedido"
        subtitle="Visualização interna e decisão do pedido de crédito."
        actions={
          pedido && (
            <StatusChip
              status={pedido.status}
              size="medium"
              sx={{ fontWeight: 700, fontSize: "0.85rem", px: 1 }}
            />
          )
        }
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {pedido && (
        <>
          {/* Resumo rápido */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {pedido.numeroPedido}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {pedido.mutuario?.nomeCompleto || "—"} · Submetido em {formatDate(pedido.dataSubmissao)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: { md: "right" } }}>
                <Typography variant="caption" color="text.secondary">
                  Valor Solicitado
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a237e" }}>
                  {formatCurrency(pedido.valorSolicitado)}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Tabs */}
          <Paper sx={{ borderRadius: 3 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 2,
                borderBottom: "1px solid #e0e0e0",
                "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 56 },
              }}
            >
              <Tab icon={<AssignmentIcon fontSize="small" />} iconPosition="start" label="Informação" />
              <Tab icon={<CheckCircleIcon fontSize="small" />} iconPosition="start" label="Requisitos" />
              <Tab icon={<UploadFileIcon fontSize="small" />} iconPosition="start" label="Comprovativos" />
              <Tab icon={<ReceiptIcon fontSize="small" />} iconPosition="start" label="Extrato" />
              {podeDecidir && (
                <Tab icon={<GavelIcon fontSize="small" />} iconPosition="start" label="Decisão" />
              )}
            </Tabs>

            <Box sx={{ p: 3 }}>

              {/* ── Tab 0: Informação ─────────────────────────────────── */}
              <TabPanel value={tab} index={0}>
                <Stack spacing={1.5} mb={3}>
                  <Typography>
                    <strong>Mutuário:</strong> {pedido.mutuario?.nomeCompleto || "-"}
                  </Typography>
                  <Typography>
                    <strong>Finalidade:</strong> {pedido.finalidade || "-"}
                  </Typography>
                  <Typography>
                    <strong>Pacote de Financiamento:</strong> {pedido.pacoteFinanciamento || "-"}
                  </Typography>
                  <Typography>
                    <strong>Etapa Atual:</strong> {pedido.etapaAtual || "-"}
                  </Typography>
                  <Typography>
                    <strong>Prazo de Avaliação:</strong> {formatDate(pedido.prazoAvaliacao)}
                  </Typography>
                  <Typography>
                    <strong>Prazo de Validação:</strong> {formatDate(pedido.prazoValidacao)}
                  </Typography>
                  <Typography>
                    <strong>Observações:</strong> {pedido.observacoes || "-"}
                  </Typography>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
                  Histórico de Aprovações
                </Typography>

                {aprovacoes.length ? (
                  <Stack spacing={2}>
                    {aprovacoes.map((item) => (
                      <Box key={item.id}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                          <Typography sx={{ fontWeight: 600 }}>
                            Nível {item.nivel || "-"}
                          </Typography>
                          <Chip
                            label={item.decisao || "Pendente"}
                            size="small"
                            color={
                              item.decisao === "APROVADO" ? "success" :
                              item.decisao === "REJEITADO" ? "error" : "warning"
                            }
                          />
                        </Stack>
                        {item.comentario && (
                          <Typography variant="body2" color="text.secondary">
                            {item.comentario}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          Aprovador: {item.aprovador?.nome || "-"} · {formatDate(item.dataDecisao)}
                        </Typography>
                        <Divider sx={{ mt: 1.5 }} />
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    Ainda não existem aprovações registadas.
                  </Typography>
                )}
              </TabPanel>

              {/* ── Tab 1: Requisitos ─────────────────────────────────── */}
              <TabPanel value={tab} index={1}>
                <PedidoRequisitosSection
                  pedidoId={id}
                  pedidoStatus={pedido?.status}
                  onUpdated={carregarDados}
                />
              </TabPanel>

              {/* ── Tab 2: Comprovativos ──────────────────────────────── */}
              <TabPanel value={tab} index={2}>
                <ComprovativoBackofficeSection
                  pedidoId={id}
                  onUpdated={carregarDados}
                />
              </TabPanel>

              {/* ── Tab 3: Extrato ────────────────────────────────────── */}
              <TabPanel value={tab} index={3}>
                {loadingExtrato ? (
                  <Stack direction="row" spacing={1} alignItems="center" py={2}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      A carregar extrato...
                    </Typography>
                  </Stack>
                ) : erroExtrato ? (
                  <Alert severity="error">{erroExtrato}</Alert>
                ) : extrato ? (
                  <Stack spacing={3}>
                    {/* Resumo financeiro */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Total Desembolsado
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#0369a1" }}>
                          {formatCurrency(extrato.resumoFinanceiro?.totalDesembolsado)}
                        </Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Total Reembolsado
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#15803d" }}>
                          {formatCurrency(extrato.resumoFinanceiro?.totalReembolsado)}
                        </Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Saldo em Aberto
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#b45309" }}>
                          {formatCurrency(extrato.resumoFinanceiro?.saldoEmDivida)}
                        </Typography>
                      </Paper>
                    </Stack>

                    {/* Desembolsos */}
                    {desembolsosDoExtrato.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }} mb={1.5}>
                          Desembolsos
                        </Typography>
                        <Stack spacing={1}>
                          {desembolsosDoExtrato.map((d) => (
                            <Paper key={d.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                              <Stack direction="row" justifyContent="space-between">
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0369a1" }}>
                                    {formatCurrency(d.valorDesembolsado)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {d.meioPagamento} · {formatDate(d.dataDesembolso)}
                                  </Typography>
                                </Box>
                                {d.referencia && (
                                  <Typography variant="caption" color="text.secondary">
                                    Ref: {d.referencia}
                                  </Typography>
                                )}
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Reembolsos */}
                    {reembolsosDoExtrato.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }} mb={1.5}>
                          Reembolsos
                        </Typography>
                        <Stack spacing={1}>
                          {reembolsosDoExtrato.map((r) => (
                            <Paper key={r.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                              <Stack direction="row" justifyContent="space-between">
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#15803d" }}>
                                    {formatCurrency(r.valorReembolsado)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {r.meioPagamento} · {formatDate(r.dataReembolso)}
                                  </Typography>
                                </Box>
                                {r.referencia && (
                                  <Typography variant="caption" color="text.secondary">
                                    Ref: {r.referencia}
                                  </Typography>
                                )}
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {!desembolsosDoExtrato.length && !reembolsosDoExtrato.length && (
                      <Typography color="text.secondary">
                        Ainda não existem movimentos financeiros neste pedido.
                      </Typography>
                    )}
                  </Stack>
                ) : null}
              </TabPanel>

              {/* ── Tab 4: Decisão (só para quem pode decidir) ───────── */}
              {podeDecidir && (
                <TabPanel value={tab} index={4}>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      label="Nível"
                      name="nivel"
                      value={form.nivel}
                      onChange={handleChange}
                      type="number"
                      InputProps={{ readOnly: true }}
                      helperText="Este valor segue a etapa actual do pedido."
                    />

                    <TextField
                      select
                      fullWidth
                      label="Decisão"
                      name="decisao"
                      value={form.decisao}
                      onChange={handleChange}
                    >
                      <MenuItem value="">Selecionar</MenuItem>
                      <MenuItem value="APROVADO">Aprovar</MenuItem>
                      <MenuItem value="REJEITADO">Rejeitar</MenuItem>
                    </TextField>

                    {definindoTaxaNestaEtapa && (
                      <TextField
                        fullWidth
                        label="Taxa de Juros (%)"
                        name="taxaFinal"
                        type="number"
                        inputProps={{ step: "0.01", min: 0 }}
                        value={form.taxaFinal}
                        onChange={handleChange}
                        helperText="Define a taxa deste pedido com base na análise de risco, dentro da faixa em Configurações > Empresa. Os níveis seguintes já não podem alterá-la."
                      />
                    )}

                    <TextField
                      fullWidth
                      label="Comentário"
                      name="comentario"
                      multiline
                      minRows={4}
                      value={form.comentario}
                      onChange={handleChange}
                    />

                    <Box>
                      <Button
                        variant="contained"
                        onClick={handleDecidir}
                        disabled={actionLoading}
                        size="large"
                        sx={{ borderRadius: 2, px: 4 }}
                      >
                        {actionLoading ? "A guardar..." : "Guardar Decisão"}
                      </Button>
                    </Box>
                  </Stack>
                </TabPanel>
              )}

            </Box>
          </Paper>
        </>
      )}

      <Snackbar
        open={successOpen}
        autoHideDuration={1500}
        onClose={() => setSuccessOpen(false)}
        message="Decisão registada com sucesso."
      />
    </Box>
  );
}