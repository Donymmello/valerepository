import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  getExtratoPedidoInternoRequest,
  exportarExtratoPedidoPdfRequest,
  exportarComprovativoDesembolsoPdfRequest,
  exportarComprovativoReembolsoPdfRequest,
} from "../../../api/admin.api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../../utils/formatters";

export default function ExtratoPedidoInterno() {
  const { id } = useParams();

  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const carregarExtrato = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getExtratoPedidoInternoRequest(id);
        setDados(data);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Erro ao carregar extrato.");
      } finally {
        setLoading(false);
      }
    };

    carregarExtrato();
  }, [id]);

  const baixarFicheiro = (blob, nomeFicheiro) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeFicheiro;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportarExtratoPdf = async () => {
    try {
      const blob = await exportarExtratoPedidoPdfRequest(id);
      baixarFicheiro(blob, `extrato_pedido_${id}.pdf`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao exportar extrato em PDF.");
    }
  };

  const handleComprovativoDesembolso = async (desembolsoId) => {
    try {
      const blob = await exportarComprovativoDesembolsoPdfRequest(desembolsoId);
      baixarFicheiro(blob, `comprovativo_desembolso_${desembolsoId}.pdf`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao gerar comprovativo.");
    }
  };

  const handleComprovativoReembolso = async (reembolsoId) => {
    try {
      const blob = await exportarComprovativoReembolsoPdfRequest(reembolsoId);
      baixarFicheiro(blob, `comprovativo_reembolso_${reembolsoId}.pdf`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao gerar comprovativo.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const creditos = dados?.pedido?.creditos || [];
  const reembolsos = creditos.flatMap((c) => c.reembolsos || []);

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "flex-start" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} mb={1}>
            Extrato do Pedido
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Consulta interna do resumo financeiro e dos movimentos do pedido.
          </Typography>
        </Box>

        <Button variant="outlined" onClick={handleExportarExtratoPdf}>
          Exportar PDF
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {dados && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={2}
              mb={2}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {dados.pedido?.numeroPedido || "-"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Finalidade: {dados.pedido?.finalidade || "-"}
                </Typography>
              </Box>

              <Chip
                label={getStatusLabel(dados.pedido?.status)}
                color={getStatusColor(dados.pedido?.status)}
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.2}>
              <Typography>
                <strong>Mutuário:</strong> {dados.pedido?.mutuario?.nomeCompleto || "-"}
              </Typography>

              <Typography>
                <strong>Valor Solicitado:</strong>{" "}
                {formatCurrency(dados.pedido?.valorSolicitado)}
              </Typography>

              <Typography>
                <strong>Etapa Atual:</strong> {dados.pedido?.etapaAtual || "-"}
              </Typography>

              <Typography>
                <strong>Data de Submissão:</strong>{" "}
                {formatDate(dados.pedido?.dataSubmissao)}
              </Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
              Resumo Financeiro
            </Typography>

            <Stack spacing={1.2}>
              <Typography>
                <strong>Total Desembolsado:</strong>{" "}
                {formatCurrency(dados.resumoFinanceiro?.totalDesembolsado)}
              </Typography>

              <Typography>
                <strong>Total Reembolsado:</strong>{" "}
                {formatCurrency(dados.resumoFinanceiro?.totalReembolsado)}
              </Typography>

              <Typography>
                <strong>Montante Total:</strong>{" "}
                {formatCurrency(dados.resumoFinanceiro?.montanteTotal)}
              </Typography>

              <Typography>
                <strong>Saldo em Dívida:</strong>{" "}
                {formatCurrency(dados.resumoFinanceiro?.saldoEmDivida)}
              </Typography>
            </Stack>
          </Paper>

          {creditos.map((credito) => (
            <Paper key={credito.id} sx={{ p: 3, borderRadius: 3 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={2}
                mb={2}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Crédito {credito.numeroContrato}
                </Typography>
                <Chip label={credito.estado} size="small" />
              </Stack>

              <Stack spacing={1.2} mb={2}>
                <Typography>
                  <strong>Prestação:</strong>{" "}
                  {formatCurrency(credito.prestacao)} × {credito.prazo}
                </Typography>
                <Typography>
                  <strong>Total Pago:</strong> {formatCurrency(credito.totalPago)}
                </Typography>
                <Typography>
                  <strong>Saldo Atual:</strong>{" "}
                  {formatCurrency(credito.saldoAtual)}
                </Typography>
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 700 }} mb={1}>
                Parcelas
              </Typography>

              {credito.parcelas?.length ? (
                <Stack spacing={1.5}>
                  {credito.parcelas.map((p) => (
                    <Stack
                      key={p.id}
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography variant="body2">
                        #{p.numeroParcela} · Venc. {formatDate(p.dataVencimento)}
                      </Typography>
                      <Typography variant="body2">
                        Previsto {formatCurrency(p.valorPrevisto)} · Pago{" "}
                        {formatCurrency(p.valorPago)} · Saldo{" "}
                        {formatCurrency(p.saldoParcela)}
                      </Typography>
                      <Chip label={p.estado} size="small" />
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  Sem parcelas geradas.
                </Typography>
              )}
            </Paper>
          ))}

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
              Aprovações
            </Typography>

            {dados.pedido?.aprovacoes?.length ? (
              <Stack spacing={2}>
                {dados.pedido.aprovacoes.map((item) => (
                  <Box key={item.id}>
                    <Typography>
                      <strong>Nível:</strong> {item.nivel || "-"}
                    </Typography>

                    <Typography>
                      <strong>Decisão:</strong> {item.decisao || "-"}
                    </Typography>

                    <Typography>
                      <strong>Comentário:</strong> {item.comentario || "-"}
                    </Typography>

                    <Typography>
                      <strong>Aprovador:</strong> {item.aprovador?.nome || "-"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Data: {formatDate(item.dataDecisao)}
                    </Typography>

                    <Divider sx={{ mt: 1.5 }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Nenhuma aprovação registada.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
              Desembolsos
            </Typography>

            {dados.pedido?.desembolsos?.length ? (
              <Stack spacing={2}>
                {dados.pedido.desembolsos.map((item) => (
                  <Box key={item.id}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ sm: "flex-start" }}
                      spacing={1}
                    >
                      <Box>
                        <Typography>
                          <strong>Valor:</strong>{" "}
                          {formatCurrency(item.valorDesembolsado)}
                        </Typography>

                        <Typography>
                          <strong>Data:</strong> {formatDate(item.dataDesembolso)}
                        </Typography>

                        <Typography>
                          <strong>Meio de Pagamento:</strong> {item.meioPagamento || "-"}
                        </Typography>

                        <Typography>
                          <strong>Número da Transação:</strong>{" "}
                          {item.numeroTransacao || "-"}
                        </Typography>

                        <Typography>
                          <strong>Referência:</strong> {item.referencia || "-"}
                        </Typography>

                        <Typography>
                          <strong>Observações:</strong> {item.observacoes || "-"}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Registado por: {item.criador?.nome || "-"}
                        </Typography>
                      </Box>

                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleComprovativoDesembolso(item.id)}
                      >
                        Comprovativo
                      </Button>
                    </Stack>

                    <Divider sx={{ mt: 1.5 }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Nenhum desembolso registado.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
              Reembolsos
            </Typography>

            {reembolsos.length ? (
              <Stack spacing={2}>
                {reembolsos.map((item) => (
                  <Box key={item.id}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ sm: "flex-start" }}
                      spacing={1}
                    >
                      <Box>
                        <Typography>
                          <strong>Valor:</strong>{" "}
                          {formatCurrency(item.valorReembolsado)}
                        </Typography>

                        <Typography>
                          <strong>Data:</strong> {formatDate(item.dataReembolso)}
                        </Typography>

                        <Typography>
                          <strong>Meio de Pagamento:</strong> {item.meioPagamento || "-"}
                        </Typography>

                        <Typography>
                          <strong>Número da Transação:</strong>{" "}
                          {item.numeroTransacao || "-"}
                        </Typography>

                        <Typography>
                          <strong>Referência:</strong> {item.referencia || "-"}
                        </Typography>

                        <Typography>
                          <strong>Observações:</strong> {item.observacoes || "-"}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Registado por: {item.criador?.nome || "-"}
                        </Typography>
                      </Box>

                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleComprovativoReembolso(item.id)}
                      >
                        Comprovativo
                      </Button>
                    </Stack>

                    <Divider sx={{ mt: 1.5 }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Nenhum reembolso registado.
              </Typography>
            )}
          </Paper>
        </Stack>
      )}
    </Box>
  );
}