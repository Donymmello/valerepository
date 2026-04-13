# 💳 Sistema de Gestão de Créditos – Vale do Zambeze

Sistema web para gestão de créditos, desenvolvido para digitalizar o processo de submissão, análise, validação, aprovação, desembolso e reembolso de crédito, com controlo por níveis hierárquicos, auditoria de ações, notificações internas e relatórios operacionais.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Executar Localmente](#-como-executar-localmente)
- [Controlo de Acesso](#-controlo-de-acesso)
- [Regras de Negócio Adotadas](#-regras-de-negócio-adotadas)
- [Estado Atual do Projeto](#-estado-atual-do-projeto)
- [Próximos Passos](#-próximos-passos)
- [Autor](#-autor)

---

## 📌 Visão Geral

O **Sistema de Gestão de Créditos – Vale do Zambeze** foi concebido para apoiar a gestão do ciclo completo de crédito, desde o cadastro do mutuário até ao encerramento do pedido após liquidação.

O objetivo principal é substituir processos manuais por uma solução digital segura, auditável e escalável, alinhada com necessidades como:

- cadastro estruturado de mutuários
- submissão e acompanhamento de pedidos de crédito
- aprovação por níveis hierárquicos
- controlo de requisitos obrigatórios
- registo de desembolsos e reembolsos
- alertas de prazo
- relatórios operacionais e financeiros
- exportação e importação futura de dados em Excel

---

## ✅ Funcionalidades

### Autenticação e Segurança
- Registo e autenticação de utilizadores
- Proteção de rotas com JWT
- Controlo de permissões por perfil
- Registo de ações em logs de auditoria

### Gestão de Mutuários
- Cadastro de mutuários
- Atualização de dados pessoais e documentais
- Associação de pedidos ao mutuário
- Identificação por código único

### Gestão de Pedidos de Crédito
- Criação de pedidos de crédito
- Geração automática do número do pedido
- Consulta e atualização de pedidos
- Controlo de estado e etapa atual do processo

### Aprovação por Níveis
- Aprovação e rejeição por níveis
- Bloqueio de aprovação fora da etapa correta
- Aprovação final no último nível
- Histórico completo de decisões

### Requisitos do Pedido
- Cadastro de requisitos de crédito
- Associação de requisitos a pedidos
- Validação de requisitos
- Bloqueio de aprovação quando houver requisitos obrigatórios pendentes ou rejeitados

### Financeiro
- Registo de desembolsos
- Registo de reembolsos
- Cálculo de saldo por pedido
- Encerramento automático do pedido após liquidação total
- Extrato processual e financeiro por pedido

### Monitoria e Operação
- Notificações internas
- Alertas de prazo de avaliação e validação
- Relatórios gerais
- Relatórios financeiros por pedido
- Relatórios de desembolsos e reembolsos

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- React.js
- React Router
- Axios

### Backend
- Node.js
- Express.js
- MySQL
- Sequelize
- JSON Web Token (JWT)
- Bcryptjs
- Dotenv
- CORS

### Ferramentas de Apoio
- Postman
- Nodemon
- MySQL Workbench
- Git e GitHub

---

## 🧱 Arquitetura do Sistema

O sistema está dividido em duas camadas principais:

### Frontend
Responsável pela interface com o utilizador, consumo da API e exibição dos módulos do sistema.

### Backend
Responsável pela lógica de negócio, autenticação, validações, regras de aprovação, gestão financeira e persistência dos dados em base relacional.

---

## 📁 Estrutura do Projeto

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
├── utils/
│   └── logAuditoria.js
├── services/
│   └── excell.service.js
└── server.js
```

### Frontend (`/frontend`)

```txt
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── routes/
│   ├── App.jsx
│   └── main.jsx
```

---

## 🚀 Como Executar Localmente

### 1. Clonar o projeto

```bash
git clone https://github.com/seuusuario/gestao-creditos.git
cd gestao-creditos
```

### 2. Configurar o backend

```bash
cd backend
npm install
```

Crie um ficheiro `.env` na raiz do backend:

```env
PORT=5000
DB_NAME=nome_da_base
DB_USER=root
DB_PASS=
DB_HOST=localhost
JWT_SECRET=sua_chave_secreta
```

Inicie o backend:

```bash
npm run dev
```

### 3. Configurar o frontend

```bash
cd ../frontend
npm install
npm run dev
```

---

## 🔐 Controlo de Acesso

O sistema usa autenticação baseada em JWT e autorização por perfil.

### Perfis considerados

- **ADMIN**  
  Acesso total ao sistema, incluindo gestão de utilizadores, requisitos e operações administrativas.

- **GESTOR**  
  Gestão operacional, acompanhamento do processo e acesso a funções de supervisão.

- **ANALISTA**  
  Análise, validação e apoio ao fluxo de aprovação.

- **DIRETOR**  
  Aprovação final dos pedidos de crédito.

- **USER**  
  Perfil base reservado para cenários específicos ou evoluções futuras.

---

## 📌 Regras de Negócio Adotadas

- O **mutuário** é o beneficiário do crédito e não precisa, obrigatoriamente, de autenticação no sistema.
- O pedido de crédito é registado por um **utilizador interno autenticado**.
- Cada pedido pertence a um mutuário e guarda quem o criou.
- A aprovação segue por níveis, respeitando a etapa atual do pedido.
- Um pedido **não pode ser aprovado** se houver requisitos obrigatórios pendentes ou rejeitados.
- Apenas pedidos aprovados podem ser desembolsados.
- Apenas pedidos desembolsados podem receber reembolsos.
- Quando o total reembolsado atingir ou ultrapassar o total desembolsado, o pedido é encerrado automaticamente.
- O sistema regista auditoria das ações críticas.
- O sistema pode gerar notificações internas e alertas de prazo.

---

## 📊 Estado Atual do Projeto

Atualmente, o backend já cobre os seguintes módulos:

- autenticação
- mutuários
- pedidos de crédito
- aprovações por níveis
- requisitos do pedido
- notificações
- logs de auditoria
- desembolsos
- reembolsos
- extrato por pedido
- relatórios gerais e financeiros
- alertas de prazo
- Exportação de dados para Excel

---

## 🚧 Próximos Passos

Os próximos passos previstos para evolução do projeto são:

- Importação de dados via Excel
- Prevenção de alertas duplicados
- Regras mais finas por etapa e perfil
- Melhorias no frontend
- Dashboard operacional
- Relatórios exportáveis
- Integração futura com email e/ou SMS

---

## 👨‍💻 Autor

**Sidónio Aly António**  
Engenheiro em Tecnologias de Informação e Comunicação  
Moçambique

- LinkedIn: [Sidónio Aly António](https://www.linkedin.com/in/sidonio-aly-antonio)

---

## 📄 Licença

Este projeto pode ser adaptado, estudado e evoluído conforme os objetivos académicos, profissionais ou institucionais do seu desenvolvimento.
