import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Container, Grid,
  Box, Slider, Card, CardContent, Stack, CircularProgress, Alert, TextField
} from '@mui/material';
import { AccountBalanceWallet, Speed, Security, CheckCircleOutline } from '@mui/icons-material';
import { simularCreditoRequest, criarSolicitacaoAcessoRequest } from '../../api/public.api';
import { bootstrapAdminRequest } from '../../api/auth.api';
//import { simularCalculoCreditoRequest } from '../../api/public.api';
import { useAuth } from "../../context/AuthContext";


// Tempo de espera depois do user parar de mexer no slider, antes de chamar o backend
const DEBOUNCE_MS = 500;

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setSession } = useAuth();
  const [valorSolicitado, setValor] = useState(5000);
  const [parcelas, setParcelas] = useState(6);

  const [resultado, setResultado] = useState(null); // { prestacao, jurosTotal, montanteTotal, taxa, id }
  const [loadingSimulacao, setLoadingSimulacao] = useState(false);
  const [erroSimulacao, setErroSimulacao] = useState("");

  const debounceRef = useRef(null);

  // Trial self-service: cria a empresa + admin na hora (7 dias grátis).
  const [trialForm, setTrialForm] = useState({ nomeEmpresa: "", nome: "", email: "", password: "" });
  const [trialEnviando, setTrialEnviando] = useState(false);
  const [trialErro, setTrialErro] = useState("");

  const handleIniciarTrial = async (event) => {
    event.preventDefault();
    setTrialErro("");
    setTrialEnviando(true);

    try {
      const data = await bootstrapAdminRequest(trialForm);
      setSession(data.token, data.user);
      navigate("/interno");
    } catch (err) {
      console.error(err);
      setTrialErro(err?.response?.data?.message || "Não foi possível criar a tua conta. Tenta novamente.");
    } finally {
      setTrialEnviando(false);
    }
  };

  // Formulário "Prefiro falar com alguém" — não cria conta, só regista o
  // interesse para contacto manual (alternativa ao trial self-service acima).
  const [acessoForm, setAcessoForm] = useState({
    nomeEmpresa: "", nomeContacto: "", email: "", telefone: "", mensagem: "",
  });
  const [acessoEnviando, setAcessoEnviando] = useState(false);
  const [acessoErro, setAcessoErro] = useState("");
  const [acessoSucesso, setAcessoSucesso] = useState(false);
  const [mostrarFormContacto, setMostrarFormContacto] = useState(false);

  const handleEnviarSolicitacaoAcesso = async (event) => {
    event.preventDefault();
    setAcessoErro("");
    setAcessoEnviando(true);

    try {
      await criarSolicitacaoAcessoRequest(acessoForm);
      setAcessoSucesso(true);
      setAcessoForm({ nomeEmpresa: "", nomeContacto: "", email: "", telefone: "", mensagem: "" });
    } catch (err) {
      console.error(err);
      setAcessoErro(err?.response?.data?.message || "Não foi possível enviar o pedido. Tenta novamente.");
    } finally {
      setAcessoEnviando(false);
    }
  };

  // Dispara a simulação no backend sempre que valor/parcelas mudam,
  // com debounce para não disparar uma chamada por cada pixel do slider.
  useEffect(() => {
    setErroSimulacao("");

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setLoadingSimulacao(true);

        const data = await simularCreditoRequest({ valorSolicitado, prazo: parcelas });

        setResultado(data);

        // Guarda o id da simulação para, se o user se registar a seguir,
        // conseguirmos associar esta simulação à conta criada.
        if (data?.id) {
          sessionStorage.setItem("simulacaoPendenteId", data.id);
        }
      } catch (err) {
        console.error(err);
        setErroSimulacao("Não foi possível calcular a simulação. Tenta novamente.");
      } finally {
        setLoadingSimulacao(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [valorSolicitado, parcelas]);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f4f6f8', minHeight: '100vh' }}>

      {/* 1. Header / Navbar */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', px: '0 !important' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
              Sistema de Gestão de Crédito
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button color="inherit" onClick={() => scrollToSection("como-funciona")}>
                Como Funciona
              </Button>

              <Button color="inherit" onClick={() => scrollToSection("beneficios")}>
                Benefícios
              </Button>

              <Button color="inherit" onClick={() => scrollToSection("faq")}>
                FAQ
              </Button>

              <Button color="inherit" onClick={() => scrollToSection("sou-financeira")}>
                Sou uma Financeira
              </Button>

              {isAuthenticated ? (
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: 2 }}
                  onClick={() => navigate("/portal")}>
                  Área do Cliente
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: 2 }}
                  onClick={() => navigate("/login")}
                >
                  Entrar
                </Button>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* 2. Hero Section + Simulador */}
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
        <Grid container spacing={4} alignItems="center">

          {/* Texto de Impacto */}
          <Grid item xs={12} md={6}>
            <Typography variant="h2" component="h1" sx={{ fontWeight: 800, color: '#1a237e', mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
              Impulsione o seu negócio hoje.
            </Typography>
            <Typography variant="h6" color="textSecondary" sx={{ mb: 4, fontWeight: 400 }}>
              Microcrédito rápido, sem burocracia e com taxas que cabem no seu bolso. Dinheiro na conta em até 24 horas para microempreendedores.
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <CheckCircleOutline color="success" />
              <Typography variant="body1">Sem taxas escondidas</Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <CheckCircleOutline color="success" />
              <Typography variant="body1">Processo 100% digital</Typography>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={4}>
              <Button
                variant="contained"
                size="large"
                color="success"
                onClick={() => scrollToSection("simulador")}
              >
                Simular Crédito
              </Button>

              {isAuthenticated && (
                <Button variant="contained" onClick={() => navigate("/portal")}>
                  Ir para o Portal
                </Button>
              )}
            </Stack>

            {!isAuthenticated && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Já és cliente de uma financeira? Pede o link de registo a ela.
              </Typography>
            )}
          </Grid>

          {/* Card do Simulador */}
          <Grid item xs={12} md={6} id="simulador">
            <Card sx={{ borderRadius: 4, boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.08)', p: 2 }}>
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1a237e' }}>
                  Simule o seu Crédito
                </Typography>

                {/* Slider de Valor */}
                <Box sx={{ mb: 4 }}>
                  <Typography gutterBottom justifyContent="space-between" display="flex">
                    <span>Quanto precisa?</span>
                    <strong>MZN {valorSolicitado.toLocaleString()}</strong>
                  </Typography>
                  <Slider
                    value={valorSolicitado}
                    min={5000}
                    max={100000}
                    step={500}
                    onChange={(e, val) => setValor(val)}
                    valueLabelDisplay="auto"
                  />
                </Box>

                {/* Slider de Parcelas */}
                <Box sx={{ mb: 4 }}>
                  <Typography gutterBottom justifyContent="space-between" display="flex">
                    <span>Em quantas parcelas?</span>
                    <strong>{parcelas} meses</strong>
                  </Typography>
                  <Slider
                    value={parcelas}
                    min={3}
                    max={24}
                    step={1}
                    onChange={(e, val) => setParcelas(val)}
                    valueLabelDisplay="auto"
                    color="secondary"
                  />
                </Box>

                {/* Resultado da Simulação */}
                {erroSimulacao && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {erroSimulacao}
                  </Alert>
                )}

                <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 2, mb: 3, position: 'relative', minHeight: 140 }}>
                  {loadingSimulacao && (
                    <Box sx={{
                      position: 'absolute', inset: 0, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 2, zIndex: 1,
                    }}>
                      <CircularProgress size={22} />
                    </Box>
                  )}

                  <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography color="textSecondary">Taxa Aplicada</Typography>
                    <Typography fontWeight="bold">
                      {resultado ? `${Number(resultado.taxa).toFixed(1)}% ao ano` : "—"}
                    </Typography>
                  </Grid>

                  <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography color="textSecondary">Prazo</Typography>
                    <Typography fontWeight="bold">{parcelas} meses</Typography>
                  </Grid>

                  <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography color="textSecondary">Parcela mensal estimada:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      {resultado ? `MZN ${Number(resultado.prestacao).toFixed(2)}` : "—"}
                    </Typography>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography color="textSecondary">Total a pagar:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {resultado ? `MZN ${Number(resultado.montanteTotal).toFixed(2)}` : "—"}
                    </Typography>
                  </Grid>
                </Box>

                {isAuthenticated ? (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    size="large"
                    sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
                    onClick={() => navigate("/portal/criar-pedido")}
                  >
                    Solicitar Crédito
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      size="large"
                      disabled
                      sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
                    >
                      Solicitar Crédito
                    </Button>
                    <Typography variant="caption" color="textSecondary" display="block" textAlign="center" mt={1}>
                      Precisas de um convite da tua financeira para te registares.
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Container>

      {/* 3. Como Funciona */}
      <Box id="como-funciona" sx={{ py: 8, bgcolor: "#fff" }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" fontWeight="bold" mb={6} sx={{ color: '#1a237e' }}>
            Como Funciona
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, height: '100%', boxShadow: '0px 4px 16px rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 1 }}>
                    1. Simule
                  </Typography>
                  <Typography color="textSecondary">
                    Escolha o valor e prazo.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, height: '100%', boxShadow: '0px 4px 16px rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 1 }}>
                    2. Faça o Pedido
                  </Typography>
                  <Typography color="textSecondary">
                    Aceite o convite da sua financeira e envie o pedido.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, height: '100%', boxShadow: '0px 4px 16px rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 1 }}>
                    3. Envie Documentos
                  </Typography>
                  <Typography color="textSecondary">
                    Faça upload dos requisitos.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, height: '100%', boxShadow: '0px 4px 16px rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 1 }}>
                    4. Receba o Crédito
                  </Typography>
                  <Typography color="textSecondary">
                    Após aprovação e desembolso.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 4. Seção de Benefícios */}
      <Box id="beneficios" sx={{ bgcolor: '#f4f6f8', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" sx={{ fontWeight: 'bold', mb: 6, color: '#1a237e' }}>
            Porquê escolher o nosso Microcrédito?
          </Typography>

          <Grid container spacing={4}>

            {/* Benefício 1 */}
            <Grid item xs={12} md={4}>
              <Box textAlign="center" sx={{ p: 2 }}>
                <Speed sx={{ fontSize: 50, color: '#3f51b5', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Rapidez na Resposta</Typography>
                <Typography color="textSecondary">Análise de perfil realizada em poucos minutos com resposta imediata.</Typography>
              </Box>
            </Grid>

            {/* Benefício 2 */}
            <Grid item xs={12} md={4}>
              <Box textAlign="center" sx={{ p: 2 }}>
                <AccountBalanceWallet sx={{ fontSize: 50, color: '#3f51b5', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Taxas Justas</Typography>
                <Typography color="textSecondary">Condições personalizadas para garantir que o seu negócio cresça de forma saudável.</Typography>
              </Box>
            </Grid>

            {/* Benefício 3 */}
            <Grid item xs={12} md={4}>
              <Box textAlign="center" sx={{ p: 2 }}>
                <Security sx={{ fontSize: 50, color: '#3f51b5', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>100% Seguro</Typography>
                <Typography color="textSecondary">Seus dados e transações protegidos com tecnologia de criptografia avançada.</Typography>
              </Box>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* 4.5 Sou uma Financeira — trial self-service + alternativa de contacto */}
      <Box id="sou-financeira" sx={{ py: 8, bgcolor: '#fff' }}>
        <Container maxWidth="sm">
          <Typography variant="h4" align="center" fontWeight="bold" mb={1} sx={{ color: '#1a237e' }}>
            É uma financeira ou microcrédito?
          </Typography>
          <Typography align="center" color="textSecondary" mb={4}>
            Cria a tua conta agora e experimenta grátis durante 7 dias. Sem cartão de crédito.
          </Typography>

          <Card sx={{ borderRadius: 4, boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.08)' }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box component="form" onSubmit={handleIniciarTrial}>
                {trialErro && <Alert severity="error" sx={{ mb: 2 }}>{trialErro}</Alert>}

                <Stack spacing={2.5}>
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
                    color="success"
                    size="large"
                    disabled={trialEnviando}
                    sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
                  >
                    {trialEnviando ? "A criar conta..." : "Começar trial grátis de 7 dias"}
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                {mostrarFormContacto ? (
                  acessoSucesso ? (
                    <Alert severity="success">
                      Pedido recebido com sucesso! Vamos entrar em contacto em breve.
                    </Alert>
                  ) : (
                    <Box component="form" onSubmit={handleEnviarSolicitacaoAcesso} sx={{ textAlign: 'left', mt: 1 }}>
                      <Typography variant="body2" color="textSecondary" mb={2}>
                        Prefere falar com alguém primeiro? Deixa os teus dados e entramos em contacto.
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

                        <Button
                          type="submit"
                          variant="outlined"
                          disabled={acessoEnviando}
                          sx={{ borderRadius: 2 }}
                        >
                          {acessoEnviando ? "A enviar..." : "Pedir Contacto"}
                        </Button>
                      </Stack>
                    </Box>
                  )
                ) : (
                  <Button variant="text" size="small" onClick={() => setMostrarFormContacto(true)}>
                    Prefiro falar com alguém primeiro
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* 5. FAQ */}
      <Box id="faq" sx={{ bgcolor: "#fff", py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h4" align="center" fontWeight="bold" mb={4} sx={{ color: '#1a237e' }}>
            Perguntas Frequentes
          </Typography>

          <Stack spacing={2.5}>
            <Box>
              <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Quem pode solicitar crédito?
              </Typography>
              <Typography color="textSecondary">
                Microempreendedores e pequenos negócios maiores de 18 anos, com documento de identificação válido.
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Quanto tempo demora a aprovação?
              </Typography>
              <Typography color="textSecondary">
                A análise inicial é feita em poucos minutos. O desembolso, após validação de documentos, ocorre em até 24 horas.
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Quais documentos são exigidos?
              </Typography>
              <Typography color="textSecondary">
                Os requisitos variam consoante o tipo de pedido e serão indicados no portal após a submissão.
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Posso liquidar antes do prazo?
              </Typography>
              <Typography color="textSecondary">
                Sim, a liquidação antecipada é permitida sem penalizações adicionais.
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* 6. Footer */}
      <Box sx={{ bgcolor: '#1a237e', color: '#ffffff', py: 4, mt: 'auto' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" align="center">
            &copy; {new Date().getFullYear()} Sistema de Gestão de Crédito. Todos os direitos reservados. Desenvolvido por Sidonio Aly.
          </Typography>
        </Container>
      </Box>

    </Box>
  );
}
