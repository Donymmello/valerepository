export function formatCurrency(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "MZN",
    minimumFractionDigits: 2,
  }).format(number);
}

export function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-PT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getStatusLabel(status) {
  const map = {
    RASCUNHO: "Rascunho",
    SUBMETIDO: "Submetido",
    EM_ANALISE: "Em Análise",
    EM_VALIDACAO: "Em Validação",
    APROVADO: "Aprovado",
    REJEITADO: "Rejeitado",
    DESEMBOLSADO: "Desembolsado",
    ENCERRADO: "Encerrado",
  };

  return map[status] || status || "-";
}

export function getStatusColor(status) {
  const map = {
    RASCUNHO: "default",
    SUBMETIDO: "info",
    EM_ANALISE: "warning",
    EM_VALIDACAO: "secondary",
    APROVADO: "success",
    REJEITADO: "error",
    DESEMBOLSADO: "primary",
    ENCERRADO: "default",
  };

  return map[status] || "default";
}