import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Container, Typography, Card, CardContent, Stack, Alert, TextField, Button,
  ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import { CheckCircleOutline } from "@mui/icons-material";
import { criarSolicitacaoAcessoRequest } from "../../../api/public.api";
import { bootstrapAdminRequest } from "../../../api/auth.api";
import { useAuth } from "../../../context/useAuth";
import { CORES } from "../../../theme";

const RAZOES = [
  "Trial de 7 dias, sem cartão de crédito",
  "A tua própria equipa, taxas e níveis de aprovação",
  "Dados sempre isolados de outras financeiras",
  "Sem instalação, corre no browser",
];

// Nomes de marketing dos mesmos 3 valores do ENUM Empresa.plano (ver
// backend/models/empresa.model.js e a origem em ./Precos.jsx).
const NOME_PLANO = {
  STARTER: "Starter",
  BUSINESS: "Profissional",
  ENTERPRISE: "Empresarial",
};

// Mesmos preços de ./Precos.jsx, só para mostrar uma estimativa aqui. O
// valor cobrado de facto é sempre recalculado no backend a partir de
// config/planos.js (ver controllers/solicitacaoAcesso.controller.js).
const PRECO_MENSAL = { STARTER: 2500, BUSINESS: 4000, ENTERPRISE: 8000 };
const formatarMT = (valor) => Math.round(valor).toLocaleString("pt-PT");

export default function TrialSection({ planoEscolhido = "STARTER" }) {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  // Trial self-service: cria a empresa + admin na hora (7 dias grátis).
  const [trialForm, setTrialForm] = useState({ nomeEmpresa: "", nome: "", email: "", password: "" });
  const [trialEnviando, setTrialEnviando] = useState(false);
  const [trialErro, setTrialErro] = useState("");

  const handleIniciarTrial = async (event) => {
    event.preventDefault();
    setTrialErro("");
    setTrialEnviando(true);

    try {
      const data = await bootstrapAdminRequest({ ...trialForm, plano: planoEscolhido });
      setSession(data.token, data.user, data.refreshToken);
      navigate("/interno");
    } catch (err) {
      console.error(err);
      setTrialErro(err?.response?.data?.message || "Não foi possível criar a tua conta. Tenta novamente.");
    } finally {
      setTrialEnviando(false);
    }
  };

  // Pedido de plano pago (pagamento manual): não cria conta na hora, só
  // regista o pedido; o cliente recebe um email com o valor e os dados
  // para pagamento, e nós recebemos a notificação para acompanhar
  // manualmente (ver controllers/solicitacaoAcesso.controller.js).
  // Substitui o antigo formulário genérico "prefiro falar com alguém".
  const [acessoForm, setAcessoForm] = useState({
    nomeEmpresa: "", nomeContacto: "", email: "", telefone: "", mensagem: "",
  });
  const [acessoCiclo, setAcessoCiclo] = useState("MENSAL");
  const [acessoEnviando, setAcessoEnviando] = useState(false);
  const [acessoErro, setAcessoErro] = useState("");
  const [acessoSucesso, setAcessoSucesso] = useState(false);
  const [mostrarFormPedido, setMostrarFormPedido] = useState(false);

  const handleEnviarSolicitacaoAcesso = async (event) => {
    event.preventDefault();
    setAcessoErro("");
    setAcessoEnviando(true);

    try {
      await criarSolicitacaoAcessoRequest({
        ...acessoForm,
        plano: planoEscolhido,
        cicloFaturacao: acessoCiclo,
      });
      setAcessoSucesso(true);
      setAcessoForm({ nomeEmpresa: "", nomeContacto: "", email: "", telefone: "", mensagem: "" });
    } catch (err) {
      console.error(err);
      setAcessoErro(err?.response?.data?.message || "Não foi possível enviar o pedido. Tenta novamente.");
    } finally {
      setAcessoEnviando(false);
    }
  };

  const precoBase = PRECO_MENSAL[planoEscolhido] || PRECO_MENSAL.STARTER;
  const precoPedido = acessoCiclo === "ANUAL" ? precoBase * 10 : precoBase;

  return (
    <Box id="sou-financeira" sx={{ py: { xs: 8, md: 11 }, bgcolor: "#fff" }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 5, md: 8 }} alignItems="flex-start">
          {/* Coluna de contexto */}
          <Box sx={{ flex: 1, maxWidth: { md: 420 }, position: { md: "sticky" }, top: { md: 120 } }}>
            <Typography variant="overline" sx={{ color: CORES.marca, fontWeight: 700, letterSpacing: 1.2 }}>
              Para financeiras
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, mb: 2, color: "#0f172a" }}>
              Experimenta com a tua própria operação
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
              Cria a conta da tua financeira e começa a gerir pedidos de crédito hoje mesmo. Sem compromisso durante
              os primeiros 7 dias.
            </Typography>

            <Stack spacing={1.5}>
              {RAZOES.map((razao) => (
                <Stack key={razao} direction="row" spacing={1.25} alignItems="flex-start">
                  <CheckCircleOutline sx={{ color: CORES.sucesso, fontSize: 20, mt: 0.25 }} />
                  <Typography variant="body2" color="text.secondary">
                    {razao}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Coluna do formulário */}
          <Box sx={{ flex: 1, width: "100%", maxWidth: { xs: "100%", md: 460 }, mx: { xs: "auto", md: 0 } }}>
            <Card
              sx={{
                borderRadius: 4,
                border: "1px solid",
                borderColor: "rgba(15,23,42,0.08)",
                boxShadow: "0 20px 45px -24px rgba(15,23,42,0.25)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Começar trial grátis
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Plano selecionado: <strong>{NOME_PLANO[planoEscolhido] || NOME_PLANO.STARTER}</strong>
                </Typography>

                <Box component="form" onSubmit={handleIniciarTrial}>
                  {trialErro && <Alert severity="error" sx={{ mb: 2 }}>{trialErro}</Alert>}

                  <Stack spacing={2.25}>
                    <TextField
                      fullWidth
                      required
                      label="Nome da empresa"
                      value={trialForm.nomeEmpresa}
                      onChange={(e) => setTrialForm({ ...trialForm, nomeEmpresa: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      required
                      label="O teu nome"
                      value={trialForm.nome}
                      onChange={(e) => setTrialForm({ ...trialForm, nome: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      required
                      type="email"
                      label="Email"
                      value={trialForm.email}
                      onChange={(e) => setTrialForm({ ...trialForm, email: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      required
                      type="password"
                      label="Password"
                      value={trialForm.password}
                      onChange={(e) => setTrialForm({ ...trialForm, password: e.target.value })}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      disableElevation
                      size="large"
                      disabled={trialEnviando}
                      sx={{ borderRadius: 2, py: 1.4, fontWeight: 700 }}
                    >
                      {trialEnviando ? "A criar conta..." : "Começar trial grátis de 7 dias"}
                    </Button>
                  </Stack>
                </Box>

                <Box sx={{ textAlign: "center", mt: 3 }}>
                  {mostrarFormPedido ? (
                    acessoSucesso ? (
                      <Alert severity="success">
                        Pedido recebido! Vais receber um email com os dados para pagamento em breve.
                      </Alert>
                    ) : (
                      <Box component="form" onSubmit={handleEnviarSolicitacaoAcesso} sx={{ textAlign: "left", mt: 1 }}>
                        <Typography variant="body2" color="textSecondary" mb={1}>
                          Prefere pagamento manual (transferência/M-Pesa)? Pede o plano{" "}
                          <strong>{NOME_PLANO[planoEscolhido] || NOME_PLANO.STARTER}</strong> e enviamos as
                          instruções por email.
                        </Typography>

                        <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
                          <ToggleButtonGroup
                            value={acessoCiclo}
                            exclusive
                            size="small"
                            onChange={(_e, valor) => valor && setAcessoCiclo(valor)}
                          >
                            <ToggleButton value="MENSAL">Mensal</ToggleButton>
                            <ToggleButton value="ANUAL">Anual</ToggleButton>
                          </ToggleButtonGroup>
                        </Stack>

                        <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "center", mb: 2 }}>
                          {formatarMT(precoPedido)} MT {acessoCiclo === "ANUAL" ? "por ano" : "por mês"}
                        </Typography>

                        {acessoErro && <Alert severity="error" sx={{ mb: 2 }}>{acessoErro}</Alert>}

                        <Stack spacing={2}>
                          <TextField
                            fullWidth
                            required
                            size="small"
                            label="Nome da empresa"
                            value={acessoForm.nomeEmpresa}
                            onChange={(e) => setAcessoForm({ ...acessoForm, nomeEmpresa: e.target.value })}
                          />
                          <TextField
                            fullWidth
                            required
                            size="small"
                            label="O teu nome"
                            value={acessoForm.nomeContacto}
                            onChange={(e) => setAcessoForm({ ...acessoForm, nomeContacto: e.target.value })}
                          />
                          <TextField
                            fullWidth
                            required
                            size="small"
                            type="email"
                            label="Email"
                            value={acessoForm.email}
                            onChange={(e) => setAcessoForm({ ...acessoForm, email: e.target.value })}
                          />
                          <TextField
                            fullWidth
                            size="small"
                            label="Telefone (opcional)"
                            value={acessoForm.telefone}
                            onChange={(e) => setAcessoForm({ ...acessoForm, telefone: e.target.value })}
                          />
                          <TextField
                            fullWidth
                            size="small"
                            multiline
                            minRows={2}
                            label="Mensagem (opcional)"
                            value={acessoForm.mensagem}
                            onChange={(e) => setAcessoForm({ ...acessoForm, mensagem: e.target.value })}
                          />

                          <Button type="submit" variant="outlined" disabled={acessoEnviando} sx={{ borderRadius: 2 }}>
                            {acessoEnviando ? "A enviar..." : "Enviar pedido"}
                          </Button>
                        </Stack>
                      </Box>
                    )
                  ) : (
                    <Button variant="text" size="small" onClick={() => setMostrarFormPedido(true)}>
                      Pedir fatura deste plano
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
