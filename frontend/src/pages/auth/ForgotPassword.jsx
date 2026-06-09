import { useState } from "react";
import {
  Alert,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { forgotPasswordRequest } from "../../api/auth.api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data =
      await forgotPasswordRequest(email);

    setMessage(data.message);
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5">
        Esqueci a Senha
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <Button
          type="submit"
          variant="contained"
        >
          Enviar
        </Button>
      </form>

      {message && (
        <Alert sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
    </Paper>
  );
}