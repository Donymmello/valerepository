# Recuperação da base de dados / arranque do zero

Guia de referência para o caso de apagares a base de dados (ou clonares o
repositório numa máquina nova) e precisares de pôr tudo a funcionar outra
vez, do zero.

## 1. Pré-requisito

Confirma que `backend/.env` existe e tem as variáveis todas preenchidas
(`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `JWT_SECRET`, `FRONTEND_URL`,
`DB_SYNC`, `DB_ALTER`). Este ficheiro nunca é commitado (está no
`.gitignore`), por isso não vem com o `git clone` — tens de o criar/copiar
à parte.

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
```

Deve terminar com `Schema de subscrição aplicado com sucesso.`

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
