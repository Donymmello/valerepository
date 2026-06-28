import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CalculateOutlined as CalculateOutlinedIcon, Close as CloseIcon } from "@mui/icons-material";
import { getMinhasSimulacoesRequest } from "../../api/public.api";

export default function Simulacoes() {
  const navigate = useNavigate();
  const [simulacoes, setSimulacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarSimulacoes = async () => {
      try {
        const dados = await getMinhasSimulacoesRequest();
        if (Array.isArray(dados)) {
          setSimulacoes(dados);
        }
      } catch (err) {
        console.error("Erro ao procurar simulações:", err);
      } finally {
        setLoading(false);
      }
    };

    buscarSimulacoes();
  }, []);

  return (
    <Box>
      {/* Título integrado ao padrão do Portal */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a" }}>
            Histórico de Simulações
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Consulte os cálculos e condições simuladas para o seu microcrédito.
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {loading ? (
        <Box display="flex" justifyContent="center" sx={{ my: 5 }}>
          <CircularProgress />
        </Box>
      ) : simulacoes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed #e2e8f0", bgcolor: "#fff" }}>
          <Typography color="textSecondary">
            Ainda não realizou nenhuma simulação de crédito.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {simulacoes.map((item, index) => (
            <Paper 
              key={item.id || index} 
              sx={{ 
                p: 3, 
                borderRadius: 3, 
                boxShadow: "0px 2px 8px rgba(0,0,0,0.04)",
                border: "1px solid #e2e8f0",
                borderLeft: "6px solid #3b82f6", // Azul combinando com o Avatar do seu Layout
                bgcolor: "#fff"
              }}
            >
              <Grid container alignItems="center" spacing={2}>
                {/* Ícone de Calculadora */}
                <Grid item xs={2} sm={1} display="flex" justifyContent="center">
                  <CalculateOutlinedIcon sx={{ fontSize: 32, color: "#3b82f6" }} />
                </Grid>

                {/* Dados da Simulação */}
                <Grid item xs={10} sm={8}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
                      MZN {Number(item.valor || item.amount || 0).toLocaleString()}
                    </Typography>
                    {index === 0 && (
                      <Chip label="Recente" color="primary" size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }} />
                    )}
                  </Stack>
                  <Typography variant="body2" color="textSecondary">
                    Prazo pretendido: <strong>{item.parcelas || item.meses || 0} meses</strong>
                  </Typography>
                </Grid>

                {/* Data no canto direito */}
                <Grid item xs={12} sm={3} sx={{ textAlign: { xs: "left", sm: "right" }, pl: { xs: 7, sm: 0 } }}>
                  <Typography variant="caption" display="block" color="textSecondary" sx={{ fontWeight: 600, fontSize: "0.65rem", letterSpacing: 0.5 }}>
                    SIMULADO EM
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: "#334155" }}>
                    {item.created_at || item.data 
                      ? new Date(item.created_at || item.data).toLocaleDateString("pt-PT") 
                      : "---"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
