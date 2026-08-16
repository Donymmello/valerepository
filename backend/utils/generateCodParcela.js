function generateCodParcela({
  creditoId,
  empresaId,
  prestacao,
  numeroParcelas,
  primeiraDataVencimento,
}) {
  const parcelas = [];

  for (let i = 0; i < Number(numeroParcelas); i++) {
    // +1: a primeira prestação vence 1 mês depois do desembolso, não no
    // mesmo dia (i=0 já significa "primeira parcela").
    const data = new Date(primeiraDataVencimento);
    data.setMonth(data.getMonth() + i + 1);

    const valorPrestacao = Number(Number(prestacao).toFixed(2));

    parcelas.push({
      creditoId,
      empresaId,
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