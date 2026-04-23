# 💳 Sistema de Gestão de Créditos – Vale do Zambeze

Sistema web para gestão de crédito, desenvolvido para digitalizar o processo de submissão, análise, validação, aprovação, desembolso e reembolso, com separação entre **portal do mutuário** e **backoffice administrativo**.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Objetivo do Projeto](#-objetivo-do-projeto)
- [Arquitetura Funcional](#-arquitetura-funcional)
- [Funcionalidades Implementadas](#-funcionalidades-implementadas)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Autenticação e Perfis](#-autenticação-e-perfis)
- [Fluxo do Mutuário](#-fluxo-do-mutuario)
- [Fluxo de Aprovação](#-fluxo-de-aprovação)
- [Regras de Negócio Adotadas](#-regras-de-negócio-adotadas)
- [API Principal](#-api-principal)
- [Como Executar Localmente](#-como-executar-localmente)
- [Estado Atual do Projeto](#-estado-atual-do-projeto)
- [Próximos Passos](#-próximos-passos)
- [Autor](#-autor)

---

## 📌 Visão Geral

O **Sistema de Gestão de Créditos – Vale do Zambeze** foi concebido para apoiar o ciclo completo de crédito, desde o registo do mutuário até ao encerramento do pedido após liquidação.

O sistema foi evoluído para suportar dois ambientes distintos:

1. **Portal do Mutuário**
   - registo autónomo
   - login
   - consulta do próprio perfil
   - criação e acompanhamento dos próprios pedidos
   - consulta de detalhe e extrato

2. **Backoffice Administrativo**
   - gestão interna de pedidos
   - gestão de mutuários
   - aprovação por níveis
   - controlo de requisitos
   - desembolsos e reembolsos
   - relatórios e monitoria operacional

---

## 🎯 Objetivo do Projeto

Substituir processos manuais por uma solução digital:

- segura
- auditável
- organizada por perfis
- escalável
- orientada a regras reais de negócio

O projeto foi estruturado para refletir um processo de crédito real, com controlo de etapa, validações fortes e histórico de ações.

---

## 🧭 Arquitetura Funcional

### 1. Portal do Mutuário
Área voltada ao utilizador final autenticado com role `USER`.

Permite:
- registo autónomo
- autenticação
- consulta do próprio perfil de mutuário
- criação de pedidos
- consulta dos próprios pedidos
- consulta de extrato por pedido

### 2. Backoffice
Área interna reservada a perfis administrativos.

Permite:
- consultar e gerir pedidos
- consultar e gerir mutuários
- registar decisões de aprovação
- acompanhar o estado do fluxo
- operar desembolsos e reembolsos
- gerar relatórios e monitoria

---

## ✅ Funcionalidades Implementadas

### Autenticação e Segurança
- Login com JWT
- Proteção de rotas
- Controlo de acessos por perfil
- Registo de ações em logs de auditoria
- Registo público separado do registo interno

### Registo Autónomo do Mutuário
- Criação automática de `User` com role `USER`
- Criação automática do respetivo `Mutuario`
- Ligação entre `User` e `Mutuario` por `userId`
- Geração automática do `codigoMutuario`

### Gestão de Mutuários
- Cadastro administrativo de mutuários
- Atualização de dados pessoais e documentais
- Associação opcional a utilizador `USER`
- Identificação por código único

### Gestão de Pedidos de Crédito
- Criação de pedidos
- Geração automática do número do pedido
- Consulta e atualização de pedidos
- Controlo de estado e etapa atual
- Distinção entre pedidos do portal e do backoffice

### Aprovação por Níveis
- Histórico de aprovações por pedido
- Decisão por nível (`APROVADO` / `REJEITADO`)
- Bloqueio de decisão fora da etapa correta
- Transição de status conforme a etapa
- Aprovação final no último nível
- Rejeição com atualização imediata do estado

### Requisitos do Pedido
- Associação de requisitos a pedidos
- Validação de requisitos
- Bloqueio de aprovação quando houver requisitos obrigatórios pendentes ou rejeitados

### Financeiro
- Registo de desembolsos
- Registo de reembolsos
- Cálculo de saldo por pedido
- Encerramento automático após liquidação total
- Extrato processual e financeiro por pedido

### Monitoria e Operação
- Notificações internas
- Alertas de prazo
- Relatórios operacionais
- Relatórios financeiros
- Exportação de dados para Excel

### Frontend
- Login funcional
- Registo do mutuário
- Rotas protegidas por perfil
- Portal do mutuário com layout próprio
- Backoffice com layout próprio
- Dashboard do mutuário
- Dashboard interno
- Listagem e detalhe base de pedidos internos
- Páginas do portal para perfil, pedidos, criação e extrato

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- React
- Vite
- React Router DOM
- Axios
- Material UI
- Context API

### Backend
- Node.js
- Express.js
- MySQL
- Sequelize
- JSON Web Token (JWT)
- Bcryptjs
- Dotenv
- CORS
- Multer
- XLSX

### Ferramentas de Apoio
- Postman
- Nodemon
- MySQL Workbench
- Git e GitHub

---

## 🧱 Estrutura do Projeto

### Backend (`/backend`)

```txt
backend/
├── config/
│   └── db.js
├── controllers/
│   ├── auth.controller.js
│   ├── mutuario.controller.js
│   ├── pedidoCredito.controller.js
│   ├── aprovacaoPedido.controller.js
│   ├── notificacao.controller.js
│   ├── desembolso.controller.js
│   ├── reembolso.controller.js
│   ├── excell.controller.js
│   ├── extrato.controller.js
│   ├── relatorio.controller.js
│   ├── alertaPrazo.controller.js
│   ├── requisitoCredito.controller.js
│   └── pedidoRequisito.controller.js
├── middlewares/
│   ├── auth.middleware.js
│   └── role.middleware.js
├── models/
│   ├── index.js
│   ├── user.model.js
│   ├── mutuario.model.js
│   ├── pedidoCredito.model.js
│   ├── aprovacaoPedido.model.js
│   ├── notificacao.model.js
│   ├── logAuditoria.model.js
│   ├── desembolso.model.js
│   ├── reembolso.model.js
│   ├── requisitoCredito.model.js
│   └── pedidoRequisito.model.js
├── routes/
│   ├── auth.routes.js
│   ├── mutuario.routes.js
│   ├── pedidoCredito.routes.js
│   ├── aprovacaoPedido.routes.js
│   ├── notificacao.routes.js
│   ├── desembolso.routes.js
│   ├── reembolso.routes.js
│   ├── extrato.routes.js
│   ├── excell.routes.js
│   ├── relatorio.routes.js
│   ├── alertaPrazo.routes.js
│   ├── requisitoCredito.routes.js
│   └── pedidoRequisito.routes.js
├── services/
│   └── excell.service.js
├── utils/
│   ├── logAuditoria.js
│   ├── generateCodigoMutuario.js
│   └── regrasPedido.js
└── server.js
```

### Frontend (`/frontend`)

```txt
frontend/
├── src/
│   ├── api/
│   │   ├── axios.js
│   │   ├── auth.api.js
│   │   ├── portal.api.js
│   │   └── admin.api.js
│   ├── components/
│   │   ├── ProtectedRoute.jsx
│   │   └── layout/
│   │       ├── PortalLayout.jsx
│   │       └── BackofficeLayout.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── RegisterMutuario.jsx
│   │   ├── portal/
│   │   │   ├── DashboardMutuario.jsx
│   │   │   ├── MeuMutuario.jsx
│   │   │   ├── MeusPedidos.jsx
│   │   │   ├── CriarPedido.jsx
│   │   │   ├── DetalhePedido.jsx
│   │   │   └── ExtratoPedido.jsx
│   │   └── admin/
│   │       ├── DashboardInterno.jsx
│   │       ├── pedidos/
│   │       ├── mutuarios/
│   │       ├── aprovacoes/
│   │       ├── desembolsos/
│   │       └── reembolsos/
│   ├── routes/
│   │   └── AppRoutes.jsx
│   ├── utils/
│   │   └── formatters.js
│   ├── App.jsx
│   └── main.jsx
```

---

## 🔐 Autenticação e Perfis

O sistema usa autenticação com JWT e autorização por perfil.

### Perfis existentes
- **ADMIN**
- **GESTOR**
- **ANALISTA**
- **DIRETOR**
- **USER**

### Regras adotadas
- `register-mutuario` cria apenas `USER`
- `register-interno` cria apenas perfis internos
- perfis internos não devem ser criados por rota pública
- o portal do mutuário é separado do backoffice

---

## 👤 Fluxo do Mutuario

### Registo
O mutuário pode registar-se autonomamente no portal.

Ao registar:
- cria-se o `User`
- cria-se o `Mutuario`
- é gerado `codigoMutuario` automaticamente
- a conta já nasce pronta para login

### Operações do mutuário
Depois do login, o mutuário pode:
- ver o próprio perfil
- listar os próprios pedidos
- criar um novo pedido
- ver detalhe do pedido
- consultar extrato

---

## 🏢 Fluxo de Aprovação

A aprovação de pedidos segue por níveis e respeita a etapa atual do pedido.

### Regras principais
- só é possível decidir no nível correspondente à etapa atual
- `nivel` e `decisao` são obrigatórios na decisão
- `decisao` só pode ser `APROVADO` ou `REJEITADO`
- requisitos obrigatórios pendentes ou rejeitados bloqueiam aprovação
- estados finais não podem ser reaprovados/rejeitados
- toda decisão gera histórico e auditoria
- o fluxo pode gerar notificações internas ao criador do pedido

### Fluxo definido
- **Etapa 1**: `SUBMETIDO` → `EM_ANALISE`
- **Etapa 2**: `EM_ANALISE` → `EM_VALIDACAO`
- **Etapa 3**: `EM_VALIDACAO` → `APROVADO`
- **Rejeição**: muda o pedido para `REJEITADO`

---

## 📌 Regras de Negócio Adotadas

- O sistema separa claramente **portal do mutuário** e **backoffice interno**
- O registo do mutuário é autónomo e não depende de associação manual
- O cadastro administrativo de mutuário continua disponível no backoffice
- O `codigoMutuario` é gerado automaticamente
- O pedido pertence a um mutuário e guarda quem o criou
- A aprovação respeita a etapa atual do pedido
- Um pedido não pode ser aprovado com requisitos obrigatórios pendentes ou rejeitados
- Apenas pedidos aprovados podem ser desembolsados
- Apenas pedidos desembolsados podem receber reembolsos
- Quando o total reembolsado atinge ou ultrapassa o total desembolsado, o pedido é encerrado
- O sistema regista logs de auditoria das ações críticas
- O sistema pode emitir notificações internas sem duplicação desnecessária

---

## 🔌 API Principal

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/register-mutuario`
- `POST /api/auth/register-interno`

### Portal do Mutuário
- `GET /api/portal/meu-mutuario`
- `GET /api/portal/meus-pedidos`
- `POST /api/portal/meus-pedidos`
- `GET /api/portal/meus-pedidos/:id`
- `GET /api/portal/meus-pedidos/:id/extrato`

### Aprovações
- `GET /api/aprovacoes/pedido/:pedidoId`
- `POST /api/aprovacoes/pedido/:pedidoId/decidir`
- `GET /api/aprovacoes/minhas`

### Excel
- exportação de dados do sistema
- estrutura preparada para importação

---

## 🚀 Como Executar Localmente

### 1. Clonar o projeto

```bash
git clone <url-do-repositorio>
cd gestao-creditos
```

### 2. Configurar o backend

```bash
cd backend
npm install
```

Crie um ficheiro `.env`:

```env
PORT=5000
DB_NAME=nome_da_base
DB_USER=root
DB_PASS=
DB_HOST=localhost
JWT_SECRET=sua_chave_secreta
```

Executar:

```bash
npm run dev
```

### 3. Configurar o frontend

```bash
cd ../frontend
npm install
```

Crie um ficheiro `.env` no frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

Executar:

```bash
npm run dev
```

---

## 📊 Estado Atual do Projeto

### Backend
Já cobre:
- autenticação
- registo autónomo do mutuário
- mutuários
- pedidos de crédito
- aprovações por níveis
- requisitos do pedido
- notificações
- logs de auditoria
- desembolsos
- reembolsos
- extrato por pedido
- relatórios
- alertas de prazo
- exportação de dados para Excel

### Frontend
Já possui:
- login
- registo do mutuário
- contexto de autenticação
- rotas protegidas
- layouts separados para portal e backoffice
- dashboard do mutuário
- dashboard interno
- páginas do portal
- estrutura inicial dos módulos internos
- início do módulo de pedidos internos

---

## 🚧 Próximos Passos

- Fechar o módulo interno de pedidos com ações operacionais completas
- Ligar o módulo de mutuários com dados reais
- Ligar módulo de aprovações do utilizador interno
- Ligar desembolsos e reembolsos no backoffice
- Reforçar dashboards operacionais
- Melhorar UX/UI das páginas
- Concluir importação de Excel
- Expandir relatórios exportáveis
- Evoluir notificações e monitoria

---

## 👨‍💻 Autor

**Sidónio Aly António**  
Engenheiro em Tecnologias de Informação e Comunicação  
Moçambique

---

## 📄 Licença

Este projeto pode ser adaptado, estudado e evoluído conforme os objetivos académicos, profissionais ou institucionais do seu desenvolvimento.
