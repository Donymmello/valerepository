# Contexto do Projeto - Sistema de Gestao de Creditos

Este documento resume o estado e a linha de raciocinio do projeto para facilitar trabalho com outros agentes sem repetir toda a exploracao do codigo.

## Objetivo

Sistema web multi-tenant para gestao de credito, nome de marca "Tshemba", produto da Vektar Technologies MZ (empresa-mae, www.vektramz.com), cobrindo o ciclo de:

1. registo do mutuario;
2. simulacao de credito;
3. submissao de pedido;
4. analise e validacao;
5. aprovacao por niveis;
6. desembolso;
7. reembolso;
8. encerramento do credito.

O sistema separa duas areas:

- Portal do Mutuario: usado por clientes/mutuarios.
- Backoffice Interno: usado por perfis administrativos.

## Stack

- Backend: Node.js, Express, Sequelize, MySQL, JWT, bcryptjs, multer, xlsx.
- Frontend: React, Vite, React Router, Axios, Material UI.
- Base de dados: MySQL.
- Execucao local/container: docker-compose com MySQL, backend e frontend.

## Estrutura Principal

- `backend/server.js`: cria app Express, middlewares globais, regista rotas e inicia Sequelize.
- `backend/models/index.js`: importa modelos e define associacoes Sequelize.
- `backend/controllers/`: logica dos modulos.
- `backend/routes/`: rotas Express.
- `backend/utils/regrasPedido.js`: matriz central de permissoes, status e transicoes do pedido.
- `frontend/src/routes/AppRoutes.jsx`: rotas principais do frontend.
- `frontend/src/context/AuthContext.jsx`: sessao, login, registo e logout.
- `frontend/src/api/axios.js`: instancia Axios com token JWT.

## Perfis

Perfis internos:

- `ADMIN`
- `GESTOR`
- `ANALISTA`
- `DIRETOR`

Perfil do portal:

- `USER`

Algumas rotas frontend tambem aceitam `MUTUARIO`, mas o registo autonomo atual cria utilizador com role `USER`.

## Fluxo do Mutuario

1. Mutuario pode registar-se publicamente.
2. O sistema cria um `User` com role `USER`.
3. O sistema cria tambem o respetivo `Mutuario`.
4. O mutuario pode fazer login.
5. No portal, pode ver perfil, simulacoes, pedidos, creditos, notificacoes e extratos.

## Fluxo do Pedido de Credito

Status principais em `backend/utils/regrasPedido.js`:

- `RASCUNHO`
- `SUBMETIDO`
- `EM_ANALISE`
- `EM_VALIDACAO`
- `APROVADO`
- `REJEITADO`
- `DESEMBOLSADO`
- `ENCERRADO`

Fluxo de aprovacao:

1. Etapa 1: `SUBMETIDO` para `EM_ANALISE`.
2. Etapa 2: `EM_ANALISE` para `EM_VALIDACAO`.
3. Etapa 3: `EM_VALIDACAO` para `APROVADO`.
4. Rejeicao pode acontecer nas etapas de analise/validacao e muda para `REJEITADO`.

Permissoes por etapa:

- Etapa 1: `ADMIN`, `GESTOR`, `ANALISTA`.
- Etapa 2: `ADMIN`, `GESTOR`.
- Etapa 3: `ADMIN`, `DIRETOR`.

## Fluxo Financeiro

- Apenas pedidos `APROVADO` podem ser desembolsados.
- Depois do desembolso, o pedido passa para `DESEMBOLSADO`.
- Reembolsos sao registados sobre pedidos desembolsados.
- Quando o total reembolsado cobre o total desembolsado, o pedido passa para `ENCERRADO`.

## Modulos Relevantes

Backend:

- Auth: `backend/controllers/auth.controller.js`, `backend/routes/auth.routes.js`.
- Pedidos: `backend/controllers/pedidoCredito.controller.js`, `backend/routes/pedidoCredito.routes.js`.
- Aprovacoes: `backend/controllers/aprovacaoPedido.controller.js`, `backend/routes/aprovacaoPedido.routes.js`.
- Desembolsos: `backend/controllers/desembolso.controller.js`, `backend/routes/desembolso.routes.js`.
- Reembolsos: `backend/controllers/reembolso.controller.js`, `backend/routes/reembolso.routes.js`.
- Simulacoes: `backend/controllers/simulacao.controller.js`, `backend/routes/simulacao.routes.js`.
- Creditos: existem ficheiros novos, mas alguns estavam vazios na ultima leitura:
  - `backend/controllers/credito.controller.js`
  - `backend/routes/credito.routes.js`
  - `backend/services/credito.service.js`

Frontend:

- Rotas: `frontend/src/routes/AppRoutes.jsx`.
- Layout portal: `frontend/src/components/layout/PortalLayout.jsx`.
- Layout backoffice: `frontend/src/components/layout/BackofficeLayout.jsx`.
- Portal: `frontend/src/pages/portal/`.
- Backoffice: `frontend/src/pages/admin/`.
- Publico/landing: `frontend/src/pages/public/LandingPage.jsx`.

## Pontos de Atencao Encontrados

### 1. Risco critico em `backend/models/index.js`

Foi encontrado um bloco usando `models.Simulacao`, `models.Desembolso`, `models.Mutuario` e `models.Reembolso`, mas nao existe variavel `models` definida nesse ficheiro.

Bloco problematico:

```js
Credito.belongsTo(models.Simulacao, {
  foreignKey: "simulacaoId",
  as: "simulacao",
});

Credito.belongsTo(models.Desembolso, {
  foreignKey: "desembolsoId",
  as: "desembolso",
});

Credito.belongsTo(models.Mutuario, {
  foreignKey: "mutuarioId",
  as: "mutuario",
});

Credito.hasMany(models.Reembolso, {
  foreignKey: "creditoId",
  as: "reembolsos",
});
```

Esse bloco deve ser removido, porque as associacoes equivalentes ja aparecem logo abaixo usando as variaveis corretas:

- `Credito.belongsTo(Simulacao, ...)`
- `Credito.belongsTo(Desembolso, ...)`
- `Credito.belongsTo(Mutuario, ...)`
- `Credito.hasMany(Reembolso, ...)`

### 2. Associacao `Credito` e `Reembolso`

`backend/models/index.js` associa:

```js
Credito.hasMany(Reembolso, {
  foreignKey: "creditoId",
  as: "reembolsos",
});
```

Mas `backend/models/reembolso.model.js` precisa ter o campo `creditoId` se essa relacao for usada. Na ultima leitura, o modelo de reembolso tinha `pedidoId`, mas nao estava claro que tivesse `creditoId`.

Antes de implementar o modulo de creditos, confirmar a modelagem:

- reembolso pertence diretamente ao pedido;
- ou reembolso pertence ao credito;
- ou ambos, com migracao/ajuste controlado.

### 3. Ficheiros do modulo `Credito` vazios

Na ultima leitura, estes ficheiros existiam mas estavam vazios:

- `backend/controllers/credito.controller.js`
- `backend/routes/credito.routes.js`
- `backend/services/credito.service.js`

Nao assumir que o modulo Credito esta completo.

### 4. Testes ainda nao validam fluxos reais

`backend/__tests__/criticalFlows.test.js` tem muitos testes placeholder com:

```js
expect(true).toBe(true);
```

Logo, a suite atual nao garante que os fluxos criticos estejam realmente protegidos.

### 5. Texto com codificacao quebrada

Varios ficheiros e README mostram acentos como `Ã£`, `Ã©`, etc. Isso nao necessariamente quebra execucao, mas afeta mensagens e apresentacao.

### 6. Inconsistencias de nomes

Exemplos vistos:

- `Notifacacoes` em vez de `Notificacoes`.
- `requistos` em vez de `requisitos`.
- `excell` em vez de `excel`.

Corrigir nomes exige cuidado porque pode afetar imports e rotas.

## Ordem Recomendada Para Evoluir Sem Quebrar

1. Corrigir primeiro o erro evidente de `models.*` em `backend/models/index.js`.
2. Testar se os modelos carregam sem erro.
3. Validar se o backend inicia sem erro de associacao Sequelize.
4. Confirmar a modelagem do modulo `Credito`.
5. Implementar `Credito` apenas depois de decidir se ele nasce do desembolso, do pedido aprovado ou da simulacao.
6. Criar testes reais para os fluxos minimos:
   - login;
   - registo de mutuario;
   - criar pedido;
   - aprovar por etapas;
   - desembolsar;
   - reembolsar;
   - encerrar.
7. Melhorar UX/UI e nomes depois da base funcional estar estavel.

## Regra de Trabalho Para Proximos Agentes

Nao fazer grandes refactors antes de garantir que o backend arranca.

Evitar mexer em muitas areas ao mesmo tempo. Preferir alteracoes pequenas:

1. uma correcao;
2. um teste ou verificacao;
3. nova leitura do impacto;
4. proxima correcao.

O projeto esta funcionalmente bem desenhado, mas esta em fase de integracao de novos modulos. O maior risco agora e quebrar associacoes Sequelize ou misturar `PedidoCredito`, `Simulacao`, `Desembolso`, `Credito` e `Reembolso` sem uma regra clara.
