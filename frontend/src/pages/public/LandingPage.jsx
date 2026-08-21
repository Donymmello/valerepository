import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Container, Grid,
  Box, Card, CardContent, Stack, Alert, TextField
} from '@mui/material';
import { AccountBalanceWallet, Speed, Security, CheckCircleOutline } from '@mui/icons-material';
import { criarSolicitacaoAcessoRequest } from '../../api/public.api';
import { bootstrapAdminRequest } from '../../api/auth.api';
import { useAuth } from "../../context/AuthContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setSession } = useAuth();

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

      {/* 2. Hero Section */}
      <Container maxWidth="md" sx={{ mt: 10, mb: 10, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" sx={{ fontWeight: 800, color: '#1a237e', mb: 2, fontSize: { xs: '2.25rem', md: '3.25rem' } }}>
          A plataforma de gestão para a sua financeira.
        </Typography>
        <Typography variant="h6" color="textSecondary" sx={{ mb: 4, fontWeight: 400 }}>
          Pedidos, aprovações, desembolsos, reembolsos e relatórios de microcrédito — tudo num só sistema, com as tuas próprias taxas e equipa.
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 1 }}>
          <CheckCircleOutline color="success" />
          <Typography variant="body1">Sem cartão de crédito para começar</Typography>
        </Stack>
        <Stack direction="row" spacing={2} justifyContent="center">
          <CheckCircleOutline color="success" />
          <Typography variant="body1">Trial grátis de 7 dias</Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={4} justifyContent="center">
          {isAuthenticated ? (
            <Button variant="contained" size="large" onClick={() => navigate("/portal")}>
              Ir para o Portal
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              color="success"
              onClick={() => scrollToSection("sou-financeira")}
            >
              Começar Grátis
            </Button>
          )}
        </Stack>

        {!isAuthenticated && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Já és cliente de uma financeira? Pede o link de registo a ela.
          </Typography>
        )}
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
                    1. Registe-se
                  </Typography>
                  <Typography color="textSecondary">
                    Crie a conta da sua financeira.
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
