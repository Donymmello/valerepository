function calcularPrestacao(
  valor,
  taxaAnual,
  meses
) {
  // Taxa mensal efetiva (equivalente composto), alinhada com o conceito de
  // TAEG usado pelo Banco de Moçambique (Aviso 8/GBM/2021): a taxa anual
  // anunciada é o custo efetivo do ano inteiro, não taxaMensal x 12.
  // (1+taxaAnual)^(1/12) - 1 garante que compor esta taxa 12 vezes fecha
  // exatamente na taxa anual. Antes dividia-se taxaAnual/100/12 (taxa
  // nominal), o que produzia um custo anual real ligeiramente ACIMA do
  // anunciado (ex: 24% nominal virava ~26,8% efetivo ao compor).
  const i = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;

  return (
    (valor *
      i *
      Math.pow(1 + i, meses)) /
    (Math.pow(1 + i, meses) - 1)
  );
}

module.exports = calcularPrestacao;