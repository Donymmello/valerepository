import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Container,
    Grid,
    Link,
    Paper,
    TextField,
    Typography,
    MenuItem,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

export default function RegisterUser() {
    const navigate = useNavigate();
    const { registerUser } = useAuth();

    const [form, setForm] = useState({
        nome: "",
        email: "",
        password: "",
        role: "",
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (event) => {
        setForm((prev) => ({
            ...prev,
            [event.target.name]: event.target.value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            await registerUser(form);
            const selectedRole = form?.role?.toLocaleUpperCase();
            if (selectedRole === "MUTUARIO" || selectedRole === "USER") {
                navigate("/portal");
            } else {
                navigate("/interno");
            }
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "Erro ao registar usuario.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box
                sx={{
                    py: 5,
                }}
            >
                <Paper elevation={4} sx={{ p: 4 }}>
                    <Typography variant="h4" mb={1}>
                        Registo de Conta
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Crie a sua conta para acompanhar os seus pedidos de crédito.
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Nome do utilizador"
                                    name="nome"
                                    value={form.nome}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    select                 // 1. Ativa o modo de seleção (dropdown)
                                    fullWidth
                                    label="Role"
                                    name="role"
                                    value={form.role || ""} // O || "" evita um aviso de erro do React no console
                                    onChange={handleChange}
                                >
                                    {/* 2. Opções que vão aparecer para o usuário clicar */}
                                    <MenuItem value="ADMIN">Administrador</MenuItem>
                                    <MenuItem value="ANALISTA">Analista</MenuItem>
                                    <MenuItem value="DIRETOR">Diretor</MenuItem>
                                    <MenuItem value="GESTOR">Gestor</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>

                        <Button
                            type="submit"
                            variant="contained"
                            sx={{ mt: 3 }}
                            disabled={submitting}
                        >
                            {submitting ? "A registar..." : "Registar"}
                        </Button>
                    </Box>

                    <Box mt={3}>
                        <Typography variant="body2">
                            Já tem conta?{" "}
                            <Link component={RouterLink} to="/login">
                                Entrar
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}