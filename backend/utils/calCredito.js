function calcularPrestacao(
  valor,
  taxaAnual,
  meses
) {
  const i = taxaAnual / 100 / 12;

  return (
    (valor *
      i *
      Math.pow(1 + i, meses)) /
    (Math.pow(1 + i, meses) - 1)
  );
}

module.exports = calcularPrestacao;