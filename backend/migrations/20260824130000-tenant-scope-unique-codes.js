"use strict";

/*
  Bug encontrado: codigo_mutuario (mutuarios) e numero_pedido
  (pedidos_credito) tinham `unique: true` a nível de coluna, um índice
  único GLOBAL, em toda a plataforma. Isto está errado num sistema
  multi-tenant: o código só precisa de ser único dentro da mesma
  empresa, não entre empresas diferentes. Na prática, impedia (ou, no
  caso do documento_numero, que nem tinha constraint na BD, só
  verificação na aplicação, deixava passar) duas empresas distintas de
  usarem o mesmo código, e o importador de Excel (excell.service.js)
  tinha o mesmo problema nas suas verificações de duplicado em memória.

  Esta migration troca os dois índices únicos de coluna simples por
  índices únicos compostos (empresa_id, código), o mesmo padrão já
  usado para email de convite, etc.

  Idempotente: verifica os índices existentes antes de mexer, para
  correr sem erro tanto numa BD onde o índice antigo já existe (o caso
  normal, numa BD já em uso) como numa BD nova, onde a baseline já foi
  criada a partir dos models atuais (sem o unique de coluna simples) e
  por isso o índice antigo nunca chegou a existir.
*/

const NOME_INDICE_MUTUARIO = "mutuarios_empresa_id_codigo_mutuario_unique";
const NOME_INDICE_PEDIDO = "pedidos_credito_empresa_id_numero_pedido_unique";

async function indiceExiste(queryInterface, tabela, nomeIndice) {
  const indices = await queryInterface.showIndex(tabela);
  return indices.some((indice) => indice.name === nomeIndice);
}

async function removerIndiceSeExistir(queryInterface, tabela, colunas) {
  const indices = await queryInterface.showIndex(tabela);
  const alvo = indices.find(
    (indice) =>
      indice.unique &&
      indice.fields?.length === colunas.length &&
      indice.fields.every((f, i) => f.attribute === colunas[i])
  );
  if (!alvo) return;

  /*
    O `unique: true` de coluna, quando a tabela é criada por
    createTable(model.rawAttributes) (ver migrations/00000000000000-baseline.js),
    vira uma UNIQUE CONSTRAINT no Postgres, não um índice solto, mesmo
    que apareça no showIndex() como se fosse um índice normal. O
    Postgres não deixa fazer DROP INDEX diretamente num índice que é a
    "casa" de uma constraint (erro real visto em produção: "cannot drop
    index ... because constraint ... requires it"); é preciso
    DROP CONSTRAINT, que remove o índice de suporte automaticamente.
    Tenta como constraint primeiro (o caso comum aqui) e cai para
    removeIndex se não for uma constraint (índice criado à parte).
  */
  try {
    await queryInterface.removeConstraint(tabela, alvo.name);
  } catch (erro) {
    await queryInterface.removeIndex(tabela, alvo.name);
  }
}

module.exports = {
  async up(queryInterface) {
    await removerIndiceSeExistir(queryInterface, "mutuarios", ["codigo_mutuario"]);
    if (!(await indiceExiste(queryInterface, "mutuarios", NOME_INDICE_MUTUARIO))) {
      await queryInterface.addIndex("mutuarios", ["empresa_id", "codigo_mutuario"], {
        unique: true,
        name: NOME_INDICE_MUTUARIO,
      });
    }

    await removerIndiceSeExistir(queryInterface, "pedidos_credito", ["numero_pedido"]);
    if (!(await indiceExiste(queryInterface, "pedidos_credito", NOME_INDICE_PEDIDO))) {
      await queryInterface.addIndex("pedidos_credito", ["empresa_id", "numero_pedido"], {
        unique: true,
        name: NOME_INDICE_PEDIDO,
      });
    }
  },

  async down(queryInterface) {
    if (await indiceExiste(queryInterface, "mutuarios", NOME_INDICE_MUTUARIO)) {
      await queryInterface.removeIndex("mutuarios", NOME_INDICE_MUTUARIO);
    }
    await queryInterface.addIndex("mutuarios", ["codigo_mutuario"], { unique: true });

    if (await indiceExiste(queryInterface, "pedidos_credito", NOME_INDICE_PEDIDO)) {
      await queryInterface.removeIndex("pedidos_credito", NOME_INDICE_PEDIDO);
    }
    await queryInterface.addIndex("pedidos_credito", ["numero_pedido"], { unique: true });
  },
};
