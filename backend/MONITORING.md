# Monitorização e Debugging

Estado real do que existe hoje no backend em termos de observabilidade.
Reescrito porque a versão anterior deste documento descrevia um
sistema de alertas (`AlertManager`, endpoints `/api/alerts/*`) e um
`cacheManager.js` que foram removidos deliberadamente numa limpeza
"ponytail" (ver `PONYTAIL_CHANGES.md`) e nunca chegaram a ser tirados
da documentação.

## O que existe

1. **Request ID** (`middleware/requestId.middleware.js`), cada
   pedido recebe um ID único (`REQ-<timestamp>-<uuid>`), devolvido no
   header `X-Request-ID` e incluído em todos os logs relacionados com
   esse pedido. Serve para seguir um pedido específico pelos logs.

2. **Logs estruturados em JSON** (`utils/logger.js`), 4 níveis
   (`debug`, `info`, `warn`, `error`), filtra campos sensíveis
   (password, token, etc.) antes de logar. Nível controlado por
   `LOG_LEVEL`.

3. **Error handler centralizado** (`middleware/errorHandler.middleware.js`)
  , captura erros não tratados, regista stack trace completo, mascara
   dados sensíveis no corpo do pedido antes de logar (testado em
   `__tests__/criticalFlows.test.js`, suite "Data Integrity").

4. **Métricas de performance por endpoint**
   (`middleware/performanceMetrics.middleware.js`), duração,
   memória, CPU por pedido; guarda as últimas 100 execuções por
   endpoint (`método + caminho`). Só regista em logs, **não** dispara
   alertas nem tem limiares configuráveis (isso foi removido de
   propósito, ver secção seguinte).

5. **Health check** (`controllers/health.controller.js`,
   `routes/health.routes.js`):
   ```
   GET /api/health/ping  , resposta rápida, sem tocar na BD
   GET /api/health       , testa ligação à BD, mostra memória/CPU/uptime/versão do Node
   ```

6. **Dashboard de monitorização** (`controllers/monitoring.controller.js`,
   `routes/monitoring.routes.js`):
   ```
   GET /api/monitoring/dashboard
   ```
   Agrega: estado da BD (`sequelize.authenticate()`), as métricas de
   performance do ponto 4, e `memory`/`uptime`/`cpuUsage` do processo
   Node. Não inclui métricas de cache (removidas na limpeza ponytail,
   nunca foram repostas).

## O que foi removido de propósito (não é uma lacuna a preencher)

- **`AlertManager`** (limiares configuráveis, severidade,
  acknowledge, `/api/alerts/*`), considerado "monitorização
  especulativa" na limpeza ponytail. Ver `PONYTAIL_CHANGES.md`,
  item 3: "use a real APM tool (Prometheus, DataDog) quando a escala
  justificar". `__tests__/criticalFlows.test.js` tem `test.todo(...)`
  a documentar isto explicitamente em vez de fingir que existe.
- **`CacheManager`** (classe com stats de hit/miss), trocado por um
  `Map` simples com TTL. Nem esse chegou a ficar em uso: nenhum
  ficheiro do backend importa `utils/cache.js` hoje, é código morto.
  O mesmo se aplica a `utils/queryLogger.js` (logging de queries SQL):
  não é importado em lado nenhum, e o logging do Sequelize está
  desligado por omissão (`config/db.js`, `logging: false`). Nenhum
  destes dois ficheiros pôde ser apagado a partir deste ambiente de
  trabalho (mesma limitação de permissões entre este ambiente e a
  pasta montada do Windows já descrita no `RECUPERACAO_BD.md`), ficam
  como limpeza manual pendente, seguros de apagar quando o utilizador
  quiser.

## Testes de regressão relacionados

`__tests__/criticalFlows.test.js`, suite "Monitoring & Observability":
`requestIdMiddleware` gera IDs únicos, `performanceMetricsMiddleware`
regista duração real, `ping` responde sem tocar na BD. A suite "Alert
System" ficou como `test.todo(...)` com o motivo (subsistema removido),
não como testes falsos a fingir que passam.

## Se um dia precisares de alertas/APM a sério

Não vale a pena reconstruir o `AlertManager` removido, a recomendação
que já ficou registada na limpeza ponytail continua válida: um serviço
externo dedicado (Prometheus + Grafana, DataDog, New Relic, Sentry
para erros) dá alertas reais (Slack/email/PagerDuty), histórico
persistente e dashboards, sem manter uma implementação caseira à mão.
