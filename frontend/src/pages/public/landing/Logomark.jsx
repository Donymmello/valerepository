import { Box } from "@mui/material";
import { CORES } from "../../../theme";

/**
 * Marca simples (não há logo/ficheiro de imagem no projeto): um quadrado
 * arredondado em degradé da cor da marca com um "T" estilizado (Tshemba),
 * só CSS/SVG, sem depender de nenhum asset externo. Partilhado entre
 * Navbar e Footer para não duplicar o gradiente/desenho.
 */
export default function Logomark({ size = 30 }) {
  return (
    <Box component="svg" width={size} height={size} viewBox="0 0 30 30" sx={{ flexShrink: 0 }} aria-hidden="true">
      <defs>
        <linearGradient id="logomarkGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={CORES.marca} />
          <stop offset="100%" stopColor="#4c5fd5" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="26" height="26" rx="8" fill="url(#logomarkGrad)" />
      <path d="M7 9h16M15 9v12" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}
