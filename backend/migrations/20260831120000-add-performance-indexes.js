"use strict";

/*
  Auditoria de performance encontrou: praticamente nenhuma foreign key
  tinha índice (references: sozinho não cria índice no Postgres), e três
  colunas, creditos.numero_contrato, desembolsos.referencia,
  reembolsos.referencia, tinham unique:true GLOBAL, o mesmo bug já
  corrigido em mutuarios.codigo_mutuario e pedidos_credito.numero_pedido
  pela migration 20260824130000 (impede duas empresas diferentes de
  usarem o mesmo número/referência, quando só deveria ser único dentro
  da mesma empresa).

  Esta migration:
  1. Troca os 3 unique de coluna simples por unique compostos (empresa_id, coluna).
  2. Adiciona índices em empresa_id (ou na FK relevante) nas tabelas que
     mais crescem e que quase sempre são filtradas por tenant: creditos,
     parcelas_pagamento, desembolsos, reembolsos, notificacoes,
     logs_auditoria, comprovativos.

  Idempotente, segue o mesmo padrão de 20260824130000 (verifica índices
  existentes antes de mexer, tenta DROP CONSTRAINT antes de removeIndex
  porque um unique:true de coluna vira UNIQUE CONSTRAINT no Postgres).
*/

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

  try {
    await queryInterface.removeConstraint(tabela, alvo.name);
  } catch (erro) {
    await queryInterface.removeIndex(tabela, alvo.name);
  }
}

async function addIndexSeNaoExistir(queryInterface, tabela, colunas, opcoes) {
  if (!(await indiceExiste(queryInterface, tabela, opcoes.name))) {
    await queryInterface.addIndex(tabela, colunas, opcoes);
  }
}

module.exports = {
  async up(queryInterface) {
    // ---- 1. Unicidade por empresa (substitui os 3 unique globais) ----
    await removerIndiceSeExistir(queryInterface, "creditos", ["numero_contrato"]);
    await addIndexSeNaoExistir(queryInterface, "creditos", ["empresa_id", "numero_contrato"], {
      unique: true,
      name: "creditos_empresa_id_numero_contrato_unique",
    });

    await removerIndiceSeExistir(queryInterface, "desembolsos", ["referencia"]);
    await addIndexSeNaoExistir(queryInterface, "desembolsos", ["empresa_id", "referencia"], {
      unique: true,
      name: "desembolsos_empresa_id_referencia_unique",
    });

    await removerIndiceSeExistir(queryInterface, "reembolsos", ["referencia"]);
    await addIndexSeNaoExistir(queryInterface, "reembolsos", ["empresa_id", "referencia"], {
      unique: true,
      name: "reembolsos_empresa_id_referencia_unique",
    });

    // ---- 2. Índices de leitura (empresa_id + FKs mais consultadas) ----
    await addIndexSeNaoExistir(queryInterface, "creditos", ["empresa_id", "estado"], {
      name: "creditos_empresa_id_estado",
    });
    await addIndexSeNaoExistir(queryInterface, "creditos", ["mutuario_id"], {
      name: "creditos_mutuario_id",
    });
    await addIndexSeNaoExistir(queryInterface, "creditos", ["pedido_id"], {
      name: "creditos_pedido_id",
    });

    await addIndexSeNaoExistir(
      queryInterface,
      "parcelas_pagamento",
      ["empresa_id", "estado", "data_vencimento"],
      { name: "parcelas_pagamento_empresa_id_estado_data_vencimento" }
    );
    await addIndexSeNaoExistir(queryInterface, "parcelas_pagamento", ["credito_id"], {
      name: "parcelas_pagamento_credito_id",
    });

    await addIndexSeNaoExistir(queryInterface, "desembolsos", ["empresa_id"], {
      name: "desembolsos_empresa_id",
    });
    await addIndexSeNaoExistir(queryInterface, "desembolsos", ["pedido_id"], {
      name: "desembolsos_pedido_id",
    });

    await addIndexSeNaoExistir(queryInterface, "reembolsos", ["empresa_id"], {
      name: "reembolsos_empresa_id",
    });
    await addIndexSeNaoExistir(queryInterface, "reembolsos", ["credito_id"], {
      name: "reembolsos_credito_id",
    });
    await addIndexSeNaoExistir(queryInterface, "reembolsos", ["parcela_id"], {
      name: "reembolsos_parcela_id",
    });

    await addIndexSeNaoExistir(queryInterface, "notificacoes", ["user_id", "created_at"], {
      name: "notificacoes_user_id_created_at",
    });
    await addIndexSeNaoExistir(queryInterface, "notificacoes", ["pedido_id"], {
      name: "notificacoes_pedido_id",
    });

    await addIndexSeNaoExistir(queryInterface, "logs_auditoria", ["user_id", "created_at"], {
      name: "logs_auditoria_user_id_created_at",
    });
    await addIndexSeNaoExistir(queryInterface, "logs_auditoria", ["entidade", "entidade_id"], {
      name: "logs_auditoria_entidade_entidade_id",
    });

    await addIndexSeNaoExistir(queryInterface, "comprovativos", ["credito_id"], {
      name: "comprovativos_credito_id",
    });
    await addIndexSeNaoExistir(queryInterface, "comprovativos", ["parcela_id"], {
      name: "comprovativos_parcela_id",
    });
    await addIndexSeNaoExistir(queryInterface, "comprovativos", ["pedido_id"], {
      name: "comprovativos_pedido_id",
    });
    await addIndexSeNaoExistir(queryInterface, "comprovativos", ["user_id"], {
      name: "comprovativos_user_id",
    });
  },

  async down(queryInterface) {
    const nomes = [
      ["creditos", "creditos_empresa_id_estado"],
      ["creditos", "creditos_mutuario_id"],
      ["creditos", "creditos_pedido_id"],
      ["parcelas_pagamento", "parcelas_pagamento_empresa_id_estado_data_vencimento"],
      ["parcelas_pagamento", "parcelas_pagamento_credito_id"],
      ["desembolsos", "desembolsos_empresa_id"],
      ["desembolsos", "desembolsos_pedido_id"],
      ["reembolsos", "reembolsos_empresa_id"],
      ["reembolsos", "reembolsos_credito_id"],
      ["reembolsos", "reembolsos_parcela_id"],
      ["notificacoes", "notificacoes_user_id_created_at"],
      ["notificacoes", "notificacoes_pedido_id"],
      ["logs_auditoria", "logs_auditoria_user_id_created_at"],
      ["logs_auditoria", "logs_auditoria_entidade_entidade_id"],
      ["comprovativos", "comprovativos_credito_id"],
      ["comprovativos", "comprovativos_parcela_id"],
      ["comprovativos", "comprovativos_pedido_id"],
      ["comprovativos", "comprovativos_user_id"],
    ];
    for (const [tabela, nome] of nomes) {
      if (await indiceExiste(queryInterface, tabela, nome)) {
        await queryInterface.removeIndex(tabela, nome);
      }
    }

    if (await indiceExiste(queryInterface, "creditos", "creditos_empresa_id_numero_contrato_unique")) {
      await queryInterface.removeIndex("creditos", "creditos_empresa_id_numero_contrato_unique");
    }
    await queryInterface.addIndex("creditos", ["numero_contrato"], { unique: true });

    if (await indiceExiste(queryInterface, "desembolsos", "desembolsos_empresa_id_referencia_unique")) {
      await queryInterface.removeIndex("desembolsos", "desembolsos_empresa_id_referencia_unique");
    }
    await queryInterface.addIndex("desembolsos", ["referencia"], { unique: true });

    if (await indiceExiste(queryInterface, "reembolsos", "reembolsos_empresa_id_referencia_unique")) {
      await queryInterface.removeIndex("reembolsos", "reembolsos_empresa_id_referencia_unique");
    }
    await queryInterface.addIndex("reembolsos", ["referencia"], { unique: true });
  },
};
