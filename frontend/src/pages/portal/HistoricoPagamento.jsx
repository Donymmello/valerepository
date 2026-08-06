import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { downloadComprovativoRequest, getMeusComprovativosRequest } from "../../api/portal.api";
import { formatDate } from "../../utils/formatters";

const cor = { PENDENTE: "warning", VALIDADO: "success", REJEITADO: "error" };
export default function HistoricoPagamento() {
  const { creditoId } = useParams(); const navigate = useNavigate();
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { getMeusComprovativosRequest(creditoId).then(setItems).catch((e) => setError(e?.response?.data?.message || "Erro ao carregar historico.")).finally(() => setLoading(false)); }, [creditoId]);
  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  return <Stack spacing={3}><Box><Typography variant="h4" fontWeight={700}>Historico de pagamentos</Typography><Typography color="text.secondary">Comprovativos enviados para este credito.</Typography></Box>
    {error && <Alert severity="error">{error}</Alert>}
    <Paper sx={{ borderRadius: 3, overflow: "hidden" }}><Table><TableHead><TableRow><TableCell>Parcela</TableCell><TableCell>Enviado em</TableCell><TableCell>Estado</TableCell><TableCell>Observacoes</TableCell><TableCell /></TableRow></TableHead><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell>{item.parcela?.numeroParcela || "-"}</TableCell><TableCell>{formatDate(item.createdAt)}</TableCell><TableCell><Chip size="small" label={item.estado} color={cor[item.estado] || "default"} /></TableCell><TableCell>{item.observacoes || "-"}</TableCell><TableCell><Button size="small" onClick={() => downloadComprovativoRequest(item.id, item.nome)}>Baixar</Button></TableCell></TableRow>)}{!items.length && <TableRow><TableCell colSpan={5}>Nenhum comprovativo enviado.</TableCell></TableRow>}</TableBody></Table></Paper>
    <Button variant="outlined" onClick={() => navigate(`/portal/meus-creditos/${creditoId}`)}>Voltar ao credito</Button></Stack>;
}
