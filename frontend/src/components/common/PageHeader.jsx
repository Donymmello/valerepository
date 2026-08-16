import { Box, Stack, Typography } from "@mui/material";

/**
 * Cabeçalho padrão de página: título + subtítulo à esquerda,
 * ações opcionais à direita (ex: botão "Novo Pedido").
 * Substitui o bloco Stack/Typography que estava copiado em quase
 * todas as páginas de listagem.
 */
export default function PageHeader({ title, subtitle, actions, mb = 3 }) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", md: "center" }}
      spacing={2}
      mb={mb}
    >
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }} mb={0.5}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      {actions && <Box>{actions}</Box>}
    </Stack>
  );
}
