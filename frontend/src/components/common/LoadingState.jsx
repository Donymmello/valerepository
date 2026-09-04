import { Box, CircularProgress } from "@mui/material";

/**
 * Estado de carregamento padrão da aplicação: CircularProgress
 * centrado. Usado em ~35 páginas de forma idêntica, este
 * componente evita ter o mesmo Box copiado em cada uma.
 */
export default function LoadingState({ py = 8 }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py }}>
      <CircularProgress />
    </Box>
  );
}
