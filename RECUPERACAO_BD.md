# Recuperação da base de dados / arranque do zero

Guia de referência para o caso de apagares a base de dados (ou clonares o
repositório numa máquina nova) e precisares de pôr tudo a funcionar outra
vez, do zero.

## 1. Pré-requisito

Confirma que `backend/.env` existe e tem as variáveis todas preenchidas.
Usa `backend/.env.example` como referência completa (inclui as novas
variáveis de email/SMS, ver secção 8). Este ficheiro nunca é commitado
(está no `.gitignore`), por isso não vem com o `git clone` — tens de o
criar/copiar à parte.

## 2. Subir os containers

```
docker compose up -d --build
```

O `docker-compose.yml` já espera o PostgreSQL ficar saudável antes de
arrancar o backend (healthcheck), e o `server.js` tenta ligar-se várias
vezes com espera entre tentativas — não deve ser preciso reiniciar
manualmente.

Confirma que os três containers estão a correr:

```
docker compose ps
```

Se o `api_backend` não aparecer como "running"/"healthy", vê os logs:

```
docker compose logs api_backend --tail 50
```

## 3. Confirmar/aplicar o schema

Numa base de dados nova e vazia, o `DB_SYNC`/`DB_ALTER` (se ativos no
`.env`) já criam todas as tabelas a partir dos models atuais — nenhum
passo extra devia ser preciso.

Mesmo assim, corre este script como rede de segurança. É seguro correr
sempre, mesmo que não seja preciso — cada passo verifica o estado atual
antes de alterar, por isso não faz mal nenhum se já estiver tudo certo:

```
docker compose exec api_backend node scripts/aplicarSchemaSubscricao.js
docker compose exec api_backend node scripts/aplicarTaxaJurosEmpresa.js
docker compose exec api_backend node scripts/aplicarMutuarioKycOpcional.js
docker compose exec api_backend node scripts/aplicarNotificacaoTipos.js
```

Devem terminar com `Schema de subscrição aplicado com sucesso.`, `Coluna de
taxa de juros aplicada com sucesso.`, `Campos de KYC do mutuário tornados
opcionais com sucesso.` e `Tipos de notificação (PEDIDO_CRIADO,
ALERTA_PAGAMENTO) aplicados com sucesso.`, respetivamente.

**Nota histórica (porque este script existe):** em Agosto de 2026, o
`DB_ALTER` numa base de dados já existente não conseguiu aplicar sozinho
as mudanças de schema da sessão (trial, SUPERADMIN, tabela
`solicitacoes_acesso`), e falhou silenciosamente sem dar erro visível nos
logs (bug à parte, já corrigido em `config/databaseSync.js`). Este script
(`scripts/aplicarSchemaSubscricao.js`, que corre a migration
`migrations/20260814120000-add-subscription-model-columns.js`) foi o que
resolveu isso manualmente. Se um dia voltares a ver o erro `Column
'empresa_id' cannot be null` ao criar um SUPERADMIN, é este o script a
correr.

## 4. Criar o primeiro SUPERADMIN

Não há registo de SUPERADMIN pela interface, de propósito (é o dono da
plataforma — não deve haver forma de criar isto publicamente). Cria-se só
por linha de comandos:

```
docker compose exec api_backend node scripts/createSuperAdmin.js "O Teu Nome" teuemail@exemplo.com umaPasswordSegura
```

Devolve `SUPERADMIN criado com sucesso` com o id/nome/email. Entra em
`/login` com esse email/password — deve levar-te direto a
`/superadmin/empresas`.

## 5. Criar a primeira empresa (tenant)

Duas formas, ambas criam uma Empresa + o seu ADMIN inicial com 7 dias de
trial:

**a) Self-service, pela landing page** (o caminho normal para clientes
novos): abre a landing page → secção "Sou uma Financeira" → formulário
"Começar trial grátis de 7 dias".

**b) Diretamente pelo painel SUPERADMIN**: login como SUPERADMIN →
`/superadmin/empresas` → botão "Nova Empresa".

As duas chamam o mesmo endpoint (`POST /api/auth/bootstrap-admin`), que é
público de propósito (decisão de produto: self-service, sem convite
prévio — ver secção 7).

## 6. Verificação final

- [ ] `docker compose ps` mostra os 3 containers a correr
- [ ] Login como SUPERADMIN funciona e mostra `/superadmin/empresas`
- [ ] Criar uma empresa de teste (passo 5) funciona e aparece na lista do superadmin
- [ ] Login como ADMIN dessa empresa de teste funciona e mostra `/interno`
- [ ] `docker compose logs api_backend --tail 30` sem erros de sync/schema

## 7. Referência rápida dos scripts relevantes

| Script | Para quê | Seguro repetir? |
|---|---|---|
| `scripts/aplicarSchemaSubscricao.js` | Aplica as colunas/tabela de subscrição em falta | Sim |
| `scripts/aplicarTaxaJurosEmpresa.js` | Aplica as colunas `taxa_juros_min`/`taxa_juros_max` na tabela `empresas` | Sim |
| `scripts/aplicarMutuarioKycOpcional.js` | Torna `documento_tipo`/`documento_numero`/`nuit`/`data_nascimento` opcionais na tabela `mutuarios` | Sim |
| `scripts/aplicarNotificacaoTipos.js` | Adiciona `PEDIDO_CRIADO`/`ALERTA_PAGAMENTO` ao ENUM `notificacoes.tipo` | Sim |
| `scripts/createSuperAdmin.js "Nome" email pass` | Cria o utilizador SUPERADMIN | Não (falha se o email já existir, o que é o comportamento certo) |
| `scripts/debugEmpresaId.js` | Diagnóstico pontual — mostra o SQL real ao alterar `empresa_id`. Podes apagar este ficheiro, era só para depurar o problema de Agosto/2026. | Sim, mas é descartável |
| `npm run migrate` (dentro do container) | Sistema de migrations do `sequelize-cli` | Só depois de confirmares que a baseline (`migrations/00000000000000-baseline.js`) está marcada como aplicada no `SequelizeMeta` — numa BD já existente, correr isto sem essa marcação tenta recriar tabelas que já existem e falha. Numa BD **nova**, corre sem problema. |

## Nota sobre o modelo de subscrição

- Empresa nova nasce com `estado = "TESTE"` e `trialEndsAt` a 7 dias.
- Ao fim do trial (ou antes), confirmas o pagamento por fora (transferência,
  mobile money, etc.) e mudas manualmente o estado para `"ATIVA"` em
  `/superadmin/empresas` → editar empresa. Isto limpa o `trialEndsAt`.
- `SUSPENSA`/`CANCELADA` bloqueiam o acesso de todos os utilizadores dessa
  empresa (exceto SUPERADMIN, que não pertence a nenhuma empresa).

## Nota sobre a taxa de juros

- Cada empresa nasce com uma faixa padrão de 15%–30% ao ano
  (`taxaJurosMin`/`taxaJurosMax`), editável em `/interno/empresa`
  (só ADMIN).
- Um pedido novo usa `taxaJurosMin` como estimativa até ser aprovado.
- A taxa é definida na aprovação de nível 1 (etapa de análise de risco,
  normalmente o ANALISTA), dentro da faixa da empresa. Os níveis 2 e 3
  (GESTOR, DIRETOR/ADMIN) só confirmam ou rejeitam — não voltam a mexer
  na taxa. É essa taxa que o crédito herda no desembolso.
- A simuladora pública (landing page, antes de entrar numa empresa)
  continua a usar uma taxa genérica de 18%, propositadamente — nesse
  ponto ainda não há empresa associada.

## Nota sobre o registo do mutuário e o perfil KYC

- O registo (`RegisterMutuario.jsx`) pede só o essencial: nome de
  utilizador, email, password, nome completo e telefone. Reduz fricção
  no primeiro contacto.
- Documento (tipo/número), NUIT, data de nascimento e morada
  (província/distrito/local de residência) ficam opcionais nesse
  momento e são preenchidos depois em "Completar Perfil"
  (`/portal/completar-perfil`), via `PUT /portal/meu-mutuario`.
- Uma vez preenchidos, documento/NUIT/data de nascimento não podem ser
  alterados pelo próprio mutuário (só definidos uma vez) — evita que
  troque a identidade declarada depois de verificada. Alterações a
  esses campos, depois de definidos, têm de passar pelo backoffice.
- Submeter um pedido de crédito (`createMeuPedido`) continua a exigir
  o perfil completo (documento + NUIT + data de nascimento) — o
  registo ficou mais leve, mas o KYC continua obrigatório antes da
  relação de crédito começar.

## 8. Notificações por email e SMS

- Fornecedores: **Resend** (email) e **Africa's Talking** (SMS).
  Variáveis novas em `backend/.env.example`: `RESEND_API_KEY`,
  `RESEND_FROM_EMAIL`, `AFRICASTALKING_API_KEY`,
  `AFRICASTALKING_USERNAME`, `AFRICASTALKING_SENDER_ID`.
- Sem essas chaves configuradas, tudo cai automaticamente para log em
  consola (mesmo comportamento de sempre em desenvolvimento) — não
  bloqueia nada, só não envia de verdade.
- **Como funciona:** qualquer `Notificacao` criada em qualquer parte do
  código (há uns 6 controllers diferentes que criam notificações) passa
  automaticamente por `services/notificacaoExterna.service.js`, via hook
  `afterCreate`/`afterBulkCreate` registado em `models/index.js`. Não é
  preciso (nem se deve) chamar o serviço diretamente de um controller —
  isto existe precisamente para não repetir essa chamada em cada sítio e
  arriscar esquecer um, como já aconteceu com a taxa de juros.
- O despacho só acontece depois da transação em que a notificação foi
  criada confirmar (`transaction.afterCommit`) — evita mandar SMS/email
  de algo que acabou por ser revertido.
- **Só mutuários (role `USER`/`MUTUARIO`) recebem email/SMS externo.**
  Notificações para staff interno (ADMIN, GESTOR, ANALISTA, DIRETOR)
  ficam só in-app — evita custo de SMS em alertas internos que às vezes
  são criados em massa (ex: "novo pedido" para toda a equipa de uma vez).
- **Marca:** as notificações saem em nome da empresa/financeira (nome no
  "From" do email, nome no início do texto do SMS), mas usam a
  infraestrutura partilhada da plataforma — um domínio de email, um
  Sender ID de SMS. Nenhuma empresa precisa de configurar o próprio
  domínio ou pagar o próprio Sender ID. Domínio/Sender ID próprios por
  empresa ficaram propositadamente fora, como possível funcionalidade
  premium mais tarde.
- OTP de verificação e reset de password (`utils/emailService.js`) são
  fluxos de segurança, não notificações de negócio — continuam a sair em
  nome da plataforma ("Vale do Zambeze"), não da empresa, porque também
  servem staff interno sem "marca" própria.
- **Sender ID da Africa's Talking:** requer documentos da empresa e uma
  taxa única de ~35 USD, aprovado uma vez no dashboard deles — não é por
  tenant, é um registo único da plataforma.

## 9. Exportação em PDF (extrato e comprovativos)

- Biblioteca: `pdfkit` (gera o PDF direto em Node, sem browser). Sem
  variáveis de ambiente novas — é só `npm install`.
- Lógica de geração centralizada em `services/pdfExport.service.js`
  (`gerarExtratoPedidoPdf` e `gerarComprovativoPdf`), reutilizada por
  todos os endpoints abaixo.
- Portal do mutuário (acesso restrito ao próprio mutuário, via
  `mutuarioId`):
  `GET /portal/export/meu-extrato/:pedidoId/pdf`,
  `GET /portal/export/comprovativo/desembolso/:desembolsoId`,
  `GET /portal/export/comprovativo/reembolso/:reembolsoId`.
- Backoffice (acesso restrito por `empresaId`, para staff interno):
  `GET /extrato/pedido/:pedidoId/pdf`,
  `GET /desembolsos/:desembolsoId/comprovativo`,
  `GET /reembolsos/:reembolsoId/comprovativo`.
- Em `extrato.controller.js`, `getExtratoPedido` (JSON) e
  `getExtratoPedidoPdf` partilham a mesma busca
  (`buscarExtratoPedidoInterno`), só divergindo na serialização final —
  mesmo padrão já usado em `portalExport.controller.js`.

### Bug corrigido: saldo em dívida exportado sem juros

`buscarExtratoPedido` (portal, usado pelo Excel e pelo PDF do mutuário)
calculava `saldoEmDivida = totalDesembolsado - totalReembolsado`,
ignorando o `montanteTotal` do Crédito (capital + juros). A página do
extrato no ecrã (`portalMutuario.controller.js`) e o extrato interno do
backoffice (`extrato.controller.js`) já calculavam certo, usando
`credito.saldoAtual` (que é inicializado com `pedido.montanteTotal` e
descontado a cada reembolso — ver `credito.service.js`). Corrigido para
seguir a mesma lógica: inclui `Credito` no include do pedido e usa
`creditos.saldoAtual`/`montanteTotal`, com fallback para
`totalDesembolsado - totalReembolsado` apenas quando ainda não há
crédito (pedido ainda não desembolsado, fase em que só há capital em
jogo). O PDF e o Excel do portal passaram a mostrar também "Montante
Total (capital + juros)", e a página `ExtratoPedido.jsx` (portal) ganhou
essa mesma linha para dar visibilidade do cálculo.

### Varredura: outras ocorrências do mesmo tipo de bug

Depois do fix acima, procurei o mesmo padrão (saldo calculado sem contar
juros, ou include inválido de `reembolsos` direto em `PedidoCredito`) no
resto do código. Encontrei mais três casos:

1. **`excell.service.js` → `gerarExcellRelatorioFinanceiro`** (relatório
   financeiro exportado pelo backoffice, `GET` via
   `exportarRelatorioFinanceiro`): tinha um `include: [{ association:
   "reembolsos" }]` diretamente em `PedidoCredito`, associação que não
   existe (só existe via `Credito`) — isto fazia o endpoint **crashar**
   com `SequelizeEagerLoadingError` sempre que alguém tentasse exportar
   este relatório. Corrigido para incluir `creditos` com `reembolsos`
   aninhado, e o `SaldoEmAberto` passou a vir de `credito.saldoAtual`
   (com a coluna nova `MontanteTotal` para mostrar capital + juros).
2. **`DetalhePedido.jsx`** (portal, tab "Extrato" dentro do detalhe do
   pedido) e **`PedidoDetalhe.jsx`** (backoffice, mesma tab): ambos liam
   `extrato.resumoFinanceiro?.saldoEmAberto` (campo que não existe — o
   backend devolve `saldoEmDivida`) e `extrato.desembolsos` /
   `extrato.reembolsos` diretamente no topo do objeto (também não
   existem — vêm dentro de `extrato.pedido.desembolsos` e de
   `extrato.pedido.creditos[].reembolsos`). Na prática esta tab mostrava
   sempre "Saldo em Aberto: 0,00 MZN" e "Ainda não existem movimentos
   financeiros", mesmo com desembolsos/reembolsos reais. Corrigido nos
   dois ficheiros para ler os campos certos.

### Bug corrigido: ENUM de notificacoes.tipo incompleto

O modelo `Notificacao` só tinha `ALERTA_PRAZO`/`APROVACAO`/`REJEICAO`/
`SISTEMA`/`REQUISITO`, mas dois controllers já usavam tipos que não
existiam no ENUM: `pedidoCredito.controller.js` usava `PEDIDO_CRIADO`
(falhava silenciosamente — tem try/catch à volta) e
`alertaPagamento.controller.js` usava `ALERTA_PAGAMENTO` como valor
por omissão (rebentava a chamada toda, sem try/catch — os alertas de
pagamento em atraso/a vencer nunca chegaram a funcionar). O frontend já
tinha rótulo e cor prontos para os dois em `Notificacoes.jsx` e
`MinhasNotificacoes.jsx` — só o ENUM da BD é que nunca tinha sido
atualizado. Corrigido em `models/notificacao.model.js` +
`scripts/aplicarNotificacaoTipos.js`.

## 10. Notificações internas (staff) e situação dos mutuários

Feedback do utilizador: o staff interno (ADMIN/GESTOR/ANALISTA/DIRETOR)
não recebia nenhuma notificação quando entrava um pedido, quando o
mutuário anexava um documento de requisito, ou quando enviava um
comprovativo de pagamento.

- Causa: `criarAlertasPedidoCriado` (que notifica o staff) só era
  chamado em `pedidoCredito.controller.js` — usado quando um
  funcionário cria o pedido em nome do mutuário. O caminho mais comum,
  o próprio mutuário a submeter pelo portal (`createMeuPedido` em
  `portalMutuario.controller.js`), nunca chamava esta função.
  `anexarReqPedido` (upload de documento) e `enviarComprovativo` (envio
  de comprovativo de pagamento) nunca tinham `Notificacao.create`
  nenhum.
- Corrigido extraindo a lógica de notificar staff para
  `services/notificacaoInterna.service.js`
  (`notificarStaffDaEmpresa`), reutilizada agora em quatro sítios:
  `pedidoCredito.controller.js` (`createPedidoCredito`),
  `portalMutuario.controller.js` (`createMeuPedido` e
  `anexarReqPedido`), e `comprovativo.controller.js`
  (`enviarComprovativo`).
- Estas notificações ficam só na lista/sino interno — não passam pelo
  despacho de email/SMS (esse está restrito a `role` USER/MUTUARIO por
  controlo de custo, ver secção 8).

Também corrigido, no mesmo pedido do utilizador: `adicionarPedidoRequisito`
tinha um check de perfil interno redundante e mais restrito
(`["ADMIN","GESTOR"]`) do que a rota (`authorizeRoles("ADMIN","GESTOR",
"ANALISTA")`) e do que a regra oficial `VALIDAR_REQUISITO` em
`regrasPedido.js` — na prática bloqueava ANALISTA com 403 mesmo a rota
permitindo. Alinhado para usar `userTemPermissaoParaAcao(user,
"VALIDAR_REQUISITO")`.

Por fim, `getAllMutuarios` (listagem de mutuários no backoffice) passou
a devolver um campo `situacao` por mutuário — `pedidosAtivos`,
`creditosAtivos`, `creditosIncumprimento`, `saldoEmDivida`,
`parcelasEmAtraso` — calculado a partir dos `PedidoCredito` e `Credito`
(com `parcelas`) desse mutuário. `MutuariosList.jsx` mostra isto como
chips na listagem, para dar visibilidade de quem precisa de atenção sem
abrir o detalhe de cada um.

Nota: o ponto "mesmo depois de aprovado ainda aparece pendente" (parcela
continuar `PENDENTE` após um comprovativo ser validado) não era bug —
confirmado com o utilizador que o valor aprovado não cobria o saldo
total da parcela, por isso ficou corretamente como pagamento parcial.

## 11. Revisão sénior do backend — correções de segurança

Pedido pelo utilizador ("revisa a back end"). Achados classificados por
severidade e as correções aplicadas:

**CORS aberto a qualquer origem** — `server.js` chamava `cors()` sem
opções, aceitando pedidos de qualquer domínio. Corrigido com uma
whitelist: `FRONTEND_URL` (obrigatória) + `CORS_EXTRA_ORIGINS` (opcional,
separada por vírgulas, para staging/domínios extra). Pedidos sem header
`Origin` (server-to-server, curl, Postman) continuam permitidos. Origem
não listada agora devolve 403 em vez de deixar passar. Nova variável
documentada em `backend/.env.example`.

**Sem headers de segurança** — adicionado `helmet` como dependência e
middleware global em `server.js` (antes do `cors`), cobrindo CSP, HSTS,
X-Frame-Options, etc. com os valores padrão da biblioteca.

**Sem validação de força de password** — todos os fluxos que criam ou
redefinem password (`bootstrapAdmin`, `registerInterno`,
`registrarViaConvite`, `resetPassword`, `registerMutuarioRequestOTP`)
só verificavam presença do campo. Adicionado `validarForcaPassword` em
`auth.controller.js`: mínimo 8 caracteres, pelo menos uma letra e um
número. Aplicado nos 5 pontos, sempre depois da validação de campos
obrigatórios.

**Dependência morta** — `mongoose` estava em `package.json` mas nunca é
importado em código nenhum (o projeto usa Sequelize/MySQL). Removido.

Pendente de ação do utilizador: correr `npm install` (ou
`docker compose build --no-cache api_backend && docker compose up -d -V`)
para que o container capte a nova dependência `helmet` e o `mongoose`
removido. Sem isto, o backend vai falhar a arrancar com
`Cannot find module 'helmet'` — mesmo padrão do erro `pdfkit` já visto
nesta sessão (volume anónimo `node_modules` do Docker Compose).

Não corrigido nesta ronda (ficou como Nit no relatório original, menor
prioridade): falta de paginação (`limit`/`offset`) nos endpoints de
listagem — hoje mitigado pelo scoping por `empresaId`, mas cresce sem
controlo para tenants grandes com o tempo.

## 12. Revisão sénior do frontend — correções

Pedido pelo utilizador ("revisa a frontend"). Achados Required corrigidos:

**Sem tratamento de 401 (sessão expirada)** — `src/api/axios.js` só
tinha interceptor de request (injetar token). Adicionado interceptor de
resposta: em qualquer 401 fora dos endpoints públicos de auth
(login/registo/otp/forgot/reset-password/bootstrap-admin), limpa o
token e redireciona para `/login?sessao=expirada`. `Login.jsx` lê esse
parâmetro e mostra um aviso "A sua sessão expirou." em vez do
utilizador ver erros genéricos espalhados por cada página.

**Sem ErrorBoundary** — criado `src/components/ErrorBoundary.jsx`
(componente de classe, obrigatório para error boundaries em React) com
ecrã de fallback em MUI ("Voltar ao início" / "Recarregar página").
Envolve `<AppRoutes />` em `App.jsx`, dentro do `ThemeProvider`.

**Sem code-splitting nas rotas** — `src/routes/AppRoutes.jsx` convertido
de imports estáticos para `React.lazy()` em todas as ~36 páginas
(exceto layouts/`ProtectedRoute`, que são pequenos e usados em toda a
parte). `<Routes>` envolvido num `<Suspense>` com spinner central. Isto
faz o bundle inicial parar de incluir o backoffice inteiro quando o
utilizador só precisa do portal do mutuário (e vice-versa).

Validado com `esbuild` (sintaxe/JSX de todos os ficheiros alterados) e
confirmação de que cada import `lazy()` aponta para um ficheiro com
`export default`. Não foi possível correr `npm run build` completo
dentro do sandbox (instalação de `node_modules` ficou incompleta por
timeout de rede) — recomenda-se `docker compose up -d -V` e testar as
rotas manualmente antes de assumir 100% coberto.

Não corrigidos nesta ronda (Nit, menor prioridade): token JWT em
`localStorage` (exigiria mudança de arquitetura para cookie httpOnly),
falta de `aria-label` em botões só-com-ícone, falta de paginação nas
listagens do frontend.

## 13. Bug: parcela vencida sem forma de ver detalhes ou tratar

Reportado pelo utilizador: o Dashboard Interno avisa "1 parcela vencida
por cobrar", mas não havia forma de abrir/ver essa parcela.

Causa raiz encontrada: o backoffice nunca teve uma página de detalhe de
crédito. O botão "Ver Crédito" em `ReembolsosList.jsx` já apontava para
`/backoffice/creditos/:id` — uma rota que nunca existiu (nem o prefixo
`/backoffice` é usado em lado nenhum, é sempre `/interno`) — e a função
`getCreditosComReembolsoRequest` em `admin.api.js` já existia mas nunca
era chamada. Ou seja, a página tinha sido planeada mas nunca construída.

Corrigido:

- Nova página `frontend/src/pages/admin/creditos/CreditoDetalhe.jsx`
  (rota `/interno/creditos/:id`), mostrando dados do contrato, tabela de
  parcelas (linhas vencidas destacadas a vermelho) e histórico de
  reembolsos, com um botão "Registar Pagamento" que já leva o crédito
  pré-selecionado para a página de Reembolsos.
- `ReembolsosList.jsx`: link "Ver Crédito" corrigido para
  `/interno/creditos/:id`. Adicionada uma tabela "Parcelas Vencidas por
  Cobrar" no topo da página — achata todos os créditos elegíveis numa
  lista simples de parcelas com vencimento passado (mutuário, contrato,
  nº da parcela, dias em atraso, saldo), com botão "Selecionar" que
  preenche o formulário de reembolso automaticamente. A página também
  aceita `?creditoId=&parcelaId=` na URL para chegar já pré-preenchida
  (usado pelo botão da página de detalhe do crédito).
- `StatCard.jsx`: novo prop opcional `to` — se passado, o card inteiro
  vira um link (hover com sombra). Retrocompatível, não quebra nenhum
  uso existente.
- `DashboardInterno.jsx`: o card "Parcelas Vencidas" e o aviso no topo
  agora têm link direto para `/interno/reembolsos`, onde a tabela acima
  já mostra a parcela específica.

Validado com `esbuild` (sintaxe/JSX) em todos os ficheiros alterados.

## 14. Bug: mutuário nunca recebe aviso de parcela a vencer/vencida

Reportado pelo utilizador ("o mutuário não recebeu in-app not que a
parcela estava para vencer, nem que venceu"). Pergunta relacionada do
utilizador: que serviços um provedor de internet usa para mandar
SMS/email antes do plano expirar? Resposta: este projeto já tem os
serviços equivalentes integrados (Resend para email, Africa's Talking
para SMS — ver secção sobre "despacho externo" mais acima nesta
sessão). O que faltava não era o canal de envio, era o agendamento.

Causa raiz: `backend/controllers/alertaPagamento.controller.js` já
tinha `verificarAlertasPagamento` — cria notificações in-app para
parcelas a vencer em 3 dias ou já vencidas, e qualquer Notificacao
criada para um mutuário já dispara automaticamente email/SMS via
`notificacaoExterna.service.js` (hook `afterCreate` do modelo
`Notificacao`). A rota `POST /api/alertas-pagamento/verificar` estava
registada e funcional — mas **nunca existiu nenhum botão nem página no
frontend a chamá-la** (ao contrário de `/interno/alertas-prazo`, que
tem um botão "Verificar Alertas" mas só cobre prazos de avaliação e
validação do pedido, não vencimento de parcelas). E não existia nenhum
cron/agendador no backend — tudo dependia de alguém entrar manualmente
numa página e clicar. Resultado: esta verificação nunca correu, logo
nenhum mutuário alguma vez recebeu o alerta, nem in-app nem por
email/SMS.

Corrigido:

- `alertaPagamento.controller.js` e `alertaPrazo.controller.js`:
  lógica principal extraída para `executarVerificacaoPagamento(empresaId)`
  e `executarVerificacaoPrazo(empresaId, opções)`, reutilizável tanto
  pelo endpoint HTTP manual como pelo agendador automático.
- Novo `backend/services/agendador.service.js`, usando `node-cron`:
  corre todos os dias às 07:00 (fuso `Africa/Maputo`, configurável via
  `CRON_ALERTAS_HORARIO`/`CRON_ALERTAS_TIMEZONE`), para todas as
  empresas com acesso ativo (mesmo critério de `utils/empresaAccess.js`
  — não gasta SMS/email com empresas suspensas/trial expirado), correndo
  as duas verificações (pagamento + prazo) por empresa, com erros
  isolados por empresa (uma falha não impede as restantes).
- Ligado em `server.js` (`iniciarAgendador()`), depois da ligação à BD
  e sincronização do schema, antes do `app.listen`.
- `node-cron` adicionado a `backend/package.json` (versão atual estável
  4.x — API `cron.schedule(expr, fn, opções)` é compatível com o uso
  simples feito aqui; usados também `name` e `noOverlap: true` para
  evitar execuções sobrepostas).

Pendente de ação do utilizador: `npm install` / rebuild do container
backend para captar a nova dependência `node-cron` (mesmo padrão do
`pdfkit`/`helmet` — precisa de `docker compose up -d -V`). A partir daí,
o alerta corre sozinho todos os dias sem ninguém ter de clicar em nada.

Validado com `node --check` em todos os ficheiros alterados.

## 15. Pipeline de CI (GitHub Actions)

Pedido pelo utilizador via `/anthropic-skills:ci-cd-and-automation`.
Decisões confirmadas com o utilizador antes de implementar: aciona em
push/PR para `mestre` e `staged` (as duas branches ativas — "mestre" é
nominalmente a principal, "staged" é onde está o trabalho mais
recente); alcance é só verificação (lint + testes + build), sem deploy
automático.

Novo `.github/workflows/ci.yml`: dois jobs em paralelo (`backend`,
`frontend`), Node 20 (mesma versão dos `Dockerfile`s), cache de npm por
`package-lock.json`.

- **Backend**: `npm ci` + `npm test` (jest) bloqueantes; `npm audit
  --audit-level=high` informativo (`continue-on-error`).
- **Frontend**: `npm ci` + `npm run build` bloqueantes; `npm run lint`
  e `npm audit` informativos.

Achados ao validar antes de ligar o pipeline (importante: um pipeline
vermelho desde o primeiro dia é ignorado por todos, por isso corrigimos
o que dava para corrigir e documentámos o resto):

- **`npm ci` falhava em ambos os projetos** — os `package-lock.json`
  não estavam sincronizados com o `package.json` (backend: faltavam
  `helmet`/`node-cron`, sobrava `mongoose`; frontend: ainda referenciava
  o `vite`/`@vitejs/plugin-react` antigos). Ambos os lockfiles foram
  regenerados via `npm install` e validados com `npm ci --dry-run`.
- **2 testes a falhar em `criticalFlows.test.js`** — o mock de `Empresa`
  não incluía `findByPk`, usado por `createPedidoCredito` desde que a
  taxa de juros configurável por empresa foi implementada (a funcionalidade
  é mais recente que o teste). Corrigido o mock; suite passa 100%
  (23 passed, 10 todo — os `todo` já eram intencionais, ver comentário
  no topo do ficheiro).
- **Lint do frontend tem 25 erros pré-existentes** — a maioria da regra
  `react-hooks/set-state-in-effect` (do `eslint-plugin-react-hooks` v7),
  que assinala o padrão `useEffect(() => { carregarX(); }, [])` usado em
  várias páginas de listagem/detalhe deste projeto. Corrigir isto a
  sério é um refactor à parte (não um fix de uma linha), por isso o
  lint ficou como *informativo* no pipeline em vez de bloqueante, para
  não deixar o CI permanentemente vermelho. Fica como trabalho futuro,
  não urgente.
- **`npm audit` encontra 16 vulnerabilidades (10 high)** em ambos os
  projetos, a maioria por dependências transitivas sem correção
  disponível a montante (ex: `xlsx` — prototype pollution/ReDoS, sem
  fix). Por isso também ficou informativo, não bloqueante.

Nada disto foi commitado — falta o `git add`/`commit` do utilizador,
como sempre nesta sessão.

## 16. Correções de lint no frontend (após confirmação real no Docker)

Depois de commitado o CI, o utilizador correu `docker compose exec
web_frontend npm run lint` no ambiente real e confirmou os 25 erros
previstos. Corrigido:

- **`eslint.config.js`**: `react-hooks/set-state-in-effect` rebaixada
  de `error` para `warn` — é uma regra nova (eslint-plugin-react-hooks
  v7) que assinala o padrão `useEffect(() => { carregarDados() }, [])`
  usado em ~18 páginas deste projeto; corrigir "à letra" exigiria um
  hook de fetching partilhado e migrar todas essas páginas — refactor
  maior, decidido em conjunto com o utilizador que fica para depois.
- **4 variáveis não usadas** removidas: `navigate` em `DetalhePedido.jsx`
  e `Simulacoes.jsx` (com o `useNavigate` import), `parcelas` em
  `ExtratoPedido.jsx`, `pedidoStatus` (prop nunca usada) em
  `PedidoRequisitosSection.jsx`.
- **`MeusCreditos.jsx`**: `carregarCreditos` estava a ser referenciada
  dentro de um `useEffect` colocado antes da própria declaração da
  função (funcionava por hoisting de closure, mas o ESLint assinalava
  como frágil). Reordenado — declaração antes do `useEffect`.
- **`AuthContext.jsx`** exportava o componente `AuthProvider` e o hook
  `useAuth` no mesmo ficheiro, quebrando o Fast Refresh do Vite
  (`react-refresh/only-export-components`). Separado: o objeto
  `AuthContext` (criado via `createContext`) e o hook `useAuth` mudaram
  para um novo `context/useAuth.js`; `AuthContext.jsx` ficou só com o
  componente `AuthProvider`, importando o `AuthContext` do novo
  ficheiro. Os 16 ficheiros que importavam `useAuth` de `AuthContext`
  foram atualizados para importar de `useAuth.js`.

Validado com `esbuild` em todos os 22 ficheiros tocados (sintaxe/JSX
limpa). Confirmação final do lint em si fica a cargo do utilizador via
`docker compose exec web_frontend npm run lint` no ambiente real.

## 17. Pendente: migrar `xlsx` para `exceljs`

Contexto: depois de `npm audit fix --force`, sobraram algumas
vulnerabilidades por resolver (ver secção 15). Das 16, a única
genuinamente sem correção disponível a montante é o pacote `xlsx`
(SheetJS parou de publicar patches de segurança na versão grátis do
npm) — as restantes (ex: `uuid` via `sequelize`) têm fix disponível, só
que via bump maior (arriscado, precisa de verificação por testes se já
aplicado). Este ponto fica registado como trabalho futuro, ainda por
agendar.

**Onde mexe:** exatamente 2 ficheiros, 9 funções no total —
`backend/services/excell.service.js` (5 funções de exportação +
`importarExcellMutuarios`/`importarExcellPedidos`, que leem ficheiro
enviado) e `backend/controllers/portalExport.controller.js` (2 funções
de exportação).

**Risco:** as 7 funções de exportação são um swap mecânico (mesma
lógica, só a API muda — `XLSX.utils.json_to_sheet`/`book_new`/
`book_append_sheet`/`write` viram `workbook.addWorksheet`/
`worksheet.addRows`/`await workbook.xlsx.writeBuffer()`). As 2 de
importação são o ponto sensível: `exceljs` não tem equivalente direto a
`XLSX.utils.sheet_to_json`, exige escrever um helper de conversão
linha→objeto, e estas funções criam Mutuários/Pedidos direto na BD com
validação de taxa/duplicados — precisam de teste manual cuidadoso com
ficheiros reais antes de dar como concluído.

**Estimativa:** ~1 dia de trabalho focado (6-8h): 2-3h para as 7
exportações + testar downloads, 3-4h para as 2 importações (helper novo
+ testar upload + confirmar validação de negócio igual), mais trocar
`xlsx` por `exceljs` no `package.json`/lockfile.

## 18. Bug: backend não arrancava (`Cannot find module` / `Unexpected token 'export'` no uuid)

Depois do utilizador correr `npm audit fix --force` (secção 15/17), o
`uuid` subiu para `^14.0.2` — mas a partir da v12 o pacote deixou de
publicar build CommonJS (só ESM), quebrando `require('uuid')` usado em
`middleware/requestId.middleware.js`. Sintoma no Docker:
`docker compose exec api_backend npm test` falhava com `SyntaxError:
Unexpected token 'export'` dentro de `node_modules/uuid/dist-node/index.js`.

Causa exata confirmada via `npm view uuid@<versão> exports`: a
condição `require` no `package.json` do `uuid` só existe até à v11.1.1
— a partir da v12 só resta `import`. Como a vulnerabilidade que motivou
o bump (`GHSA-w5hq-g745-h8pq`) já está corrigida a partir da v11.1.1,
foi essa a versão certa a fixar (não a mais recente).

Corrigido: `backend/package.json` → `"uuid": "^11.1.1"` (era
`^14.0.2`). `sequelize` continua a usar internamente a sua própria
cópia isolada `uuid@8.3.2` (não afeta o nosso código, só o dele por
dentro) — o `npm audit` ainda assinala isto, mas corrigir exigiria
recuar o `sequelize` para uma versão 3.x, o que seria uma regressão
muito maior do que o risco em si. Fica como o mesmo tipo de exceção
aceite que o `xlsx` (ver secção 17).

De caminho, também corrigidas duas vulnerabilidades novas encontradas
no `npm audit` (`joi`, `lodash`) via `npm audit fix` normal (sem
`--force`, sem mudança de versão direta — só ajuste na árvore de
dependências transitivas).

`package-lock.json` regenerado e validado: `npm test` corre limpo (23
passed, 10 todo) no ambiente isolado usado para gerar o lockfile.
**Pendente de ação do utilizador:** `docker compose build --no-cache
api_backend && docker compose up -d -V` (mesmo padrão do `helmet`) para
o container captar a versão corrigida do `uuid`.

## 19. Bug: "parcela em atraso" aparece no Dashboard mas 0 na lista de mutuários

Reportado pelo utilizador: o Dashboard avisa de uma parcela vencida por
cobrar, mas o campo "parcelas em atraso" na lista de mutuários mostra 0
para esse mesmo mutuário.

Causa raiz: duas definições diferentes de "em atraso" a coexistir no
sistema.

- `relatorio.controller.js` (Dashboard) e `ReembolsosList.jsx` (tabela
  de parcelas vencidas) calculam **ao vivo**: `estado = "PENDENTE"` e
  `dataVencimento < hoje`.
- `mutuario.controller.js` (`getAllMutuarios`, campo `situacao.
  parcelasEmAtraso`) contava só pelo campo `estado === "ATRASADO"`
  gravado na BD.

O campo `estado` de `ParcelaPagamento` só é escrito como `"ATRASADO"`
dentro de `atualizarParcelaAposReembolso`
(`services/credito.service.js`) — ou seja, só quando alguém regista um
pagamento parcial contra essa parcela específica. Nada corre em segundo
plano a marcar parcelas como atrasadas só por a data ter passado; uma
parcela vencida que nunca recebeu nenhum pagamento fica `"PENDENTE"`
indefinidamente. Por isso o Dashboard (cálculo ao vivo) mostrava a
parcela correta, e a lista de mutuários (campo gravado, nunca tocado)
mostrava 0.

Corrigido `mutuario.controller.js`: `parcelasEmAtraso` passou a usar a
mesma lógica ao vivo (`estado !== "PAGO"` e `dataVencimento < hoje`),
alinhada com o Dashboard e a tabela de Reembolsos. Também adicionado
`dataVencimento` aos atributos carregados de `ParcelaPagamento` nesse
include (antes só vinha `id`/`estado`).

Validado com `node --check`.

## 20. Bug maior: "Incumprimento" nunca era escrito em lado nenhum

Pergunta do utilizador ("vc também paras em incumprimento"), a seguir
ao bug da secção 19 — motivou verificar se `estado = "INCUMPRIMENTO"`
tinha o mesmo problema. Era pior: não é um cálculo desatualizado, é uma
funcionalidade que nunca chegou a ser construída.

`ESTADO_CREDITO.INCUMPRIMENTO` existe no ENUM do modelo `Credito`, é
lido pelo Dashboard (`creditosIncumprimento`) e pela situação dos
mutuários, e o frontend já tem cor/label prontos para esse estado — mas
**nenhum ficheiro do backend alguma vez escrevia esse valor**. A prova
estava em `utils/regrasCredito.js`, num comentário de planeamento no
topo do ficheiro que listava `podeMarcarIncumprimento()` ao lado de
outras funções nunca implementadas (`podeLiquidarCredito`,
`podeRenegociarCredito`, etc.) — só `podeRegistrarReembolso` chegou a
ser construída. Resultado: o contador de créditos em incumprimento
mostrava sempre 0, por mais atrasado que um crédito estivesse.

Perguntado ao utilizador o critério: confirmado que deve ser
**automático**, por dias de atraso, com limiar de **30 dias**.

Corrigido:

- Nova função `verificarIncumprimentoEmpresa(empresaId, limiarDias =
  30)` em `services/credito.service.js`: marca como `INCUMPRIMENTO`
  qualquer crédito `ATIVO` com pelo menos uma parcela por pagar vencida
  há mais de 30 dias; e recupera de volta para `ATIVO` os créditos já
  marcados que deixaram de ter qualquer parcela nessas condições (ex:
  staff regularizou o atraso). Não mexe em créditos `LIQUIDADO` (isso já
  é tratado à parte em `atualizarSaldo`) nem `REESTRUTURADO`.
- Ligado ao agendador diário (`services/agendador.service.js`), a correr
  por empresa a seguir às verificações de pagamento/prazo já existentes,
  com o mesmo isolamento por try/catch (uma falha numa empresa não trava
  as restantes) e log de resumo (`creditosMarcadosIncumprimento`/
  `creditosRecuperadosDeIncumprimento`).

Não construído (o utilizador escolheu só automático, não pediu ação
manual): um botão "Marcar Incumprimento" para staff — se um dia for
preciso, fica como extensão futura, não como algo pendente.

Validado com `node --check` e suite de testes completa (23 passed, 10
todo) — sem regressões.

**Pendente de ação do utilizador:** basta reiniciar o container
(`docker compose restart api_backend`) para captar esta mudança — não
adicionou dependência nova, só código.

## 21. Portal: parcela vencida aparecia como "PENDENTE"

Continuação direta do bug da secção 19: o mutuário via a sua parcela
vencida com o chip "PENDENTE" (laranja) em `frontend/src/pages/portal/
DetalheCredito.jsx`, porque essa página mostrava `parcela.estado` em
bruto — o mesmo campo da BD que, como explicado na secção 19, só passa
a `ATRASADO` quando há um pagamento parcial registado contra a parcela.
O backoffice já tinha a correção certa em `CreditoDetalhe.jsx`
(`estado !== "PAGO"` e `dataVencimento < hoje`, chip "VENCIDA" a
vermelho, linha destacada) — só faltava replicar no portal.

Corrigido `DetalheCredito.jsx` (portal) com o mesmo padrão: calcula
`vencida` pela data em vez de confiar só no `estado` gravado, mostra
chip "VENCIDA" a vermelho e destaca a linha da tabela.

Validado com `esbuild` (sintaxe/JSX).

## 22. Tratamento de parcelas vencidas: estilo Txuna (restringir acesso, sem juro de mora)

Pergunta do utilizador sobre como outros sistemas tratam atraso de
pagamento. Pesquisado: Txuna M-Pesa (Access Bank + Vodacom, mesmo
mercado deste projeto) não cobra juro de mora — restringe acesso a
crédito novo até o cliente regularizar. Já o KCB M-Pesa (Quénia) cobra
juro de mora composto diário e reporta a um bureau de crédito. Decidido
com o utilizador seguir o estilo Txuna: sem juro extra, só bloqueio de
novos pedidos.

Corrigido:

- Nova função `mutuarioTemCreditoEmIncumprimento(mutuarioId,
  empresaId)` em `services/credito.service.js` — verifica se o
  mutuário tem algum crédito com `estado = "INCUMPRIMENTO"` nesta
  empresa.
- `portalMutuario.controller.js` (`createMeuPedido`, submissão de
  pedido pelo próprio mutuário): novo gate a seguir ao de perfil
  incompleto, devolve 403 com `creditoEmIncumprimento: true` e mensagem
  clara se houver crédito em incumprimento por regularizar.
- Frontend (`CriarPedido.jsx`) já mostra qualquer mensagem de erro da
  API num `Alert`, por isso a mensagem do backend aparece automaticamente
  sem precisar de código novo no frontend.

Decisão deliberada: o gate só se aplica à submissão pelo **próprio
mutuário** (portal). A criação de pedido pelo staff
(`pedidoCredito.controller.js`, usada quando um funcionário cria o
pedido em nome do mutuário) **não foi bloqueada** — mantém-se a
capacidade do staff decidir caso a caso (ex: renegociação), já que tem
contexto e autoridade que o fluxo automático não tem. Se um dia for
preciso bloquear também esse caminho, é o mesmo padrão a replicar em
`createPedidoCredito`.

Validado com `node --check` e suite de testes completa (23 passed, 10
todo).

**Pendente de ação do utilizador:** `docker compose restart
api_backend` (sem dependência nova).

### TBD: critério de desbloqueio para novos pedidos

Em aberto, decisão ainda não tomada. Hoje, "desbloqueio" = só
regularizar: assim que o crédito deixa de ter parcela vencida há mais
de 30 dias por pagar, o agendador diário volta a marcar `ATIVO`
automaticamente (secção 20) e o mutuário já pode voltar a submeter
pedidos de imediato — sem olhar a histórico nem a quantas vezes já
esteve em incumprimento antes.

Preocupação levantada pelo utilizador: isto pode ser fraco demais para
"cliente não muito sério" — paga só o suficiente para desbloquear, pede
crédito novo, repete o ciclo. Opções discutidas, nenhuma escolhida
ainda:

1. **Só regularizar (atual)** — automático, sem fricção nenhuma.
2. **Período de quarentena após regularizar** — mesmo depois de voltar
   a `ATIVO`, fica um período extra (ex: 15/30 dias) sem poder pedir
   crédito novo, contado a partir da data de regularização. Continua
   automático, só precisa de guardar essa data e comparar no gate já
   existente em `createMeuPedido`.
3. **Aprovação manual do staff** — regularizar tira do `INCUMPRIMENTO`,
   mas uma segunda flag só um ADMIN/GESTOR consegue desligar, numa
   página do backoffice, caso a caso. Risco: se ninguém rever, o
   mutuário fica bloqueado indefinidamente por esquecimento.
4. **Depende da reincidência** — 1ª vez em incumprimento: desbloqueio
   automático (opção 1). A partir da 2ª vez (ou N, a definir): passa a
   exigir aprovação manual (opção 3). Mais fiel ao comportamento real
   do Txuna (a penalização cresce com o padrão, não é igual para
   todos), mas exige guardar histórico de incumprimentos por mutuário,
   não só o estado atual do crédito — é a mais trabalhosa das quatro.

Quando houver decisão, implementar e atualizar esta secção.

## 23. Testes de integração reais para 2 dos 10 `test.todo`

Pedido do utilizador ("vamos resolver now"), depois de eu explicar os
10 `test.todo` de `criticalFlows.test.js`. Escopo escolhido: só os 3
que precisam de BD real (não os 5 do sistema de alertas removido, nem
os 2 de infra que nunca existiu — esses exigiriam reconstruir
funcionalidade, não só escrever testes).

**Infra nova:** `config/db.js` passou a ligar a um sqlite em memória
quando `NODE_ENV=test`, em vez do MySQL real — permite correr testes
de integração (BD verdadeira, não mocks) sem precisar de MySQL a
correr no CI/ambiente de testes. `sqlite3` adicionado a
`devDependencies` no `package.json`.

**Novo ficheiro:** `__tests__/authIntegration.test.js` — cobre 2 dos 3
casos:

- **Fluxo OTP completo** (`registerMutuarioRequestOTP` +
  `verifyOTPAndRegister`): pede OTP, lê o OTP real gravado na BD,
  verifica, e confirma que `User` + `Mutuario` reais foram criados, o
  convite ficou marcado como usado, e o token ficou marcado como
  verificado. Mais dois testes: OTP errado é rejeitado sem criar nada,
  e um convite já usado é rejeitado numa segunda tentativa.
- **Registos duplicados**: confirma 409 para email já existente e para
  nuit já existente (mesma empresa).

**Achado durante a escrita dos testes (documentado, não corrigido):**
a deteção de duplicado não é imposta por nenhuma UNIQUE constraint na
BD — é um `findOne` de aplicação em `registerMutuarioRequestOTP`. Só
`User.email` e `Mutuario.codigoMutuario` têm `unique: true` no modelo;
`documentoNumero`/`nuit` não têm constraint nenhuma a nível de BD (só a
verificação de aplicação). Mais grave: essa verificação **não é isolada
por `empresaId`** — ao contrário de `validarIntegridadeMutuario`
(`mutuario.controller.js`), que explicitamente isola por tenant. Na
prática, duas empresas completamente diferentes não conseguem ter cada
uma um mutuário com o mesmo nuit, mesmo sendo pessoas diferentes. Um
terceiro teste (`ACHADO: ...`) documenta este comportamento atual sem
o corrigir — decisão de negócio a confirmar antes de mudar.

**3º caso (refresh de token) não coberto**: continua como `test.todo`
em `criticalFlows.test.js` — não existe nenhum endpoint de refresh no
backend, construir isso seria uma funcionalidade nova, fora do que foi
pedido ("resolver os testes").

**Limitação de validação nesta sessão:** não consegui instalar o
`sqlite3` (módulo nativo) no meu sandbox — a rede aqui bloqueia
`objects.githubusercontent.com` (onde o `sqlite3` descarrega o binário
pré-compilado), embora `github.com` e o registo do `npm` estejam
acessíveis. Confirmei que o único erro ao correr
`authIntegration.test.js` é exatamente `"Please install sqlite3
package manually"` — nem sintaxe nem lógica, só o módulo em falta.
Isto é uma restrição específica deste sandbox, não do código; o
GitHub Actions (CI) e o teu ambiente Docker têm acesso à internet sem
essa restrição, por isso devem instalar sem problema.

**Pendente de ação do utilizador:** correr `npm install && npm test`
(localmente ou `docker compose exec api_backend npm install &&
docker compose exec api_backend npm test`, depois de rebuild) para
confirmar a execução real de `authIntegration.test.js` — é o único
ficheiro desta sessão que não pude validar a correr eu mesmo.

`criticalFlows.test.js`: os 2 `test.todo` cobertos foram substituídos
por comentários a apontar para o novo ficheiro. Ficam 8 `test.todo`
(era 10) — os 5 de alertas removidos, os 2 de infra inexistente, e o
de refresh de token.

## 24. Migração de MySQL para PostgreSQL 16

Pedido do utilizador ("mudar a bd para postgres, e mudar no docker
composer yma para postgres16 alpine"). Investigação prévia (escopo)
confirmou: sem dados reais a preservar (ambiente de desenvolvimento),
por isso migração direta, sem `pgloader` nem passo de transferência de
dados.

**Ficheiros alterados:**

- `docker-compose.yml`: serviço `credito` passou de `mysql:8.0` para
  `postgres:16-alpine`. `container_name` `meu_mysql` → `meu_postgres`.
  Variáveis de ambiente `MYSQL_ROOT_PASSWORD`/`MYSQL_DATABASE` →
  `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` (nota: o Postgres
  usa mesmo o `DB_USER` do `.env` como utilizador da BD — o MySQL
  ignorava essa variável e usava sempre `root`; confirma que o teu
  `DB_USER` real é um nome válido antes de subir). Porta `3306` →
  `5432`. Healthcheck `mysqladmin ping` → `pg_isready`. Volume
  `dados_mysql` → `dados_postgres` (novo volume, vazio — normal, é o
  arranque limpo combinado).
- `backend/config/db.js` e `backend/config/config.js` (ligação da app
  e config do `sequelize-cli`, respetivamente): `dialect: "mysql"` →
  `"postgres"`, porta `3306` → `5432` (lida agora de `DB_PORT`, com
  fallback para 5432 — antes `db.js` tinha a porta staticamente
  fixada, ignorando `DB_PORT`, inconsistente com `config.js`; alinhado
  de caminho).
- `backend/package.json`: `mysql2` removido, `pg` + `pg-hstore`
  adicionados (as duas são necessárias — `pg-hstore` é dependência do
  dialeto Postgres do Sequelize mesmo sem usar hstore diretamente).
- `.env.example`: adicionado `DB_PORT` (opcional, assume 5432).

**Dois pontos de risco real corrigidos (não só troca de nome):**

1. `migrations/00000000000000-baseline.js` desligava/religava
   verificação de foreign keys com `SET FOREIGN_KEY_CHECKS = 0/1`
   (sintaxe exclusiva do MySQL). Corrigido para ramificar por dialeto:
   Postgres usa `SET session_replication_role = 'replica'/'origin'`
   (exige que o utilizador da BD seja superuser — é o caso do
   utilizador criado pelo `docker-compose`, mas pode não ser em
   serviços geridos tipo RDS).
2. Duas migrations verificavam se um ENUM já tinha um valor lendo
   `describeTable(...).coluna.type` como texto (funciona no MySQL, que
   devolve `"enum('A','B')"` como string — não funciona no Postgres,
   que devolve só `"USER-DEFINED"`, porque lá ENUM é um tipo à parte no
   catálogo do sistema, não uma propriedade da coluna). Corrigido com
   um novo helper partilhado, `utils/migrationHelpers.js`
   (`enumJaTemValores`), que consulta `pg_type`/`pg_enum` no Postgres e
   mantém o comportamento antigo no MySQL. Usado em
   `migrations/20260814120000-add-subscription-model-columns.js`
   (ENUMs `users.role` e `empresas.estado`) e em
   `migrations/20260816120000-add-notificacao-tipos.js`
   (`notificacoes.tipo`). Há **12 colunas ENUM** no total nos models —
   as outras 10 nunca são alteradas depois de criadas, só estas duas
   migrations tinham o problema.

**Correções cosméticas** (não quebravam nada, só mostravam "MySQL" ou
liam um campo de erro específico do driver antigo): `health.controller.js`
(`checkDatabase` agora lê `sequelize.getDialect()` em vez de escrever
"MySQL" à mão) e `config/databaseSync.js` (`error.parent.sqlMessage` é
específico do `mysql2`; agora também tenta `.detail`/`.message`, campos
do driver `pg`).

**Limitação de validação nesta sessão:** não consegui correr um
Postgres real no meu sandbox para validar a ligação/`sync()` — sem
`docker`, sem `sudo` para instalar via `apt`, e o `sqlite3` (usado nos
testes de integração) continua bloqueado pela mesma restrição de rede
já documentada na secção 23. Validei o que dava para validar sem BD:
sintaxe de todos os ficheiros tocados, instalação limpa de `pg`/
`pg-hstore`, e revisão cuidadosa da API do Sequelize/Postgres (nomes de
tipo ENUM, `session_replication_role`, etc.) contra a documentação.

**Pendente de ação do utilizador:**

1. **`backend/.env` real: mudar `DB_PORT=3306` para `DB_PORT=5432`.**
   Confirmado concretamente (não é só teórico) — testei a ligação com
   uma cópia do `.env` real neste sandbox e o valor antigo (herdado do
   MySQL) ainda lá estava. `DB_USER=root` não precisa de mudar — o
   Postgres aceita "root" como nome de utilizador sem problema, ao
   contrário do que sugeri antes de testar.
2. `docker compose down -v && docker compose up -d --build` — o `-v`
   é importante aqui, apaga o volume `dados_mysql` antigo (não
   compatível com Postgres) e cria o `dados_postgres` novo, vazio.
   Confirmado com o utilizador que os dados atuais são só de
   desenvolvimento, sem problema em perder.
3. `npm install` dentro do container do backend (ou localmente) para
   regenerar o `package-lock.json` com `pg`/`pg-hstore` — não consegui
   regenerar isto no sandbox porque o `sqlite3` (devDependency, para os
   testes de integração) não instala aqui, e um lockfile sem essa
   entrada ficaria inconsistente com o `package.json`.
4. Depois disso, seguir o guia normal de arranque (secções 1-6 deste
   documento) — deve funcionar exatamente na mesma, agora sobre
   Postgres.

## 25. Adminer (interface visual para a BD)

Pedido do utilizador, na sequência da migração para Postgres: usar
Adminer para ver a BD visualmente e, possivelmente, criar o SUPERADMIN
por lá.

Adicionado como serviço novo no `docker-compose.yml`:

```yaml
adminer:
  image: adminer:4
  container_name: meu_adminer
  restart: on-failure
  environment:
    ADMINER_DEFAULT_SERVER: credito
  ports:
    - "8080:8080"
  depends_on:
    credito:
      condition: service_healthy
```

Acesso: `http://localhost:8080`. Sistema: PostgreSQL. Servidor:
`credito` (nome do serviço, não `localhost` — resolve via DNS interno
do Docker). Utilizador/password/BD: os mesmos `DB_USER`/`DB_PASS`/
`DB_NAME` do `backend/.env`.

**Sobre criar o SUPERADMIN pelo Adminer:** recomendado NÃO fazer por
lá — o Adminer não consegue gerar o hash bcrypt que a app espera no
campo `password_hash` (nome da coluna em snake_case, por causa de
`underscored: true` nos models). A forma correta continua a ser
`docker compose exec api_backend node scripts/createSuperAdmin.js
"Nome" email password`, que já faz o hash certo. Se mesmo assim quiser
inserir manualmente via SQL (ex.: para inspecionar/depurar), o Postgres
tem a extensão `pgcrypto`, cujo `crypt(password, gen_salt('bf', 10))`
produz hash bcrypt compatível com o `bcryptjs` usado no backend — mas
isto é o caminho alternativo, não o recomendado.

Só precisa de `docker compose up -d adminer` (ou incluído no `up -d`
normal) para arrancar; não requer rebuild dos outros serviços.

## 26. Bug: dedupe do importador Excel não isolado por tenant

Contexto: discussão sobre migração de clientes/empréstimos antigos
(caderno/Excel) para o sistema levou a rever o importador de Excel já
existente (`excell.service.js`) — e aí apareceu um bug de isolamento
multi-tenant real, não só teórico.

**O bug:** `Mutuario.codigoMutuario` e `PedidoCredito.numeroPedido`
tinham `unique: true` a nível de coluna nos models — um índice único
GLOBAL, válido em toda a plataforma, não só dentro da empresa dona do
registo. Além disso, as verificações de duplicado do importador
(`importarExcellMutuarios`/`importarExcellPedidos` em
`excell.service.js`) faziam `findOne({ where: { codigoMutuario } })` /
`findOne({ where: { documentoNumero } })` / `findOne({ where: {
numeroPedido } })` sem filtrar por `empresaId` — mesmo o
`documentoNumero`, que nem tem constraint na BD, só na aplicação.

Na prática: duas empresas diferentes no mesmo sistema não conseguiam
usar o mesmo código de mutuário/pedido (índice único global), e o BI
(`documentoNumero`) de um cliente de uma empresa bloqueava esse mesmo
BI a ser usado por outra empresa completamente diferente — o que não
faz sentido, uma pessoa pode legitimamente ser cliente de duas
financeiras diferentes.

**Correção:**

- `backend/models/mutuario.model.js`: removido `unique: true` da
  coluna `codigo_mutuario`; adicionado índice único composto
  `(empresa_id, codigo_mutuario)` via `indexes` do model
  (`mutuarios_empresa_id_codigo_mutuario_unique`).
- `backend/models/pedidoCredito.model.js`: mesmo tratamento para
  `numero_pedido` → índice único composto `(empresa_id,
  numero_pedido)` (`pedidos_credito_empresa_id_numero_pedido_unique`).
- `backend/migrations/20260824130000-tenant-scope-unique-codes.js`:
  nova migration que remove os índices únicos de coluna simples
  antigos (se existirem) e cria os compostos — idempotente, verifica
  `showIndex` antes de mexer, por isso corre sem erro tanto numa BD já
  em uso como numa instalação nova (onde a baseline, que lê os models
  ao vivo, já teria criado a tabela sem o índice antigo).
- `backend/services/excell.service.js`: as três verificações de
  duplicado (`codigoMutuario`, `documentoNumero`,
  `numeroPedido`) passaram a incluir `empresaId` no `where`.
- `backend/__tests__/criticalFlows.test.js`: comentário sobre
  constraints de BD atualizado para refletir o novo estado (já não é
  "unique global", é "unique só dentro da empresa").

**Nota:** o `generateCode.js` (que gera o código automático,
ex. `MUT-20260824-123456`) continua a verificar duplicado
globalmente, sem `empresaId` — isso não é bug, é só mais conservador
do que precisava de ser (a colisão real é astronomicamente
improvável, com data + 6 dígitos aleatórios); não mexi nisso, porque
não é o mesmo código que o utilizador reportou (esse é sobre o código
digitado à mão na planilha de importação, não o gerado
automaticamente).

**Ainda não corrigido (fora do escopo de hoje):** o mesmo padrão de
bug existe em `auth.controller.js` (`registerMutuarioRequestOTP`,
verificação de duplicado por `nuit`/`documentoNumero` no fluxo de
autorregisto por OTP) — já documentado como "ACHADO" no teste de
integração (`authIntegration.test.js`, secção 23 deste documento). Fica
por resolver noutra sessão.

**Correção pós-teste real:** ao correr `npm run migrate` no ambiente
Docker real, a migration falhou: `cannot drop index
mutuarios_codigo_mutuario_key because constraint
mutuarios_codigo_mutuario_key on table mutuarios requires it`. Causa:
quando a baseline cria a tabela via `createTable(model.rawAttributes)`,
um `unique: true` de coluna vira uma **UNIQUE CONSTRAINT** no Postgres
(não um índice solto), mesmo aparecendo no `showIndex()` como se fosse
um índice normal — o Postgres não deixa `DROP INDEX` direto num índice
que é "casa" de uma constraint, é preciso `DROP CONSTRAINT`. Corrigido
em `removerIndiceSeExistir` (agora tenta `removeConstraint` primeiro,
com fallback para `removeIndex` se não for de facto uma constraint).
Esta era a lacuna de não ter conseguido validar contra um Postgres real
no sandbox, mencionada acima — confirma o valor de testar mesmo assim.
Nada tinha sido aplicado quando falhou (a migration não chegou a
`addIndex`), por isso basta correr `npm run migrate` outra vez depois
de atualizar o código.

## 27. Importação de créditos existentes ("saldo de abertura")

Contexto: continuação da discussão de migração de clientes/empréstimos
antigos (caderno/Excel) — a decisão tomada foi não recriar o histórico
completo de parcelas (caro, frágil, baixo valor), mas sim entrar com
um "saldo de abertura": o crédito nasce no sistema já com o saldo
devedor de hoje, e só as parcelas que ainda faltam pagar são criadas.

**O que foi construído:**

- `backend/models/credito.model.js`: nova coluna `importado` (boolean,
  default `false`) — marca créditos criados por esta via, para
  suporte/relatórios saberem que aquele contrato não nasceu no fluxo
  normal pedido → aprovação → desembolso.
- `backend/migrations/20260824131000-add-credito-importado.js`: migration
  idempotente para a coluna acima.
- `backend/services/credito.service.js`: nova função
  `criarCreditoImportado(pedido, desembolso, userId, dadosAbertura,
  options)`. Recebe `parcelasPagas` (quantas das `prazo` parcelas já
  foram pagas antes da migração), `saldoAtual` (opcional — se não
  vier, é calculado como `montanteTotal - (prestacao * parcelasPagas)`),
  `totalPago`, `observacoes` e `numeroContrato` (opcionais). Gera o
  plano de parcelas completo (mesma função `generateCodParcela` do
  fluxo normal) e descarta as primeiras `parcelasPagas` — assim a
  numeração e as datas de vencimento das parcelas restantes continuam
  corretas (ex: "parcela 4 de 12"), sem precisar de pedir ao utilizador
  a próxima data de vencimento à parte. Acrescenta automaticamente uma
  nota em `observacoes` a dizer quantas parcelas já estavam pagas.
- `backend/services/excell.service.js`: nova função
  `importarExcellCreditos`, mesmo padrão dos outros dois importadores
  (parse linha a linha, valida, acumula erros). Colunas: `CodigoMutuario`,
  `ValorOriginal`, `Prazo`, `DataDesembolso`, `ParcelasPagas`
  (obrigatórias); `Taxa` (opcional, cai para a taxa mínima da empresa),
  `Prestacao` (opcional, calculada por `calCredito.js` se não vier —
  mas recomenda-se sempre fornecer o valor real do contrato antigo),
  `SaldoAtual`, `NumeroContrato`, `Observacoes` (opcionais). Cada linha
  cria, numa transação: um `PedidoCredito` "invólucro" (já
  `DESEMBOLSADO`, nunca passou por aprovação — só existe para o
  Crédito ter de onde herdar os valores, mantendo a mesma estrutura de
  dados do resto do sistema), um `Desembolso` com a data real do
  desembolso original (no passado), e o `Credito` via
  `criarCreditoImportado`. Se a transação falhar a meio, nada fica
  meio-criado.
- `backend/controllers/excell.controller.js` + `backend/routes/excell.routes.js`:
  novo endpoint `POST /import/creditos`, mesma proteção `ADMIN`/`GESTOR`
  dos outros dois.
- `frontend/src/api/admin.api.js`: `importarCreditosExcelRequest`.
- `frontend/src/pages/admin/excel/ExcelImportExport.jsx`: novo botão
  "Importar Créditos Existentes", com nota explicativa das colunas.
  Aproveitei para melhorar a mensagem de resultado da importação (para
  os três importadores, não só este) — antes só mostrava "Importação
  concluída", agora mostra contagem de importados/erros/linhas, e uma
  lista com os erros linha-a-linha quando existem (antes ficavam
  escondidos na resposta, sem aparecer em lado nenhum da UI).

**Limitações conhecidas, aceites de propósito** (consistentes com a
decisão de "saldo de abertura", não histórico completo):

- As parcelas já pagas antes da migração não ficam como linhas
  individuais — só um resumo em texto. O extrato do mutuário no portal
  vai mostrar só as parcelas restantes, não o histórico completo desde
  o início do empréstimo.
- As datas de vencimento das parcelas restantes assumem cadência
  mensal regular a partir da `DataDesembolso` — não reflete atrasos ou
  pagamentos irregulares do histórico real. É uma aproximação,
  aceitável para uma ferramenta de migração, não uma reconstrução
  perfeita do livro antigo.
- O `NumeroContrato` do `Credito` continua com `unique: true` GLOBAL
  (não foi alterado — não é o mesmo bug do ponto 26, contratos são
  mesmo pensados para serem únicos na plataforma toda).

**Limitação de validação nesta sessão:** não consegui correr o
importador contra uma BD real neste sandbox (mesma limitação de rede
já documentada nas secções 23/24 — sem Postgres real disponível).
Validei sintaxe de todos os ficheiros tocados (`node --check`) e revi
a lógica com cuidado, incluindo o formato exato devolvido por
`queryInterface.showIndex` no dialeto Postgres (lido diretamente do
código-fonte do Sequelize em `node_modules`, para confirmar que a
migration do ponto 26 usa os campos certos). Recomendo testar a
importação com um ficheiro pequeno (2-3 linhas) antes de usar em
massa.

**Correção pós-teste real:** `npm test` no ambiente Docker do
utilizador revelou que `authIntegration.test.js` falhava por timeout —
`sequelize.sync({force:true})` no `beforeAll` excedeu o default do
jest (5000ms). Não é um bug de lógica, é só um timeout apertado demais
para recriar todas as tabelas/índices do sistema (que cresceu mais uma
vez com as mudanças de hoje) num sqlite em memória dentro de Docker.
Corrigido com `jest.setTimeout(30000)` no topo do ficheiro.

**🔴 Achado grave, corrigido — `npm test` estava a correr contra o
Postgres REAL, não o sqlite em memória.** Ao corrigir o timeout acima
e correr `npm test` de novo, apareceram erros de foreign key vindos
claramente do driver `pg` (não do sqlite) — sinal de que o
`authIntegration.test.js` (que faz `sequelize.sync({force:true})` no
arranque, para começar cada corrida com tabelas limpas) estava ligado
à BD Postgres real do utilizador, e não à sqlite em memória isolada
que era a intenção desde a secção 23 deste documento.

**Causa:** `backend/config/db.js` decide o dialeto com
`process.env.NODE_ENV === "test"`. O `docker-compose.yml` injeta
`env_file: ./backend/.env` no serviço `api_backend`, e esse `.env` tem
`NODE_ENV=development` — isto define a variável de ambiente do
*container todo*, antes de o `npm test`/`jest` sequer arrancar. O jest
só define `NODE_ENV=test` sozinho **se a variável ainda não estiver
definida** — como já vinha definida (development, herdada do
container), o jest não mexe, e `config/db.js` escolhe o ramo Postgres
real. Isto nunca foi apanhado antes porque o GitHub Actions (CI) não
tem esse `.env` a injetar `NODE_ENV`, por isso lá o comportamento
sempre foi o esperado (sqlite) — só se manifestava dentro do Docker do
utilizador.

**Impacto real:** o `sync({force:true})` correu contra a BD Postgres
de desenvolvimento do utilizador, apagando e recriando as tabelas do
sistema. Como o próprio utilizador já tinha confirmado que os dados
atuais são só de desenvolvimento (sem problema em perder, mencionado
durante a migração para Postgres), isto não é uma perda de dados
crítica — mas é um bug real e sério de infraestrutura de testes, que
noutro contexto (BD de um cliente real, por exemplo) teria sido grave.

**Correção (duas camadas, defesa em profundidade):**

1. `backend/package.json`: scripts `test`/`test:watch` passaram de
   `jest`/`jest --watch` para `NODE_ENV=test jest`/`NODE_ENV=test jest
   --watch` — define a variável explicitamente para este comando,
   nunca depende do que já estiver herdado do ambiente à volta.
2. `backend/__tests__/authIntegration.test.js`: o `beforeAll` agora
   verifica `sequelize.getDialect() !== "sqlite"` **antes** de chamar
   `sync({force:true})`, e lança um erro claro em vez de continuar, se
   por algum motivo (configuração futura, outro ambiente) o dialeto não
   for sqlite. Isto garante que este cenário nunca mais passa
   despercebido — falha alto e claro, em vez de silenciosamente apagar
   tabelas de uma BD real.

**Pendente de ação do utilizador:** correr `npm test` outra vez dentro
do container. Os dois testes que ainda falhavam por erro de FK
provavelmente eram sintoma disto (ligados à BD real com pool de
ligações, não ao sqlite isolado) — a expectativa é que passem também
depois desta correção, mas confirma no output real.

**Confirmado pelo utilizador:** `npm test` → 3 suites, 29 passed, 8
todo, tudo verde. Os dois testes de "duplicado" eram mesmo sintoma do
NODE_ENV errado.

**Achado extra (mesma sessão):** a página de Excel
(`/interno/excel`, `ExcelImportExport.jsx`) já existia há mais tempo
(desde antes desta sessão) e continua totalmente funcional, mas **nunca
teve link nenhum na navegação** — só era possível chegar lá digitando
o URL à mão. Mesma classe de bug do "register-interno" mais cedo nesta
sessão (funcionalidade pronta, não descoberta pela UI). Corrigido:
`frontend/src/components/layout/BackofficeLayout.jsx`, `DEFAULT_LINKS`
ganhou `{ label: "Excel", to: "/interno/excel" }` — visível para
ADMIN/GESTOR/ANALISTA/DIRETOR, mesmos papéis já aceites pela rota.
