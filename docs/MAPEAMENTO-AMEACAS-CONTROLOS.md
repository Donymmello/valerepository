# Mapeamento de ameaças e controlos — Tshemba

Levantamento feito a 4 de outubro de 2026 contra o código do ramo `staged`.
Cada controlo listado foi verificado no ficheiro indicado, não é uma lista de
boas práticas desejáveis. O que não existe aparece em **Lacunas**, com o custo
de o resolver.

O sistema é um SaaS multi-inquilino de crédito: várias financeiras
moçambicanas partilham a mesma instância, cada uma com os seus mutuários,
pedidos e documentos. O pior cenário não é um site em baixo — é uma financeira
ver a carteira da outra, ou a base de dados desaparecer.

---

## 1. Controlos existentes

### Preventivos — camada aplicação

| ID | Controlo | Onde | Eficácia |
|----|----------|------|----------|
| C-01 | JWT verificado em cada pedido, com reavaliação do estado da empresa | `backend/middleware/auth.middleware.js` | Alta |
| C-02 | Autorização por perfil (`authorizeRoles`) | `backend/middleware/role.middleware.js` | Alta |
| C-03 | Âmbito por `empresaId` nos controladores | 16 controladores | Alta |
| C-04 | Access token de 15 min | `auth.controller.js:60` | Média |
| C-05 | Refresh token em BD, revogável no logout | `models/refreshToken.js` | Média |
| C-05b | Rotação do refresh token a cada troca, com deteção de reutilização por família | `refreshAccessToken` em `auth.controller.js` | Alta |
| C-06 | `bcrypt` custo 10 nas palavras-passe | `auth.controller.js` (5 pontos) | Média |
| C-07 | Validação de força da palavra-passe | `validarForcaPassword` | Média |
| C-08 | OTP por email no registo do mutuário | `utils/otpGenerator.js` | Média |
| C-09 | Rate limit em três níveis: 20/15min autenticação, 60 público, 300 API | `middleware/rateLimit.middleware.js` | Média |
| C-10 | `helmet` nos cabeçalhos da API | `server.js:40` | Média |
| C-11 | CORS com origem explícita | `server.js:41` | Média |
| C-12 | Upload validado por assinatura de ficheiro, extensão vem de mapa do servidor | `utils/uploadSeguro.js` | Alta |
| C-13 | Limite de plano por inquilino | `middleware/planoLimite.middleware.js` | Baixa (comercial, não de segurança) |

### Preventivos — camada rede e dados

| ID | Controlo | Onde | Eficácia |
|----|----------|------|----------|
| C-14 | Postgres só em `127.0.0.1:5432`, acesso externo só por túnel SSH | `docker-compose.yml:12` | Alta |
| C-15 | Adminer só em `127.0.0.1:8080` | `docker-compose.yml:63` | Alta |
| C-16 | TLS e HSTS terminados no Caddy partilhado | VPS | Alta |
| C-17 | Cabeçalhos de segurança repetidos nos 9 blocos do nginx (CSP, nosniff, DENY, Referrer-Policy, Permissions-Policy) | `frontend/security-headers.conf` | Alta |
| C-18 | CSP sem terceiros — tipos de letra servidos do próprio domínio | idem | Alta |
| C-19 | 404 em caminhos de sondagem (dotfiles, extensões banidas, caminhos de CMS) | `frontend/nginx.conf` | Baixa (ruído, não ataque) |
| C-20 | `server_tokens off` | idem | Baixa |

### Detetivos

| ID | Controlo | Onde | Eficácia |
|----|----------|------|----------|
| C-21 | `LogAuditoria`: quem, o quê, sobre que registo, quando | `models/logAuditoria.model.js`, 16 controladores | Média |
| C-22 | Logs de aplicação para ficheiro e consola | `utils/logger.js` | **Baixa — ninguém os lê** |
| C-23 | `/api/monitoring/dashboard` e `/api/health/ping` | `controllers/monitoring.controller.js` | Baixa (pull, não push) |

### Corretivos

| ID | Controlo | Onde | Eficácia |
|----|----------|------|----------|
| C-24 | `pg_dump --format=custom` diário, retenção 14 dias | `scripts/backup-db.sh` | **Média — só disco local** |
| C-25 | Limpeza de uploads órfãos em respostas ≥400 | `middleware/limparUploadOrfao.middleware.js` | Média |
| C-26 | `restart: always` / `on-failure` nos containers | `docker-compose.yml` | Baixa |

### Processo

| ID | Controlo | Onde | Eficácia |
|----|----------|------|----------|
| C-27 | 13 suítes Jest no CI, a bloquear o merge | `.github/workflows/ci.yml:32` | Média |
| C-28 | Testes caixa-preta de autenticação, perfis, isolamento e JWT | `tests-api/` | Alta |
| C-29 | `npm audit --audit-level=high` | `ci.yml:38` | **Nenhuma — `continue-on-error: true`** |

---

## 2. Mapeamento ameaça → controlo

Risco residual é o que sobra *depois* dos controlos da linha. "Camadas" conta
camadas distintas com controlo ativo; menos de duas significa ponto único de
falha.

| ID | Ameaça | STRIDE | Controlos | Camadas | Risco residual |
|----|--------|--------|-----------|---------|----------------|
| T-01 | Força bruta / credential stuffing no login | Spoofing | C-06, C-07, C-09 | 1 | **Médio** — limite é por IP, não por conta |
| T-02 | Roubo de token por XSS (JWT em `localStorage`) | Spoofing | C-04, C-10, C-17, C-18 | 2 | **Médio** — CSP precisa de `style-src 'unsafe-inline'` para o MUI |
| T-03 | JWT forjado ou com `role` alterado | Tampering | C-01, C-28 | 1 | Baixo — assinatura verificada, coberto por teste |
| T-04 | Financeira A vê dados da financeira B | Info disclosure | C-01, C-02, C-03, C-28 | 1 | Baixo — imposto no servidor, com teste caixa-preta |
| T-05 | Mutuário A acede ao crédito do mutuário B (IDOR) | Info disclosure | C-02, C-03, C-28 | 1 | Baixo — devolve 404, não 403 |
| T-06 | Analista executa ação de gestor ou admin | Elevation | C-02, C-28 | 1 | Baixo |
| T-07 | Registo financeiro alterado sem rasto | Repudiation | C-21 | 1 | **Médio** — log existe, mas ninguém o consulta e não é imutável |
| T-08 | Upload de executável disfarçado, ou XSS por SVG | Tampering | C-12, C-17, C-25 | 2 | Baixo — assinatura validada, SVG servido como anexo |
| T-09 | Inundação da API / esgotamento de recursos | DoS | C-09, C-16, `mem_limit` | 2 | **Médio** — sem WAF nem proteção DDoS a montante |
| T-10 | Base de dados ou Adminer alcançáveis da internet | Info disclosure | C-14, C-15, C-16 | 1 | Baixo |
| T-11 | Fuga de segredos (`.env` em claro na VPS) | Info disclosure | — | 0 | **Alto** — ver G-04 |
| T-12 | Perda total de dados (disco, ransomware, `DROP` acidental) | DoS | C-24 | 1 | **Alto** — backup no mesmo disco da BD |
| T-13 | Dependência npm vulnerável | Tampering | C-29 | 0 | **Médio** — auditoria não bloqueia |
| T-14 | Ataque em curso passa despercebido | Repudiation | C-22, C-23 | 1 | **Alto** — ver G-01 |
| T-15 | Refresh token roubado usado durante 30 dias | Spoofing | C-05, C-05b | 1 | Baixo — resolvido, ver G-06 |
| T-16 | Tratamento de dados pessoais sem base legal clara | Compliance | rascunho em `docs/POLITICA-DE-PRIVACIDADE.md` | 0 | **Médio** — política por rever e por publicar |

Ameaças sem mapeamento: nenhuma.
Ameaças com uma só camada: T-01, T-03, T-04, T-05, T-06, T-07, T-10, T-12, T-14, T-15.

---

## 3. Lacunas críticas

### G-01 — Nada vigia o sistema (T-14, T-07)

Os logs escrevem para ficheiro dentro do container e ficam lá. Não há envio
para fora, nem alerta, nem monitor de disponibilidade. A queda de 502 em
produção esteve quatro dias por detetar até alguém reparar.

Consequência prática: um atacante que entre tem tempo ilimitado. E uma falha
de disponibilidade só se descobre quando um cliente telefona.

O mais barato que resolve a parte mais importante: um monitor externo de
disponibilidade (UptimeRobot ou equivalente, gratuito) a bater em
`/api/health/ping` de cinco em cinco minutos (a rota `/api/health` so aceita
POST, nao serve para um monitor). Depois, alerta por email quando as falhas de
autenticação de um IP passarem de N em 15 minutos — o `logger` já tem os
dados, falta quem os leia.

**Custo: baixo. Impacto: alto. Primeiro da lista.**

### G-02 — Backup no mesmo disco da base de dados (T-12)

O próprio `scripts/backup-db.sh` diz isto nos comentários. Se o disco da VPS
falhar, perdem-se a base de dados e os catorze dias de backup ao mesmo tempo.
Para um produto que guarda a carteira de crédito de financeiras, isto é risco
existencial, não técnico.

Falta decidir onde guardar fora (Hetzner Storage Box, S3, Backblaze) e meter
um `rclone copy` no fim do script. A decisão é comercial — a conta e as
credenciais — por isso não está feita.

**Custo: baixo. Impacto: crítico.**

### G-03 — Auditoria de dependências não bloqueia (T-13)

`continue-on-error: true` por causa de vulnerabilidades do `xlsx` sem correção
a montante. Resultado: uma CVE crítica nova numa dependência qualquer entra em
produção sem ninguém ver.

Em vez de desligar a auditoria toda, listar explicitamente o que é tolerado
(`npm audit --audit-level=high --omit=dev` com exceções registadas, ou
`audit-ci` com ficheiro de exceções) e tirar o `continue-on-error`. Assim a
exceção conhecida passa e a próxima falha nova trava.

**Custo: baixo. Impacto: médio.**

### G-04 — Segredos em claro, sem rotação (T-11)

`JWT_SECRET`, credenciais da base de dados, chave da Resend e da Africa's
Talking vivem num `.env` na VPS. Não há cofre, nem procedimento de rotação.
Pior: rodar o `JWT_SECRET` desliga a sessão de toda a gente de uma vez, porque
o token não tem identificador de chave.

Mínimo útil, sem infraestrutura nova: permissões `600` no `.env`, dono
`root`, e um procedimento escrito de rotação para o dia em que for preciso.
Suportar duas chaves em simultâneo (`kid` no cabeçalho do JWT) é o passo
seguinte, e só compensa quando houver mais do que um operador.

**Custo: baixo para o mínimo, médio para o `kid`. Impacto: alto se acontecer.**

### G-05 — Sem bloqueio de conta nem MFA para perfis privilegiados (T-01)

O rate limit é por IP. Credential stuffing distribuído por muitos IPs passa
por baixo dele sem o tocar. E um ADMIN de financeira entra no backoffice só
com palavra-passe.

O `otpGenerator` já existe e já envia código por email no registo. Reutilizá-lo
como segundo fator no login de ADMIN e SUPERADMIN é trabalho de horas, não de
dias, e é o controlo com melhor relação custo-benefício que falta.

Bloqueio de conta ao fim de N tentativas falhadas, com contador na linha do
`User`, trata o resto.

**Custo: médio. Impacto: alto.**

### G-06 — Refresh token não roda (T-15) — RESOLVIDO a 4 de outubro de 2026

`refreshAccessToken` valida o token e emite um access novo, mas devolve o
mesmo refresh token. Uma cópia roubada funciona 30 dias e não há como saber
que foi roubada.

A correção é o padrão conhecido: emitir um refresh novo a cada troca, revogar
o anterior, e se o anterior voltar a aparecer, revogar a família toda — isso é
a deteção de reutilização. São poucas linhas em `auth.controller.js:858` e um
campo `familiaId` em `RefreshToken`.

**Custo: baixo. Impacto: médio.**

Feito: `familiaId` em `refresh_tokens`, rotação em cada troca, revogação da
família inteira quando um token já gasto reaparece, e uma janela de graça de
30 segundos para a corrida legítima entre separadores. Seis testes em
`backend/__tests__/rotacaoRefreshToken.test.js`, migração verificada contra
Postgres 16.

### G-07 — JWT em `localStorage` (T-02)

Qualquer XSS lê o token. A CSP é a defesa, mas tem de permitir
`style-src 'unsafe-inline'` porque o MUI injeta estilo em tempo de execução,
o que a enfraquece.

A alternativa correta é cookie `HttpOnly` + `SameSite=Strict`, e implica mexer
em CSRF e em todo o cliente. Não é trabalho de uma tarde, e com a CSP atual e
o token de 15 minutos a exposição é limitada. Fica registado como dívida
consciente, não como esquecimento.

**Custo: alto. Impacto: médio. Adiar com conhecimento de causa.**

---

## 4. Defesa em profundidade — onde falha

Dez das dezasseis ameaças dependem de uma só camada. Nas de controlo de
acesso (T-03 a T-06) isso é aceitável: a camada é o servidor, está testada em
caixa-preta, e não há outra camada sensata a acrescentar numa aplicação
monolítica.

Onde a camada única é mesmo problema:

- **T-12 (perda de dados)** — uma cópia, um disco. É a definição de ponto único de falha.
- **T-14 (deteção)** — nenhuma camada detetiva ativa. Os logs existem, mas não são um controlo enquanto ninguém os ler.
- **T-01 (força bruta)** — só o limite por IP. Tirando o IP ao atacante, não sobra nada.

---

## 5. Ordem de execução

Ordenado por (impacto ÷ esforço), não por gravidade pura.

**Primeiro — dias, não semanas**

1. G-02: `rclone` para armazenamento externo no fim do `backup-db.sh`. Decidir o destino.
2. G-01, parte 1: monitor externo a bater em `/api/health/ping`.
3. ~~G-06: rotação do refresh token com deteção de reutilização.~~ Feito.
4. G-03: exceções explícitas na auditoria, tirar o `continue-on-error`.
5. G-04, parte 1: permissões no `.env`, procedimento de rotação escrito.

**Depois — semanas**

6. G-05: OTP como segundo fator no login de ADMIN e SUPERADMIN; bloqueio de conta.
7. G-01, parte 2: alerta sobre falhas de autenticação repetidas.
8. Restauro de backup testado a sério — um backup por restaurar não é um backup.

**Dívida consciente, com data para rever**

9. G-07: cookie `HttpOnly` em vez de `localStorage`. Rever quando houver mais do que um programador.
10. G-04, parte 2: `kid` no JWT para rotação sem derrubar sessões.

---

## 6. O que fica por fazer e porquê

- **WAF / proteção DDoS**: o Caddy não faz. Cloudflare à frente resolveria T-09
  e parte de T-01, mas mete um terceiro entre o utilizador e dados pessoais, o
  que mexe na política de privacidade. Decisão de negócio, não técnica.
- **Log imutável para a auditoria** (T-07): o `LogAuditoria` está na mesma base
  de dados que os registos que audita. Quem tiver acesso a um tem ao outro.
  Resolver bem implica destino externo só de escrita; não compensa antes de G-01.
- **Testes de restauro automáticos**: cobertos pelo ponto 8 acima, mas precisam
  de ambiente separado. Fica para depois de o backup sair do disco.
