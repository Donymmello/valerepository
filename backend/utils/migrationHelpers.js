/*
  Helpers partilhados entre migrations que precisam de verificar se um
  ENUM já contém certos valores, para ficarem idempotentes (seguras de
  correr mais de uma vez).

  A forma de verificar difere por dialeto:
  - MySQL: describeTable devolve o tipo como texto, ex: "enum('A','B')"
    — basta procurar a substring.
  - Postgres: ENUMs são um tipo à parte (catálogo pg_type/pg_enum), a
    coluna em describeTable aparece só como "USER-DEFINED" — precisa de
    consultar o catálogo do sistema. Sequelize nomeia o tipo como
    enum_<tabela>_<coluna> por omissão.
*/

async function enumJaTemValores(queryInterface, tabela, coluna, valoresEsperados) {
  if (queryInterface.sequelize.getDialect() === "postgres") {
    const tipoEnum = `enum_${tabela}_${coluna}`;
    const linhas = await queryInterface.sequelize.query(
      `SELECT e.enumlabel FROM pg_type t
       JOIN pg_enum e ON t.oid = e.enumtypid
       WHERE t.typname = :tipoEnum`,
      { replacements: { tipoEnum }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const valoresAtuais = linhas.map((linha) => linha.enumlabel);
    return valoresEsperados.every((valor) => valoresAtuais.includes(valor));
  }

  const descricao = await queryInterface.describeTable(tabela);
  const tipoAtual = descricao[coluna]?.type || "";
  return valoresEsperados.every((valor) => tipoAtual.includes(valor));
}

module.exports = { enumJaTemValores };
