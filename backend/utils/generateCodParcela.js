function generateCodParcela({
  pedidoId,
  valorTotal,
  numeroParcelas,
  primeiraDataVencimento,
}) {
  const parcelas = [];
  const valorBase = Number(valorTotal) / Number(numeroParcelas);

  for (let i = 0; i < numeroParcelas; i++) {
    const data = new Date(primeiraDataVencimento);
    data.setMonth(data.getMonth() + i);

    parcelas.push({
      pedidoId,
      numeroParcela: i + 1,
      valorPrevisto: Number(valorBase.toFixed(2)),
      dataVencimento: data.toISOString().split("T")[0],
      estado: "PENDENTE",
    });
  }

  return parcelas;
}

module.exports = generateCodParcela;