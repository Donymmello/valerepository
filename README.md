# 💳 Sistema de Gestão de Crédito – Vale do Zambeze

Sistema web para gerenciamento de empréstimos, desenvolvido para digitalizar o processo de solicitação, análise e aprovação de crédito, com controle por níveis de usuário e registro de atividades.

---

## 📋 Índice

- [📌 Funcionalidades](#-funcionalidades)
- [🛠️ Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [🧱 Estrutura do Projeto](#-estrutura-do-projeto)
- [🚀 Como Executar Localmente](#-como-executar-localmente)
- [🔐 Controle de Acesso](#-controle-de-acesso)
- [🌐 Deploy](#-deploy)
- [📈 Melhorias Futuras](#-melhorias-futuras)
- [👨‍💻 Autor](#-autor)
- [✅ Licença](#-licença)

---

## 📌 Funcionalidades

- ✅ Registro e autenticação de usuários
- ✅ Diferenciação de permissões por cargo (admin, analista, cliente)
- ✅ Cadastro de pedidos de empréstimos
- ✅ Fluxo de aprovação e rejeição por analistas
- ✅ Histórico de atividades com logs automáticos
- ✅ Dashboard com estatísticas resumidas
- ✅ Interface responsiva e intuitiva (React)
- ✅ API segura com autenticação JWT
- ✅ Integração com banco de dados MongoDB
- ✅ Separação entre frontend e backend

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- React.js
- React Router
- Axios
- Tailwind CSS ou CSS puro
- Vercel (Deploy)

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JSON Web Token (JWT)
- Middleware para autenticação e logging
- Render ou Railway (Deploy)

### Outros
- MongoDB Atlas (DB na nuvem)
- Dotenv para variáveis de ambiente
- ESLint (opcional)

---

## 🧱 Estrutura do Projeto

### Backend (`/backend`)
backend/
├── controllers/
│ ├── auth.controller.js
│ ├── emprestimo.controller.js
│ ├── user.controller.js
│ ├── log.controller.js
├── models/
│ ├── User.js
│ ├── Emprestimo.js
│ ├── Log.js
├── routes/
│ ├── auth.routes.js
│ ├── user.routes.js
│ ├── emprestimo.routes.js
│ ├── log.routes.js
├── middleware/
│ ├── authMiddleware.js
│ ├── logger.js
├── config/
│ └── db.js
└── server.js

### Frontend (`/frontend`)
frontend/
├── src/
│ ├── components/
│ ├── pages/
│ ├── services/
│ ├── App.js
│ └── index.js
---

## 🚀 Como Executar Localmente

### 1. Clone o projeto
```bash
git clone https://github.com/seuusuario/gestao-credito.git
cd gestao-credito

2. Configure o backend
'''bash
cd backend
npm install
Crie um arquivo .env e adicione:

ini
PORT=5000
MONGO_URI=sua_string_mongodb_atlas
JWT_SECRET=sua_chave_secreta
Inicie o servidor:

bash
npm run dev

3. Configure o frontend
bash
cd ../frontend
npm install
Crie um arquivo .env.local com:

ini
REACT_APP_API_URL=http://localhost:5000

Inicie a aplicação:
bash
npm start

🔐 Controle de Acesso
O sistema utiliza autenticação baseada em JWT com controle de roles. Cada tipo de usuário tem permissões específicas:

Tipo de Usuário	Permissões
Admin	Gerencia usuários e acessa todos os dados
Analista	Aprova/rejeita empréstimos
Cliente	Cria e consulta seus próprios empréstimos

📈 Melhorias Futuras
📊 Geração de relatórios financeiros em PDF

🔔 Notificações por email sobre status dos empréstimos

📅 Histórico de crédito por cliente

📬 Integração com SMS ou WhatsApp para avisos

📱 Versão mobile com React Native

👨‍💻 Autor
Desenvolvido por [Sidonio Aly Antonio]
🎓 Engenheiro em Tecnologias de Informação e Comunicação
📧 sidonioaly@gamil.com
🔗 (https://www.linkedin.com/in/sidonio-aly-antonio-3ab720196)
🌍 Moçambique

✅ Licença
Este projeto está sob a licença MIT. Sinta-se livre para usar, estudar e contribuir.
