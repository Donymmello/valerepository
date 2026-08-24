# 💳 Sistema de Gestão de Crédito (SaaS Multi-Tenant)

> Nome do produto por definir.

Plataforma web para gestão de crédito/microcrédito, com separação entre **portal do mutuário** e **backoffice administrativo**, desenhada para servir várias financeiras (tenants) na mesma instalação, cada uma com os seus próprios utilizadores, mutuários e dados isolados.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura Multi-Tenant](#-arquitetura-multi-tenant)
- [Arquitetura Funcional](#-arquitetura-funcional)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Autenticação e Perfis](#-autenticação-e-perfis)
- [Fluxo do Mutuário](#-fluxo-do-mutuário)
- [Fluxo de Aprovação](#-fluxo-de-aprovação)
- [Tratamento de Incumprimento](#-tratamento-de-incumprimento)
- [Notificações](#-notificações)
- [Regras de Negócio Adotadas](#-regras-de-negócio-adotadas)
- [API Principal](#-api-principal)
- [Como Executar](#-como-executar)
- [Testes](#-testes)
- [CI/CD](#-cicd)
- [Estado Atual do Projeto](#-estado-atual-do-projeto)
- [Próximos Passos](#-próximos-passos)
- [Changelog](#-changelog)
- [Autor](#-autor)

---

## 📌 Visão Geral

O sistema apoia o ciclo completo de crédito, desde o registo do mutuário até ao encerramento do pedido após liquidação (ou até à recuperação de um incumprimento), com:

1. **Portal do Mutuário** — registo autónomo (com verificação por OTP), simulação de crédito, submissão e acompanhamento de pedidos, consulta de extrato e créditos, exportação em PDF/Excel.
2. **Backoffice Administrativo** — gestão de pedidos, mutuários, aprovação por níveis, requisitos, desembolsos, reembolsos, relatórios, auditoria, e um painel de configuração por empresa.
3. **Painel Superadmin** — gestão das empresas (tenants) que usam a plataforma: criação, planos, estado de subscrição (trial/ativa/suspensa/cancelada).

---

## 🏢 Arquitetura Multi-Tenant

Cada financeira que usa a plataforma é uma **Empresa** (tenant), isolada das restantes:

- Todos os dados de negócio (mutuários, pedidos, créditos, notificações, requisitos, logs) são filtrados por `empresaId`.
- Uma empresa nova nasce com **7 dias de trial** (`estado = "TESTE"`), depois passa a `ATIVA`, `SUSPENSA` ou `CANCELADA` — controlado pelo SUPERADMIN.
- `SUSPENSA`/`CANCELADA`/trial expirado bloqueiam o acesso de todos os utilizadores dessa empresa, exceto o SUPERADMIN (que não pertence a nenhuma empresa).
- Cada empresa tem a sua própria **faixa de taxa de juros** (`taxaJurosMin`/`taxaJurosMax`), configurável em `/interno/empresa`.
- Duas formas de criar uma empresa: self-service pela landing page (trial grátis), ou diretamente pelo painel SUPERADMIN.

---

## 🧭 Arquitetura Funcional

### 1. Portal do Mutuário
Área para o utilizador final (role `USER`/`MUTUARIO`). Permite: registo com verificação por OTP, simulação de crédito, submissão de pedidos, consulta de perfil/pedidos/créditos/extratos, exportação em PDF e Excel, upload de comprovativos de pagamento.

### 2. Backoffice
Área interna para perfis administrativos (`ADMIN`, `GESTOR`, `ANALISTA`, `DIRETOR`). Permite: gerir pedidos e mutuários, decidir aprovações por nível, validar requisitos, registar desembolsos e reembolsos, configurar a empresa, consultar relatórios/dashboards, importar/exportar dados em Excel, exportar documentos em PDF, consultar logs de auditoria.

### 3. Painel Superadmin
Área exclusiva do dono da plataforma (role `SUPERADMIN`, sem `empresaId`). Gere as empresas clientes: cria, edita, muda estado de subscrição.

---

## ✅ Funcionalidades

### Autenticação e Segurança
- Login com JWT, proteção de rotas, controlo de acesso por perfil
- Registo de ações em logs de auditoria
- Registo do mutuário em duas etapas com verificação de email por OTP
- Convite de portal (token) para controlar quem pode registar-se numa empresa
- CORS restrito a origens configuradas, headers de segurança (`helmet`)
- Validação de força de password em todos os fluxos de criação/alteração
- Interceptor de sessão expirada no frontend (401 → redireciona para login)

### Gestão de Mutuários
- Cadastro administrativo e registo autónomo pelo portal
- Perfil KYC (documento, NUIT, data de nascimento, morada) completado após o registo, obrigatório antes do primeiro pedido
- Código de mutuário único gerado automaticamente
- Situação financeira por mutuário (pedidos ativos, créditos ativos/incumprimento, saldo em dívida, parcelas em atraso) visível na listagem

### Gestão de Pedidos de Crédito
- Simulação de crédito antes da submissão
- Criação de pedidos (portal ou backoffice), número de pedido automático
- Aprovação por 3 níveis, com taxa de juros definida na etapa de análise de risco (dentro da faixa da empresa)
- Requisitos obrigatórios bloqueiam aprovação enquanto pendentes/rejeitados

### Crédito, Desembolso e Reembolso
- Criação automática do crédito e das parcelas ao desembolsar um pedido aprovado
- Registo de reembolsos por parcela, com atualização de saldo e liquidação automática
- Deteção automática de parcelas vencidas (por data, não só por campo gravado)
- Marcação e recuperação automáticas de créditos em **incumprimento** (ver secção própria)

### Notificações (in-app, email, SMS)
- Alertas automáticos diários de parcelas a vencer/vencidas e prazos de avaliação/validação de pedidos
- Notificações internas ao staff (pedido criado, requisito anexado, comprovativo enviado)
- Despacho externo (email via Resend, SMS via Africa's Talking) para mutuários, em nome da empresa

### Exportação de Documentos
- PDF: extrato do pedido, comprovativo de desembolso, comprovativo de reembolso (portal e backoffice)
- Excel: exportação de mutuários, pedidos, desembolsos, reembolsos, relatório financeiro; importação em massa de mutuários e pedidos

### Frontend
- Code-splitting por rota (carregamento sob demanda), `ErrorBoundary` global
- Tema central MUI, componentes partilhados (cabeçalhos, estados de carregamento, cartões de estatística)
- Dashboards separados para portal e backoffice, com indicadores financeiros e de risco

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- React + Vite
- React Router DOM
- Axios
- Material UI
- Context API

### Backend
- Node.js + Express.js
- PostgreSQL 16 + Sequelize
- JSON Web Token (JWT) + Bcryptjs
- Helmet, CORS, express-rate-limit
- Multer (upload de ficheiros)
- node-cron (agendador de verificações diárias)
- Resend (email) + Africa's Talking (SMS)
- pdfkit (geração de PDF)
- xlsx (exportação/importação de Excel — migração para `exceljs` planeada, ver Próximos Passos)

### Infraestrutura
- Docker + Docker Compose (PostgreSQL, backend, frontend)
- GitHub Actions (CI: testes, build, lint informativo)
- Jest (testes unitários e de integração)

---

## 🧱 Estrutura do Projeto

```txt
backend/
├── config/         # ligação à base de dados (PostgreSQL em produção, sqlite em memória nos testes)
├── controllers/     # lógica de negócio por domínio (auth, mutuário, pedido, crédito, aprovação, ...)
├── middleware/       # autenticação, autorização por role, tratamento de erros, métricas
├── models/          # modelos Sequelize + associações (models/index.js)
├── routes/          # definição de rotas Express por domínio
├── services/         # lógica reutilizável entre controllers (crédito, agendador, notificações, PDF, Excel)
├── utils/            # helpers (regras de negócio, geração de códigos, logger, etc.)
├── migrations/        # migrations do sequelize-cli
├── scripts/          # scripts avulsos (criar superadmin, aplicar schema, etc.)
├── __tests__/         # testes Jest (unitários com mocks + integração com BD real)
└── server.js

frontend/
├── src/
│   ├── api/           # chamadas Axios por domínio
│   ├── components/     # componentes partilhados e layouts (portal/backoffice)
│   ├── context/        # AuthContext / useAuth
│   ├── pages/
│   │   ├── auth/        # login, registo, verificação OTP
│   │   ├── public/       # landing page
│   │   ├── portal/       # área do mutuário
│   │   ├── admin/        # backoffice
│   │   └── superadmin/    # painel de gestão de empresas
│   ├── routes/         # AppRoutes.jsx (lazy-loaded)
│   ├── theme/          # tema central MUI
│   └── utils/          # formatadores e helpers
```

---

## 🔐 Autenticação e Perfis

Autenticação via JWT, autorização por perfil (`role`).

### Perfis existentes
- **SUPERADMIN** — dono da plataforma, gere as empresas clientes, não pertence a nenhuma empresa
- **ADMIN / GESTOR / ANALISTA / DIRETOR** — staff interno de uma empresa, com permissões diferentes por ação
- **USER / MUTUARIO** — utilizador final, cliente de crédito de uma empresa

### Regras adotadas
- `register-mutuario`/registo por OTP criam apenas `USER`
- `register-interno` cria apenas perfis internos, e exige convite/autorização
- `bootstrap-admin` é o único fluxo público de criação de empresa + ADMIN inicial (self-service)
- o portal do mutuário é isolado do backoffice, e ambos isolados por `empresaId`

---

## 👤 Fluxo do Mutuário

### Registo
1. Preenche o essencial (nome, email, password, telefone) com um convite válido
2. Recebe OTP por email, verifica, e a conta é criada (`User` + `Mutuario`)
3. Completa o perfil KYC (documento, NUIT, data de nascimento) antes do primeiro pedido

### Operações do mutuário
Depois do login: simular crédito, ver perfil, criar e listar pedidos, consultar créditos e extrato, exportar em PDF/Excel, enviar comprovativos de pagamento.

---

## 🏢 Fluxo de Aprovação

- **Etapa 1**: `SUBMETIDO` → `EM_ANALISE` (define a taxa de juros final, dentro da faixa da empresa)
- **Etapa 2**: `EM_ANALISE` → `EM_VALIDACAO`
- **Etapa 3**: `EM_VALIDACAO` → `APROVADO`
- **Rejeição**: em qualquer etapa, muda o pedido para `REJEITADO`
- Requisitos obrigatórios pendentes/rejeitados bloqueiam a aprovação
- Toda decisão gera histórico e auditoria

---

## ⚠️ Tratamento de Incumprimento

Abordagem "estilo Txuna" (inspirada em serviços de microcrédito móvel já usados no mercado): **sem juro de mora**, o atraso é tratado por restrição de acesso, não por custo adicional.

- Um crédito passa automaticamente a **INCUMPRIMENTO** quando tem uma parcela por pagar vencida há mais de 30 dias (verificado diariamente pelo agendador).
- Enquanto em incumprimento, o mutuário **não pode submeter novos pedidos de crédito** pelo portal.
- Assim que deixa de ter parcelas nessas condições (regularizou o atraso), o crédito volta automaticamente a `ATIVO` e o acesso é restaurado — no próximo ciclo diário do agendador.
- Critério de desbloqueio ainda em aberto: hoje é só "regularizar = desbloqueia". Considerar período de carência ou revisão manual para reincidência é uma decisão de negócio pendente (ver Próximos Passos).

---

## 🔔 Notificações

- **Fonte única**: qualquer `Notificacao` criada em qualquer parte do código passa automaticamente por um hook que despacha email/SMS — não é preciso (nem se deve) chamar isso manualmente em cada sítio.
- **Só mutuários recebem email/SMS externo** — notificações para staff interno ficam só in-app, para controlar custo.
- **Agendador diário**: corre para todas as empresas com acesso ativo, verifica parcelas a vencer/vencidas, prazos de pedidos, e incumprimento de créditos.
- Sem chaves de API configuradas (Resend/Africa's Talking), tudo cai para log em consola — não bloqueia o funcionamento em desenvolvimento.

---

## 📌 Regras de Negócio Adotadas

- Isolamento total de dados por empresa (tenant)
- O registo do mutuário é autónomo, com verificação de email obrigatória
- KYC obrigatório antes do primeiro pedido de crédito, não no registo
- A taxa de juros final é decidida na aprovação de nível 1, dentro da faixa da empresa
- Um pedido não pode ser aprovado com requisitos obrigatórios pendentes ou rejeitados
- Apenas pedidos aprovados podem ser desembolsados; apenas desembolsados podem receber reembolsos
- Quando o saldo do crédito chega a zero, é liquidado automaticamente
- Parcela vencida é calculada pela data de vencimento, não só por um campo gravado — evita subcontagem quando não há pagamentos parciais registados
- Crédito em incumprimento bloqueia novos pedidos (sem juro de mora), até regularizar
- O sistema regista logs de auditoria das ações críticas

---

## 🔌 API Principal

### Auth
- `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/auth/register-mutuario-otp`, `POST /api/auth/verify-otp`
- `POST /api/auth/register-interno`, `POST /api/auth/bootstrap-admin`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

### Portal do Mutuário
- `GET /api/portal/meu-mutuario`, `PUT /api/portal/meu-mutuario`
- `GET/POST /api/portal/meus-pedidos`, `GET /api/portal/meus-pedidos/:id`
- `GET /api/portal/meus-creditos`, `GET /api/portal/meus-creditos/:id`
- `GET /api/portal/export/*` (PDF/Excel)

### Backoffice
- `GET/POST /api/pedidos-credito`, `GET/PUT /api/pedidos-credito/:id`
- `GET/POST /api/aprovacoes/pedido/:pedidoId`
- `GET/POST /api/desembolsos`, `GET/POST /api/reembolsos`
- `GET /api/mutuarios`, `GET /api/creditos/:id`
- `GET /api/relatorios/dashboard`, `GET /api/logs-auditoria`
- `GET/POST /api/excell/*` (import/export)

### Empresa e Superadmin
- `GET/PUT /api/empresa` (perfil e configuração da própria empresa)
- `GET/POST/PUT /api/superadmin/empresas`

---

## 🚀 Como Executar

### Via Docker (recomendado)

```bash
git clone <url-do-repositorio>
cd credito-system
docker compose up -d --build
```

O `docker-compose.yml` espera o PostgreSQL ficar saudável antes de arrancar o backend. Ver `RECUPERACAO_BD.md` para o guia completo de arranque do zero (criar SUPERADMIN, primeira empresa, etc.).

### Localmente (sem Docker)

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # preencher DB_*, JWT_SECRET, etc.
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testes

```bash
cd backend
npm test
```

- **Unitários** (`__tests__/criticalFlows.test.js`, `empresaAccess.test.js`) — models mockados, cobrem regras de negócio, permissões e utilitários.
- **Integração** (`__tests__/authIntegration.test.js`) — corre contra sqlite em memória (BD real, não mocks), cobre o fluxo de registo por OTP e a deteção de registos duplicados.

---

## ⚙️ CI/CD

GitHub Actions (`.github/workflows/ci.yml`), acionado em push/PR:

- **Backend**: `npm ci` + `npm test` bloqueantes; `npm audit` informativo
- **Frontend**: `npm ci` + `npm run build` bloqueantes; `npm run lint` e `npm audit` informativos

---

## 📊 Estado Atual do Projeto

Backend e frontend cobrem o ciclo completo: multi-tenancy, autenticação, KYC, simulação e submissão de pedidos, aprovação por níveis, desembolso/reembolso, deteção automática de atraso e incumprimento, notificações in-app/email/SMS, exportação PDF/Excel, auditoria, painel superadmin, e pipeline de CI. Em fase pré-produção — ver pendências abaixo antes de considerar 100% pronto para clientes reais.

---

## 🚧 Próximos Passos

- Decidir o critério de desbloqueio pós-incumprimento (só regularizar vs. período de carência vs. revisão manual vs. reincidência)
- Migrar `xlsx` para `exceljs` (única vulnerabilidade sem correção disponível no `npm audit`)
- Migração de token JWT em `localStorage` para cookie httpOnly (mudança de arquitetura, não urgente)
- Paginação nas listagens do backend e frontend
- `aria-label` em botões só-com-ícone (acessibilidade)
- Confirmar em ambiente real (fora do sandbox de desenvolvimento) a instalação do `sqlite3` para os testes de integração

---

## 📝 Changelog

### Pré-Produção — Agosto 2026

**Multi-tenancy e Subscrição**
- Modelo de dados de subscrição: Empresa (tenant) com trial de 7 dias, estados TESTE/ATIVA/SUSPENSA/CANCELADA
- Painel SUPERADMIN: gestão de empresas clientes, bloqueio de acesso automático por estado
- Isolamento de dados por `empresaId` em todas as queries de leitura e escrita do backoffice
- Taxa de juros configurável por empresa (faixa min/max), com estimativa inicial e definição final na aprovação

**Onboarding e KYC**
- Registo do mutuário em duas etapas com verificação de email por OTP
- Registo simplificado (só o essencial), KYC completado depois em "Completar Perfil", obrigatório antes do primeiro pedido
- Convite de portal (token) para controlar registo autónomo por empresa
- Notificação automática de perfil incompleto após registo

**Segurança**
- CORS restrito a origens configuradas (`FRONTEND_URL` + `CORS_EXTRA_ORIGINS`)
- `helmet` para headers de segurança
- Validação de força de password em todos os fluxos de criação/alteração
- Interceptor de sessão expirada (401) no frontend, com redireção e aviso
- `ErrorBoundary` global no frontend
- Remoção de dependência morta (`mongoose`)
- Correção de vulnerabilidade `uuid` (bump para v11.1.1 — a v12+ quebra `require()` em CommonJS)

**Crédito e Incumprimento**
- Deteção de parcela vencida por data (corrige subcontagem quando não há pagamento parcial registado)
- Marcação e recuperação automáticas de crédito em incumprimento (30 dias de atraso, verificado diariamente)
- Bloqueio de novos pedidos para mutuário com crédito em incumprimento (estilo Txuna, sem juro de mora)
- Correção de bugs de saldo em dívida sem juros no extrato exportado (portal e backoffice)
- Correção de associação Reembolso ↔ PedidoCredito em relatórios (associação só existe via Crédito)

**Notificações**
- Serviço de despacho externo (email via Resend, SMS via Africa's Talking), acionado automaticamente por qualquer `Notificacao` criada
- Agendador diário (node-cron): alertas de parcela a vencer/vencida, prazos de pedido, e verificação de incumprimento — antes dependia de alguém clicar manualmente num botão
- Notificações internas ao staff em pedido criado, requisito anexado, comprovativo enviado
- Correção de ENUM incompleto em `notificacoes.tipo` (`PEDIDO_CRIADO`, `ALERTA_PAGAMENTO` em falta)

**Exportação de Documentos**
- Exportação em PDF: extrato do pedido, comprovativos de desembolso/reembolso (portal e backoffice)
- Exportação/importação em Excel: mutuários, pedidos, desembolsos, reembolsos, relatório financeiro

**Interface**
- Tema central MUI e componentes partilhados (cabeçalhos, estados de carregamento, cartões de estatística)
- Code-splitting por rota (`React.lazy` + `Suspense`)
- Página de detalhe de crédito no backoffice (antes planeada mas nunca ligada)
- Tabela de parcelas vencidas por cobrar, com preenchimento automático do formulário de reembolso
- Indicador "VENCIDA" calculado pela data em vez do campo gravado (portal e backoffice)
- Situação financeira (pedidos/créditos ativos, incumprimento, saldo, parcelas em atraso) na listagem de mutuários

**Infraestrutura**
- Migração da base de dados de MySQL para PostgreSQL 16 (alpine no Docker Compose)
- Testes de integração passaram a correr contra sqlite em memória, isolados da BD de produção

**Qualidade e CI/CD**
- Pipeline de CI (GitHub Actions): testes, build e lint em push/PR
- Testes de integração com BD real (sqlite em memória) para fluxo de registo OTP e deteção de duplicados
- Correção de lint (regras novas do `eslint-plugin-react-hooks` v7, exports mistos em `AuthContext`)
- Regeneração de lockfiles desatualizados (backend e frontend)

---

## 👨‍💻 Autor

**Sidónio Aly António**
Engenheiro em Tecnologias de Informação e Comunicação
Moçambique

---

## 📄 Licença

Este projeto pode ser adaptado, estudado e evoluído conforme os objetivos académicos, profissionais ou institucionais do seu desenvolvimento.
