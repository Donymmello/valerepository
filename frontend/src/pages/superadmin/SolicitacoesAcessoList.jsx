import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  listarSolicitacoesAcessoRequest,
  atualizarSolicitacaoAcessoRequest,
} from "../../api/superadmin.api";
import { formatDate } from "../../utils/formatters";

const ESTADOS = ["PENDENTE", "CONTACTADO", "CONVERTIDO", "REJEITADO"];

const ESTADO_COR = {
  PENDENTE: "warning",
  CONTACTADO: "info",
  CONVERTIDO: "success",
  REJEITADO: "default",
};

// Nomes de marketing dos mesmos 3 valores do ENUM Empresa.plano (ver
// backend/config/planos.js). Pedidos antigos, sem plano (formulário
// "prefiro falar com alguém"), mostram "—" nesta coluna.
const NOME_PLANO = {
  STARTER: "Starter",
  BUSINESS: "Profissional",
  ENTERPRISE: "Empresarial",
};

const formatarMT = (valor) => Math.round(Number(valor)).toLocaleString("pt-PT");

export default function SolicitacoesAcessoList() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [atualizandoId, setAtualizandoId] = useState(null);

  const carregar = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listarSolicitacoesAcessoRequest();
      setSolicitacoes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao carregar pedidos de acesso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleMudarEstado = async (id, estado) => {
    setAtualizandoId(id);
    setError("");
    try {
      await atualizarSolicitacaoAcessoRequest(id, estado);
      setSolicitacoes((prev) => prev.map((s) => (s.id === id ? { ...s, estado } : s)));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao atualizar pedido.");
    } finally {
      setAtualizandoId(null);
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
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Pedidos de Acesso
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Empresas que pediram acesso pela landing page. Marca o progresso à medida que negoceias.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {solicitacoes.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography color="text.secondary">Nenhum pedido de acesso recebido ainda.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empresa</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Plano</TableCell>
                <TableCell>Mensagem</TableCell>
                <TableCell>Recebido em</TableCell>
                <TableCell align="right">Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {solicitacoes.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{s.nomeEmpresa}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{s.nomeContacto}</Typography>
                    <Typography variant="body2" color="text.secondary">{s.email}</Typography>
                    {s.telefone && (
                      <Typography variant="caption" color="text.secondary">{s.telefone}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.plano ? (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {NOME_PLANO[s.plano] || s.plano}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatarMT(s.valorEstimado)} MT{s.cicloFaturacao === "ANUAL" ? "/ano" : "/mês"}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                      {s.mensagem || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(s.created_at)}</TableCell>
                  <TableCell align="right">
                    <Select
                      size="small"
                      value={s.estado}
                      disabled={atualizandoId === s.id}
                      onChange={(e) => handleMudarEstado(s.id, e.target.value)}
                      renderValue={(value) => (
                        <Chip label={value} size="small" color={ESTADO_COR[value] || "default"} />
                      )}
                    >
                      {ESTADOS.map((estado) => (
                        <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
