# Casos de teste — Tshemba

Especificação dos casos, independente de implementação. Cada caso é escrito
para ser **atómico** (uma regra), **determinístico** (dados fixos, sem
depender do relógio nem de ids gerados) e **durável** (não parte quando o
layout ou o texto da interface mudam).

Os casos descrevem o que o sistema faz **hoje**, verificado contra o código
em 2026-09-23. Onde uma regra desejável não existe, está dito.

## Nota sobre limites de alçada

Um caso natural de escrever seria *"pedido acima do limite do analista fica
pendente do gestor"*. **Essa regra não existe neste sistema.** A aprovação é
por etapa fixa, sempre três, independentemente do montante — não há campo de
alçada em `Empresa` nem comparação por valor em
`utils/regrasPedido.js`.

| Etapa | Estado de entrada | Quem decide | Aprovado passa a |
|---|---|---|---|
| 1 | SUBMETIDO | ADMIN, GESTOR, ANALISTA | EM_ANALISE, etapa 2 |
| 2 | EM_ANALISE | ADMIN, GESTOR | EM_VALIDACAO, etapa 3 |
| 3 | EM_VALIDACAO | ADMIN, DIRETOR | APROVADO, etapa 3 |

Fonte: `userPodeAprovarNaEtapa` em `backend/utils/regrasPedido.js:226` e
`calcularProximoFluxoAprovacao` em
`backend/controllers/aprovacaoPedido.controller.js:30`.

Se o limite por valor vier a ser implementado, os casos a acrescentar são
dois, não um — ver a secção final.

---

## Fluxo de aprovação

Dados fixos partilhados por esta secção: empresa com `taxaJurosMin` 18 e
`taxaJurosMax` 30; pedido de 100 000 MT a 12 meses.

### CA-01 — Analista aprova na etapa 1 e o pedido avança

- **Dado** um pedido SUBMETIDO na etapa 1 e um utilizador ANALISTA da mesma empresa
- **Quando** aprova o nível 1
- **Então** o estado passa a EM_ANALISE e a etapa a 2

### CA-02 — Analista não decide na etapa 2

- **Dado** o mesmo pedido já em EM_ANALISE, etapa 2
- **Quando** o ANALISTA tenta aprovar o nível 2
- **Então** a decisão é recusada e o estado não muda

É o mais próximo do "limite do analista" que o sistema realmente tem: a
barreira é a etapa, não o montante.

### CA-03 — Diretor não decide na etapa 1

- **Dado** um pedido SUBMETIDO na etapa 1 e um utilizador DIRETOR
- **Quando** tenta aprovar o nível 1
- **Então** a decisão é recusada

Contra-intuitivo, e por isso vale um caso próprio: o perfil mais alto está
excluído da primeira etapa. Se alguém "arrumar" a lista de perfis, isto acende.

### CA-04 — Decisão no nível errado é bloqueada

- **Dado** um pedido na etapa 2
- **Quando** um GESTOR envia uma decisão para o nível 1
- **Então** recebe 400 e a mensagem identifica a etapa atual

### CA-05 — Rejeição preserva a etapa

- **Dado** um pedido em EM_ANALISE, etapa 2
- **Quando** o GESTOR rejeita
- **Então** o estado passa a REJEITADO e a etapa mantém-se em 2

A etapa não recua nem avança numa rejeição. É o detalhe que um refactor
parte em silêncio.

### CA-06 — Requisito obrigatório pendente impede aprovação

- **Dado** um pedido na etapa 1 com um requisito `obrigatorio: true`, `ativo: true`, no estado PENDENTE
- **Quando** o ANALISTA aprova
- **Então** a aprovação é recusada e o pedido continua SUBMETIDO

### CA-07 — Requisito opcional pendente não impede

- **Dado** o mesmo cenário mas com `obrigatorio: false`
- **Quando** o ANALISTA aprova
- **Então** a aprovação prossegue normalmente

Par positivo do CA-06. Sem ele, um bug que bloqueasse todas as aprovações
passava despercebido.

### CA-08 — Etapa 3 aprovada conclui o pedido

- **Dado** um pedido em EM_VALIDACAO, etapa 3, e um DIRETOR
- **Quando** aprova o nível 3
- **Então** o estado passa a APROVADO e a etapa fica em 3

### CA-09 — Taxa fora da faixa da empresa é recusada

- **Dada** uma empresa com faixa de juro 18 a 30 e um pedido na etapa 1
- **Quando** o ANALISTA aprova com taxa 35
- **Então** a aprovação é recusada

---

## Cálculo financeiro

Puramente aritméticos: sem base de dados, sem relógio, sem ids. São os mais
determinísticos da suite e devem ser os mais rápidos.

### CF-01 — Prestação de valores fixos

- **Dado** 100 000 MT, 2% ao mês, 12 meses
- **Então** a prestação é 9 455,96 MT

### CF-02 — Prazo zero é recusado

- **Dado** 100 000 MT, taxa 2, prazo 0
- **Então** erro de validação com mensagem sobre o prazo

### CF-03 — Taxa zero divide o capital em partes iguais

- **Dado** 100 000 MT, taxa 0, 10 meses
- **Então** cada parcela é 10 000 MT

O ramo sem juros é código separado e quase nunca exercitado. São os ramos
raros que apodrecem.

---

## Parcelas e incumprimento

A data de referência é sempre um **parâmetro**, nunca o relógio do sistema.
Um teste que use a data de hoje passa hoje e falha amanhã.

### CP-01 — Parcela que vence hoje está PENDENTE

- **Dada** uma parcela por pagar com vencimento em 2026-06-15
- **Quando** avaliada com data de referência 2026-06-15
- **Então** o estado é PENDENTE

Ninguém está atrasado no próprio dia do pagamento.

### CP-02 — Parcela vencida ontem está ATRASADA

- **Dada** uma parcela por pagar com vencimento em 2026-06-14
- **Quando** avaliada com data de referência 2026-06-15
- **Então** o estado é ATRASADO

CP-01 e CP-02 são os dois lados da mesma fronteira e têm de existir aos pares.

### CP-03 — Parcela paga nunca está atrasada

- **Dada** uma parcela `pago: true` com vencimento em 2026-01-15
- **Quando** avaliada com data de referência 2026-06-15
- **Então** o estado é PAGO

A precedência importa: pago ganha sempre a vencido.

---

## Isolamento e perfis

Implementados em `test_perfis.py` e `test_isolamento.py`.

### CI-01 — Mutuário não lê a carteira da financeira

- **Dado** um utilizador autenticado com perfil USER
- **Quando** pede `GET /mutuarios`
- **Então** recebe 403

### CI-02 — Mutuário A não lê o pedido de B

- **Dados** dois mutuários da mesma empresa e um pedido pertencente a B
- **Quando** A o pede pelo id
- **Então** recebe **404**, não 403

O 404 é deliberado: um 403 confirmaria a existência do recurso e permitiria
enumerar ids.

### CI-03 — Id inexistente e id alheio respondem igual

- **Quando** A pede um id que não existe e um id que existe mas é de B
- **Então** as duas respostas são indistinguíveis

Caso raro de teste que afirma uma **ausência de diferença**.

### CI-04 — Sem token, nada abre

- **Dado** nenhum token
- **Quando** se pede qualquer rota privada
- **Então** 401, e o corpo não traz dados

---

## Limites de plano

### CL-01 — Starter recusa o quarto utilizador interno

- **Dada** uma empresa STARTER com 3 utilizadores internos ativos
- **Quando** se cria o quarto
- **Então** é recusado

### CL-02 — Importação Excel fora do Empresarial é recusada

- **Dada** uma empresa BUSINESS
- **Quando** se chama `POST /import/mutuarios`
- **Então** é recusado com mensagem sobre o plano

---

## Como escrever mais casos sem os estragar

**Afirma o efeito na regra, não a etiqueta na interface.** "Fica pendente de
aprovação do gestor" amarra-se ao vocabulário do ecrã; se o estado mudar de
nome, o teste parte sem que nada de real tenha mudado. A forma durável é
*transita para o estado em que só o perfil seguinte pode decidir*.

**Uma regra por caso.** "Acima do limite, passa ao gestor" mistura duas
regras: que existe um limite, e que ultrapassá-lo muda quem decide. São dois
casos — quando falhar, queres saber qual.

**O tempo é entrada, nunca ambiente.** Data de referência sempre passada
como parâmetro.

**Todo o caso de negação precisa do par positivo.** Um sistema que recusasse
tudo passaria em todos os CA-02, CA-03, CI-01 e CI-02. É o CA-07, o CA-01 e
o "B vê o próprio pedido" que impedem essa falsa confiança.

---

## Se o limite de alçada vier a existir

Precisa de campo novo em `Empresa` (algo como `limiteAlcadaAnalista`). Os
casos a acrescentar seriam dois, e não um:

- **CA-10** — pedido abaixo do limite do analista conclui-se na etapa 1
- **CA-11** — pedido acima do limite do analista exige decisão de perfil superior

Mais o par de fronteira: um pedido **exatamente** no limite. Decidir se o
limite é inclusivo ou exclusivo é uma escolha de produto, e é precisamente
onde estes sistemas costumam divergir do que o negócio julga ter pedido.
