import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { verifyOTPRequest } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 5 }}>
          <Paper elevation={4} sx={{ p: 4 }}>
            <Alert severity="error">
              Acesso inválido. Por favor, registe-se novamente.
            </Alert>
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => navigate("/register-mutuario")}
            >
              Voltar ao Registo
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (!otp || otp.length !== 6) {
        setError("O código OTP deve ter 6 dígitos.");
        setLoading(false);
        return;
      }

      const response = await verifyOTPRequest({
        email,
        otp,
      });

      setMessage(response.message);

      // Auto login após verificação bem-sucedida
      if (response.token) {
        setTimeout(() => {
          login(response.token, response.user);
          navigate("/portal");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Erro ao verificar OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 5 }}>
        <Paper elevation={4} sx={{ p: 4 }}>
          <Typography variant="h5" mb={1}>
            Verificar Email
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={3}>
            Enviámos um código OTP para <strong>{email}</strong>
          </Typography>

          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Código OTP (6 dígitos)"
              name="otp"
              type="text"
              inputProps={{
                maxLength: 6,
                pattern: "[0-9]*",
              }}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              margin="normal"
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3 }}
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  A verificar...
                </>
              ) : (
                "Verificar Código"
              )}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Não recebeu o código?{" "}
            <Button
              size="small"
              onClick={() => navigate("/register-mutuario")}
            >
              Solicitar novo
            </Button>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
