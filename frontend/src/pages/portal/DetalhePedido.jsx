import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  CheckCircleOutline as CheckCircleIcon,
  Receipt as ReceiptIcon,
  UploadFile as UploadFileIcon,
} from "@mui/icons-material";
import {
  getMeuPedidoByIdRequest,
  uploadRequisitoDocumentoRequest,
  getMeusCreditosRequest,
  getMeuExtratoPedidoRequest,
} from "../../api/portal.api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../utils/formatters";

// ─── Painel de tab ────────────────────────────────────────────────────────────
function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box pt={3}>{children}</Box>;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DetalhePedido() {
  const { id } = useParams();

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [files, setFiles] = useState({});
  const [tab, setTab] = useState(0);

  // Extrato
  const [extrato, setExtrato] = useState(null);
  const [loadingExtrato, setLoadingExtrato] = useState(false);
  const [erroExtrato, setErroExtrato] = useState("");

  // Comprovativos — o pedido não tem o crédito embutido na resposta,
  // por isso vamos buscar aos meus créditos e filtrar pelo pedidoId.
  const [creditoDoPedido, setCreditoDoPedido] = useState(undefined); // undefined = ainda não procurado, null = não existe
  const [loadingCredito, setLoadingCredito] = useState(false);
  const [erroCredito, setErroCredito] = useState("");

  const carregarPedido = async () => {
    try {
      const data = await getMeuPedidoByIdRequest(id);
      setPedido(data);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao carregar pedido.");
    } finally {
      setLoading(false);
    }
  };

  const carregarExtrato = async () => {
    if (extrato) return; // já carregado
    try {
      setLoadingExtrato(true);
      setErroExtrato("");
      const data = await getMeuExtratoPedidoRequest(id);
      setExtrato(data);
    } catch (err) {
      console.error(err);
      setErroExtrato("Erro ao carregar extrato.");
    } finally {
      setLoadingExtrato(false);
    }
  };

  useEffect(() => {
    carregarPedido();
  }, [id]);

  // Carrega extrato só quando o user clica na tab
  useEffect(() => {
    if (tab === 3) carregarExtrato();
  }, [tab]);

  // Carrega o crédito deste pedido só quando o user clica na tab Comprovativos
  useEffect(() => {
    if (tab !== 2 || creditoDoPedido !== undefined) return;
    (async () => {
      try {
        setLoadingCredito(true);
        setErroCredito("");
        const creditos = await getMeusCreditosRequest();
        const encontrado = (creditos || []).find(
          (c) => String(c.pedidoId) === String(id)
        );
        setCreditoDoPedido(encontrado || null);
      } catch (err) {
        console.error(err);
        setErroCredito("Erro ao verificar o crédito deste pedido.");
      } finally {
        setLoadingCredito(false);
      }
    })();
  }, [tab, id, creditoDoPedido]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
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
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      {/* Cabeçalho */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Detalhe do Pedido
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visualize o estado e os detalhes do seu pedido.
          </Typography>
        </Box>

        {pedido && (
          <Chip
            label={getStatusLabel(pedido.status)}
            color={getStatusColor(pedido.status)}
            sx={{ fontWeight: 700, fontSize: "0.85rem", px: 1 }}
          />
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {pedido && (
        <>
          {/* Resumo rápido */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {pedido.numeroPedido}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Submetido em {formatDate(pedido.dataSubmissao)}
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" color="text.secondary">
                    Valor Solicitado
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a237e" }}>
                    {formatCurrency(pedido.valorSolicitado)}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>

          {/* Tabs */}
          <Paper sx={{ borderRadius: 3 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
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
            </Tabs>

            <Box sx={{ p: 3 }}>

              {/* ── Tab 0: Informação ─────────────────────────────────── */}
              <TabPanel value={tab} index={0}>
                <Stack spacing={1.5}>
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

                {pedido.aprovacoes?.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
                      Aprovações
                    </Typography>
                    <Stack spacing={2}>
                      {pedido.aprovacoes.map((item) => (
                        <Box key={item.id}>
                          <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                            <Typography sx={{ fontWeight: 600 }}>
                              Nível {item.nivel}
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
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(item.dataDecisao)}
                          </Typography>
                          <Divider sx={{ mt: 1.5 }} />
                        </Box>
                      ))}
                    </Stack>
                  </>
                )}
              </TabPanel>

              {/* ── Tab 1: Requisitos ─────────────────────────────────── */}
              <TabPanel value={tab} index={1}>
                {pedido.requisitosPedido?.length ? (
                  <Stack spacing={2}>
                    {pedido.requisitosPedido.map((item) => (
                      <Box key={item.id}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          mb={1}
                        >
                          <Typography sx={{ fontWeight: 600 }}>
                            {item.requisito?.nome || "Requisito"}
                          </Typography>
                          <Chip
                            label={item.estado || "-"}
                            size="small"
                            color={
                              item.estado === "APROVADO" ? "success" :
                              item.estado === "REJEITADO" ? "error" : "warning"
                            }
                          />
                        </Stack>

                        {item.observacoes && (
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            {item.observacoes}
                          </Typography>
                        )}

                        {item.estado !== "APROVADO" && (
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={1}>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                setFiles((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.files[0],
                                }))
                              }
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={async () => {
                                const ficheiro = files[item.id];
                                if (!ficheiro) {
                                  alert("Selecione um ficheiro.");
                                  return;
                                }
                                try {
                                  await uploadRequisitoDocumentoRequest(item.id, ficheiro);
                                  alert("Documento enviado com sucesso.");
                                  const data = await getMeuPedidoByIdRequest(id);
                                  setPedido(data);
                                } catch (err) {
                                  alert(err?.response?.data?.message || "Erro ao enviar documento.");
                                }
                              }}
                            >
                              Enviar Documento
                            </Button>
                          </Stack>
                        )}

                        {item.anexos?.length > 0 && (
                          <Box mt={2}>
                            <Typography variant="subtitle2" mb={0.5}>
                              Documentos enviados
                            </Typography>
                            {item.anexos.map((anexo) => (
                              <Typography key={anexo.id} variant="body2">
                                📄 {anexo.nome}
                              </Typography>
                            ))}
                          </Box>
                        )}

                        <Divider sx={{ mt: 2 }} />
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    Ainda não existem requisitos associados a este pedido.
                  </Typography>
                )}
              </TabPanel>

              {/* ── Tab 2: Comprovativos ──────────────────────────────── */}
              <TabPanel value={tab} index={2}>
                {loadingCredito ? (
                  <Stack direction="row" spacing={1} alignItems="center" py={2}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      A verificar o crédito deste pedido...
                    </Typography>
                  </Stack>
                ) : erroCredito ? (
                  <Alert severity="error">{erroCredito}</Alert>
                ) : creditoDoPedido ? (
                  <Stack spacing={2}>
                    <Typography color="text.secondary">
                      Este pedido já tem um crédito ativo. Envia o comprovativo
                      de pagamento de uma parcela na página de pagamento.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<UploadFileIcon />}
                      component={RouterLink}
                      to={`/portal/meus-creditos/${creditoDoPedido.id}/pagamento`}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Efetuar Pagamento
                    </Button>
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    Ainda não existe nenhum crédito associado a este pedido —
                    os comprovativos só podem ser enviados depois do
                    desembolso.
                  </Typography>
                )}
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
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
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

                    {desembolsosDoExtrato.length === 0 && reembolsosDoExtrato.length === 0 && (
                      <Typography color="text.secondary">
                        Ainda não existem movimentos financeiros neste pedido.
                      </Typography>
                    )}
                  </Stack>
                ) : null}
              </TabPanel>

            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}