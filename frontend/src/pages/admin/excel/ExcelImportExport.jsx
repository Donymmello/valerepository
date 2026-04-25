import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import {
  exportarDesembolsosExcelRequest,
  exportarMutuariosExcelRequest,
  exportarPedidosExcelRequest,
  exportarReembolsosExcelRequest,
  exportarRelatorioFinanceiroExcelRequest,
  importarMutuariosExcelRequest,
  importarPedidosExcelRequest,
} from "../../../api/admin.api";
import { useAuth } from "../../../context/AuthContext";

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function ExcelImportExport() {
  const { user } = useAuth();

  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  const podeImportar = ["ADMIN", "GESTOR"].includes(user?.role);

  const executarExportacao = async (actionKey, requestFn, fileName) => {
    try {
      setLoadingAction(actionKey);
      setError("");

      const blob = await requestFn();
      downloadBlob(blob, fileName);

      setSuccessMessage("Exportação concluída com sucesso.");
      setSuccessOpen(true);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao exportar ficheiro Excel.");
    } finally {
      setLoadingAction("");
    }
  };

  const executarImportacao = async (actionKey, requestFn, event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setLoadingAction(actionKey);
      setError("");

      const resultado = await requestFn(file);

      setSuccessMessage(
        `${resultado?.message || "Importação concluída."}`
      );
      setSuccessOpen(true);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao importar ficheiro Excel.");
    } finally {
      setLoadingAction("");
      event.target.value = "";
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700 }} mb={1}>
        Importação e Exportação Excel
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Exporte dados do sistema e importe mutuários ou pedidos via ficheiro Excel.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
            Exportações
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="contained"
              onClick={() =>
                executarExportacao(
                  "export-mutuarios",
                  exportarMutuariosExcelRequest,
                  "mutuarios.xlsx"
                )
              }
              disabled={loadingAction === "export-mutuarios"}
            >
              {loadingAction === "export-mutuarios" ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Exportar Mutuários"
              )}
            </Button>

            <Button
              variant="contained"
              onClick={() =>
                executarExportacao(
                  "export-pedidos",
                  exportarPedidosExcelRequest,
                  "pedidos.xlsx"
                )
              }
              disabled={loadingAction === "export-pedidos"}
            >
              {loadingAction === "export-pedidos" ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Exportar Pedidos"
              )}
            </Button>

            <Button
              variant="contained"
              onClick={() =>
                executarExportacao(
                  "export-desembolsos",
                  exportarDesembolsosExcelRequest,
                  "desembolsos.xlsx"
                )
              }
              disabled={loadingAction === "export-desembolsos"}
            >
              {loadingAction === "export-desembolsos" ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Exportar Desembolsos"
              )}
            </Button>

            <Button
              variant="contained"
              onClick={() =>
                executarExportacao(
                  "export-reembolsos",
                  exportarReembolsosExcelRequest,
                  "reembolsos.xlsx"
                )
              }
              disabled={loadingAction === "export-reembolsos"}
            >
              {loadingAction === "export-reembolsos" ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Exportar Reembolsos"
              )}
            </Button>

            <Button
              variant="contained"
              onClick={() =>
                executarExportacao(
                  "export-relatorio-financeiro",
                  exportarRelatorioFinanceiroExcelRequest,
                  "relatorio_financeiro.xlsx"
                )
              }
              disabled={loadingAction === "export-relatorio-financeiro"}
            >
              {loadingAction === "export-relatorio-financeiro" ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Exportar Relatório Financeiro"
              )}
            </Button>
          </Stack>
        </Paper>

        {podeImportar && (
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} mb={2}>
              Importações
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  disabled={loadingAction === "import-mutuarios"}
                >
                  {loadingAction === "import-mutuarios" ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Importar Mutuários"
                  )}
                  <input
                    hidden
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(event) =>
                      executarImportacao(
                        "import-mutuarios",
                        importarMutuariosExcelRequest,
                        event
                      )
                    }
                  />
                </Button>
              </Box>

              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  disabled={loadingAction === "import-pedidos"}
                >
                  {loadingAction === "import-pedidos" ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Importar Pedidos"
                  )}
                  <input
                    hidden
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(event) =>
                      executarImportacao(
                        "import-pedidos",
                        importarPedidosExcelRequest,
                        event
                      )
                    }
                  />
                </Button>
              </Box>
            </Stack>
          </Paper>
        )}
      </Stack>

      <Snackbar
        open={successOpen}
        autoHideDuration={1800}
        onClose={() => setSuccessOpen(false)}
        message={successMessage}
      />
    </Box>
  );
}