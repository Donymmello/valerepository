function generateCodParcela({
  creditoId,
  prestacao,
  numeroParcelas,
  primeiraDataVencimento,
}) {
  const parcelas = [];

  for (let i = 0; i < Number(numeroParcelas); i++) {
    const data = new Date(primeiraDataVencimento);
    data.setMonth(data.getMonth() + i);

    parcelas.push({
      creditoId,
      numeroParcela: i + 1,
      valorPrevisto: Number(prestacao),
      dataVencimento: data.toISOString().split("T")[0],
      estado: "PENDENTE",
    });
  }

  return parcelas;
}

module.exports = generateCodParcela;