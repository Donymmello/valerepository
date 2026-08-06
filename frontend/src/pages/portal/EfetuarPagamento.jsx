import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { getMeuCreditoRequest, getMeusComprovativosRequest, enviarComprovativoRequest } from "../../api/portal.api";
import { formatCurrency } from "../../utils/formatters";
import ComprovativoSection from "./ComprovativoSection";

export default function EfetuarPagamento() {
  const { creditoId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [credito, setCredito] = useState(null);
  const [comprovativos, setComprovativos] = useState([]);
  const [parcelaId, setParcelaId] = useState(searchParams.get("parcelaId") || "");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const carregar = async () => {
    try {
      setLoading(true); setError("");
      const [creditoData, comprovativosData] = await Promise.all([getMeuCreditoRequest(creditoId), getMeusComprovativosRequest(creditoId)]);
      setCredito(creditoData); setComprovativos(comprovativosData || []);
    } catch (err) { setError(err?.response?.data?.message || "Nao foi possivel carregar o pagamento."); }
    finally { setLoading(false); }
  };
  useEffect(() => { carregar(); }, [creditoId]);

  const parcelasDisponiveis = useMemo(() => (credito?.parcelas || []).filter((p) => Number(p.saldoParcela) > 0), [credito]);
  const parcela = parcelasDisponiveis.find((p) => String(p.id) === String(parcelaId));
  const temPendente = comprovativos.some((c) => String(c.parcelaId) === String(parcelaId) && c.estado === "PENDENTE");
  const enviar = async (file) => {
    await enviarComprovativoRequest(creditoId, parcelaId, file);
    setMessage("Comprovativo enviado. Aguarde a validacao do backoffice.");
    await carregar();
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  return <Stack spacing={3}>
    <Box><Typography variant="h4" fontWeight={700}>Efetuar pagamento</Typography><Typography color="text.secondary">Contrato {credito?.numeroContrato || `#${creditoId}`}</Typography></Box>
    {error && <Alert severity="error">{error}</Alert>}
    {message && <Alert severity="success">{message}</Alert>}
    <Paper sx={{ p: 3, borderRadius: 3 }}><Stack spacing={2}>
      <TextField select label="Parcela a pagar" value={parcelaId} onChange={(e) => { setParcelaId(e.target.value); setMessage(""); }} fullWidth>
        <MenuItem value="">Selecionar parcela</MenuItem>
        {parcelasDisponiveis.map((p) => <MenuItem value={p.id} key={p.id}>Parcela {p.numeroParcela} — saldo {formatCurrency(p.saldoParcela)}</MenuItem>)}
      </TextField>
      {parcela && <ComprovativoSection parcela={parcela} disabled={temPendente} onEnviar={enviar} />}
      {temPendente && <Alert severity="warning">Ja existe um comprovativo pendente para esta parcela.</Alert>}
    </Stack></Paper>
    <Button variant="outlined" onClick={() => navigate(`/portal/meus-creditos/${creditoId}`)}>Voltar ao credito</Button>
  </Stack>;
}
