import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import {
  resetPasswordRequest,
} from "../../api/auth.api";

export default function ResetPassword() {
  const [params] = useSearchParams();

  const token = params.get("token");

  const [password, setPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data =
      await resetPasswordRequest({
        token,
        password,
      });

    setMessage(data.message);
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5">
        Redefinir Password
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          type="password"
          label="Nova Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <Button
          type="submit"
          variant="contained"
        >
          Alterar Password
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