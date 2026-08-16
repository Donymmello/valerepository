import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { downloadComprovativoRequest, getMeusComprovativosRequest } from "../../api/portal.api";
import { formatDate } from "../../utils/formatters";
import PageHeader from "../../components/common/PageHeader";
import LoadingState from "../../components/common/LoadingState";

const cor = { PENDENTE: "warning", VALIDADO: "success", REJEITADO: "error" };
export default function HistoricoPagamento() {
  const { creditoId } = useParams(); const navigate = useNavigate();
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { getMeusComprovativosRequest(creditoId).then(setItems).catch((e) => setError(e?.response?.data?.message || "Erro ao carregar historico.")).finally(() => setLoading(false)); }, [creditoId]);
  if (loading) return <LoadingState />;
  return <Stack spacing={3}>
    <PageHeader title="Histórico de pagamentos" subtitle="Comprovativos enviados para este crédito." mb={0} />
    {error && <Alert severity="error">{error}</Alert>}
    <Paper sx={{ borderRadius: 3, overflow: "hidden" }}><Table><TableHead><TableRow><TableCell>Parcela</TableCell><TableCell>Enviado em</TableCell><TableCell>Estado</TableCell><TableCell>Observacoes</TableCell><TableCell /></TableRow></TableHead><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell>{item.parcela?.numeroParcela || "-"}</TableCell><TableCell>{formatDate(item.createdAt)}</TableCell><TableCell><Chip size="small" label={item.estado} color={cor[item.estado] || "default"} /></TableCell><TableCell>{item.observacoes || "-"}</TableCell><TableCell><Button size="small" onClick={() => downloadComprovativoRequest(item.id, item.nome)}>Baixar</Button></TableCell></TableRow>)}{!items.length && <TableRow><TableCell colSpan={5}>Nenhum comprovativo enviado.</TableCell></TableRow>}</TableBody></Table></Paper>
    <Button variant="outlined" onClick={() => navigate(`/portal/meus-creditos/${creditoId}`)}>Voltar ao credito</Button></Stack>;
}
