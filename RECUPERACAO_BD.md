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

O `docker-compose.yml` já espera o MySQL ficar saudável antes de arrancar
o backend (healthcheck), e o `server.js` tenta ligar-se várias vezes com
espera entre tentativas — não deve ser preciso reiniciar manualmente.

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
