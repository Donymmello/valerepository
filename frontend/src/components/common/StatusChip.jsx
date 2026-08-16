import { Chip } from "@mui/material";
import { getStatusColor, getStatusLabel } from "../../utils/formatters";

/**
 * Chip de estado de um pedido, já traduzido e colorido conforme
 * utils/formatters (getStatusLabel/getStatusColor). Evita repetir
 * a mesma chamada em cada tabela/lista.
 */
export default function StatusChip({ status, size = "small", ...props }) {
  return (
    <Chip label={getStatusLabel(status)} color={getStatusColor(status)} size={size} {...props} />
  );
}
