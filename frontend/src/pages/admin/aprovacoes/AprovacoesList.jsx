import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getAllAprovacoesRequest } from "../../../api/admin.api";
import { formatDate } from "../../../utils/formatters";
import PageHeader from "../../../components/common/PageHeader";
import LoadingState from "../../../components/common/LoadingState";
import StatusChip from "../../../components/common/StatusChip";

export default function AprovacoesList() {
  const [aprovacoes, setAprovacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const carregarAprovacoes = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAllAprovacoesRequest();
        setAprovacoes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Erro ao carregar aprovações.");
      } finally {
        setLoading(false);
      }
    };

    carregarAprovacoes();
  }, []);

  const aprovacoesFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return aprovacoes;

    return aprovacoes.filter((aprovacao) => {
      const pedidoNumero = String(aprovacao.pedido?.numeroPedido || "").toLowerCase();
      const mutuarioNome = String(
        aprovacao.pedido?.mutuario?.nomeCompleto || ""
      ).toLowerCase();
      const aprovadorNome = String(aprovacao.aprovador?.nome || "").toLowerCase();
      const decisao = String(aprovacao.decisao || "").toLowerCase();
      const comentario = String(aprovacao.comentario || "").toLowerCase();
      const nivel = String(aprovacao.nivel || "").toLowerCase();
      const statusPedido = String(
        aprovacao.pedido?.status || aprovacao.pedido?.estado || ""
      ).toLowerCase();

      return (
        pedidoNumero.includes(term) ||
        mutuarioNome.includes(term) ||
        aprovadorNome.includes(term) ||
        decisao.includes(term) ||
        comentario.includes(term) ||
        nivel.includes(term) ||
        statusPedido.includes(term)
      );
    });
  }, [aprovacoes, search]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="Aprovações"
        subtitle="Consulte as aprovações registadas no sistema para auditoria e supervisão."
      />

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          label="Pesquisar por pedido, mutuário, aprovador, decisão, nível, comentário ou status"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && aprovacoesFiltradas.length === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography>Nenhuma aprovação encontrada.</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {aprovacoesFiltradas.map((aprovacao) => {
          const statusPedido = aprovacao.pedido?.status || aprovacao.pedido?.estado;
          const pedidoId = aprovacao.pedido?.id;

          return (
            <Paper key={aprovacao.id} sx={{ p: 3, borderRadius: 3 }}>
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
                      {aprovacao.pedido?.numeroPedido || `Aprovação #${aprovacao.id}`}
                    </Typography>

                    {statusPedido && <StatusChip status={statusPedido} />}

                    <Chip
                      label={aprovacao.decisao || "-"}
                      color={
                        aprovacao.decisao === "APROVADO"
                          ? "success"
                          : aprovacao.decisao === "REJEITADO"
                          ? "error"
                          : "default"
                      }
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Mutuário:</strong>{" "}
                    {aprovacao.pedido?.mutuario?.nomeCompleto || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Aprovador:</strong> {aprovacao.aprovador?.nome || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Nível:</strong> {aprovacao.nivel || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Comentário:</strong> {aprovacao.comentario || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Data da decisão:</strong>{" "}
                    {formatDate(aprovacao.dataDecisao || aprovacao.createdAt)}
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  {pedidoId && (
                    <Button
                      component={RouterLink}
                      to={`/interno/pedidos/${pedidoId}`}
                      variant="outlined"
                    >
                      Ver Pedido
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}