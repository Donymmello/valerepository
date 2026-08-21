import { Component } from "react";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";

/*
  Apanha erros de render não tratados em qualquer componente abaixo dele
  na árvore, para mostrar um ecrã de erro amigável em vez de a aplicação
  ficar em branco. Tem de ser um componente de classe — é a única forma
  de implementar um error boundary em React.
*/
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erro não tratado capturado pelo ErrorBoundary:", error, errorInfo);
  }

  handleRecarregar = () => {
    window.location.reload();
  };

  handleVoltarInicio = () => {
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f4f6f8" }}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, border: "1px solid #e0e0e0", textAlign: "center" }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1a237e", mb: 1 }}>
              Ocorreu um erro inesperado
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Algo correu mal ao carregar esta página. Pode tentar recarregar ou voltar ao início.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="outlined" onClick={this.handleVoltarInicio}>
                Voltar ao início
              </Button>
              <Button variant="contained" onClick={this.handleRecarregar}>
                Recarregar página
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }
}
