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

    const valorPrestacao = Number(Number(prestacao).toFixed(2));

    parcelas.push({
      creditoId,
      numeroParcela: i + 1,
      valorPrevisto: valorPrestacao,
      valorPago: 0,
      saldoParcela: valorPrestacao,
      dataVencimento: data.toISOString().split("T")[0],
      estado: "PENDENTE",
    });
  }

  return parcelas;
}

module.exports = generateCodParcela;