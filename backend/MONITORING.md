# 🚀 Sistema de Monitoramento e Debugging

Documentação completa do sistema de monitoramento, observabilidade e debugging implementado no backend.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Componentes Implementados](#componentes-implementados)
3. [Endpoints de Monitoramento](#endpoints-de-monitoramento)
4. [Como Usar](#como-usar)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema de monitoramento implementa as 10 regras de observabilidade:

1. ✅ **Request ID único** - Rastreabilidade de todas as requisições
2. ✅ **Stack Tracer completo** - Todos os erros com stack trace detalhado
3. ✅ **Logs estruturados JSON** - Não texto livre, apenas JSON estruturado
4. ✅ **Health Check detalhado** - Status da aplicação em tempo real
5. ✅ **Query Logging com tempo** - Todas as queries com duração
6. ✅ **Cache Hit/Miss Tracking** - Métricas de cache
7. ✅ **Métricas de performance** - Tempo, memória, CPU por endpoint
8. ✅ **Testes de regressão** - Framework pronto para testes críticos
9. ✅ **Alertas configuráveis** - Sistema de anomalias com thresholds
10. 🔄 **Deploy monitoring** - Base para rollback (requer CI/CD)

---

## 🔧 Componentes Implementados

### 1. **Logger (Structured JSON)**
📁 `backend/utils/logger.js`

```
Características:
- Logs estruturados em JSON
- Suporta 4 níveis: debug, info, warn, error
- Inclui requestId, userId, endpoint, stack traces
- Filtra dados sensíveis (passwords, tokens)
- Variável de ambiente: LOG_LEVEL
```

### 2. **Request ID Middleware**
📁 `backend/middleware/requestId.middleware.js`

```
Características:
- Gera ID único para cada requisição
- Formato: REQ-[timestamp_base36]-[uuid_primeiros_8_chars]
- Adiciona header X-Request-ID na resposta
- Associa a req.requestId para uso em logs
```

### 3. **Error Handler Middleware**
📁 `backend/middleware/errorHandler.middleware.js`

```
Características:
- Captura erros não tratados
- Stack trace completo
- Wrapper asyncHandler para evitar try-catch
- Sanitiza dados sensíveis
- Respostas consistentes
```

### 4. **Performance Metrics Middleware**
📁 `backend/middleware/performanceMetrics.middleware.js`

```
Características:
- Rastreia duração de requests
- Mede delta de memória
- Calcula CPU usage
- Integrado com Alert Manager
- Armazena últimas 100 requisições por endpoint
```

### 5. **Alert Manager (Sistema de Anomalias)**
📁 `backend/utils/alertManager.js`

```
Características:
- Thresholds configuráveis para métricas
- Severidade: warning, critical
- Histórico de alertas
- Reconhecimento de alertas (acknowledge)
- Subscribers para notificações
- Cleanup automático (24h)
```

**Thresholds padrão:**
- Endpoint response time: ⚠️ 3s / 🔴 5s
- Memory usage: ⚠️ 70% / 🔴 85%
- CPU usage: ⚠️ 60% / 🔴 80%
- DB query time: ⚠️ 1s / 🔴 3s
- Cache miss rate: ⚠️ 30% / 🔴 50%
- Error rate: ⚠️ 1% / 🔴 5%

### 6. **Health Check**
📁 `backend/controllers/health.controller.js`
📁 `backend/routes/health.routes.js`

```
Características:
- /api/health/ping - Verificação rápida
- /api/health - Diagnósticos completos
- Testa conexão DB
- Monitora memória, CPU, uptime
- Mostra versão do Node
```

### 7. **Query Logger**
📁 `backend/utils/queryLogger.js`

```
Características:
- Registra todas as queries SQL
- Tempo de execução
- Tabela e tipo de operação
- Integração com logger estruturado
```

### 8. **Cache Manager**
📁 `backend/utils/cacheManager.js`

```
Características:
- Cache em memória com TTL
- Hit/Miss tracking
- Pronto para substituir por Redis
- Stats de utilização
```

### 9. **Monitoring Dashboard**
📁 `backend/controllers/monitoring.controller.js`
📁 `backend/routes/monitoring.routes.js`

```
Características:
- Agregador de todas as métricas
- Status do sistema
- Performance stats
- Cache stats
```

### 10. **Alert Management API**
📁 `backend/controllers/alerts.controller.js`
📁 `backend/routes/alerts.routes.js`

```
Características:
- Listar alertas ativos
- Histórico de alertas
- Estatísticas
- Acknowledge de alertas
- Configurar thresholds
```

### 11. **Test Framework**
📁 `backend/__tests__/criticalFlows.test.js`

```
Características:
- Jest configurado
- 30+ testes de regressão
- Suites: Auth, OTP, Pedido, Alerts, Monitoring, Integrity
- Estrutura pronta para implementação
```

---

## 📡 Endpoints de Monitoramento

### Health Checks

```
GET /api/health/ping
  - Resposta rápida (sem DB check)
  - Retorna: {status: "OK", requestId}

GET /api/health
  - Diagnóstico completo
  - Inclui: DB status, memória, CPU, uptime, Node version
```

### Monitoring Dashboard

```
GET /api/monitoring/dashboard
  - Agregador de métricas
  - Performance stats por endpoint
  - Cache metrics
  - System info (memory, CPU, uptime)
```

### Alert Management

```
GET /api/alerts/active
  - Lista alertas não reconhecidos
  - Query param: ?severity=critical|warning

GET /api/alerts/history
  - Histórico de alertas
  - Query param: ?limit=50 (default)

GET /api/alerts/stats
  - Estatísticas: total, active, critical, warning
  - Top metrics com alertas

GET /api/alerts/thresholds
  - Configuração atual de todos os thresholds

POST /api/alerts/acknowledge/:alertId
  - Marcar alerta como reconhecido
  - Requer alertId no path

POST /api/alerts/thresholds/set
  - Configurar novo threshold
  - Body: {metric, warning, critical, unit}
```

---

## 💡 Como Usar

### 1. Instalar Dependências

```bash
cd backend
npm install
```

Nota: Jest e uuid já estão no package.json

### 2. Começar o Servidor

```bash
npm run dev     # Modo desenvolvimento com nodemon
npm start       # Modo produção
npm test        # Executar testes
```

### 3. Monitorar em Tempo Real

```bash
# Terminal 1: Server
npm run dev

# Terminal 2: Check health
curl http://localhost:5000/api/health/ping

# Terminal 3: Dashboard
curl http://localhost:5000/api/monitoring/dashboard

# Terminal 4: Alertas
curl http://localhost:5000/api/alerts/active
```

### 4. Configurar Threshold Personalizado

```bash
curl -X POST http://localhost:5000/api/alerts/thresholds/set \
  -H "Content-Type: application/json" \
  -d '{
    "metric": "endpoint_response_time",
    "warning": 2000,
    "critical": 4000,
    "unit": "ms"
  }'
```

### 5. Ver Logs Estruturados

```bash
# Logs automáticos no console em JSON
# Cada requisição gera 1-2 logs estruturados

# Filtrar por requestId (para rastreabilidade)
# grep "REQ-xxx" logs.txt | jq '.stack'
```

---

## 🔍 Exemplos Práticos

### Exemplo 1: Rastrear uma requisição

```bash
# 1. Fazer requisição
curl http://localhost:5000/api/health/ping -v

# 2. Pegar REQUEST ID no header
# X-Request-ID: REQ-1vbg4uj-a1b2c3d4

# 3. Filtrar logs com esse ID
grep "REQ-1vbg4uj-a1b2c3d4" app.log | jq '.'
```

### Exemplo 2: Detectar Anomalias

```bash
# 1. Checar alertas críticos
curl http://localhost:5000/api/alerts/active?severity=critical

# 2. Resposta:
# {
#   "success": true,
#   "data": [
#     {
#       "metric": "endpoint_response_time",
#       "value": 5500,
#       "severity": "critical",
#       "context": {"endpoint": "POST /api/pedidos-credito", "duration": 5500}
#     }
#   ]
# }

# 3. Reconhecer alerta
curl -X POST http://localhost:5000/api/alerts/acknowledge/alert_123_abc
```

### Exemplo 3: Performance Analysis

```bash
# 1. Ver dashboard
curl http://localhost:5000/api/monitoring/dashboard | jq '.metrics.performance'

# 2. Resposta:
# {
#   "GET /api/health": {
#     "totalRequests": 42,
#     "avgDuration": 15,
#     "minDuration": 12,
#     "maxDuration": 45,
#     "p95Duration": 38,
#     "errorRate": "0.00%"
#   }
# }
```

### Exemplo 4: Testes de Regressão

```bash
# Executar todos os testes
npm test

# Modo watch (reroda ao mudar arquivos)
npm run test:watch

# Com coverage
npm test -- --coverage

# Saída esperada:
# ✓ Authentication Flow (4 testes)
# ✓ OTP Registration Flow (6 testes)
# ✓ Pedido Creation Flow (5 testes)
# ✓ Alert System (5 testes)
# ✓ Monitoring & Observability (7 testes)
# ✓ Data Integrity (4 testes)
```

---

## 🐛 Troubleshooting

### ❌ "uuid module not found"

```bash
# Solução
npm install uuid
```

### ❌ "requestId is undefined"

```javascript
// Verificar se requestId middleware está antes de outras rotas
// Em server.js, deve ser:
app.use(requestIdMiddleware); // ANTES
app.use(express.json());
app.use(cors());
```

### ❌ Logs não aparecem

```bash
# Verificar LOG_LEVEL no .env
LOG_LEVEL=debug

# Ou forçar no logger.js:
const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';
```

### ❌ Jest tests falhando

```bash
# Instalar Jest se não estiver
npm install --save-dev jest

# Certificar que __tests__ existe
mkdir -p backend/__tests__
```

### ❌ Alertas não criados

```javascript
// Verificar se alertManager está importado em performanceMetrics
const alertManager = require('../utils/alertManager');

// Verificar thresholds configurados
curl http://localhost:5000/api/alerts/thresholds
```

---

## 📊 Próximos Passos

### Phase 2 (Opcional):
1. Integrar Prometheus para métricas persistentes
2. Grafana dashboard para visualização
3. DataDog ou New Relic para APM
4. Slack notifications para alertas críticos
5. PostgreSQL para histórico de alertas
6. CI/CD integration para deploy monitoring

### Phase 3:
1. Distributed tracing (Jaeger)
2. Log aggregation (ELK Stack)
3. Budget baselines para anomalias automáticas
4. Machine learning para detecção de padrões

---

## 📝 Resumo de Arquivos

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| logger.js | Util | Logging estruturado JSON |
| alertManager.js | Util | Sistema de alertas e anomalias |
| cacheManager.js | Util | Cache com TTL e hit/miss |
| queryLogger.js | Util | Query logging com timing |
| requestId.middleware.js | Middleware | Geração de Request ID único |
| errorHandler.middleware.js | Middleware | Tratamento centralizado de erros |
| performanceMetrics.middleware.js | Middleware | Rastreamento de performance |
| health.controller.js | Controller | Endpoints de health check |
| alerts.controller.js | Controller | Management de alertas |
| monitoring.controller.js | Controller | Dashboard de monitoramento |
| health.routes.js | Routes | Rotas de health |
| alerts.routes.js | Routes | Rotas de alertas |
| monitoring.routes.js | Routes | Rotas de monitoring |
| criticalFlows.test.js | Tests | 30+ testes de regressão |
| server.js | Config | Middleware registration |
| package.json | Config | Dependencies + Jest config |

---

## ✅ Checklist de Implementação

- [x] Request ID único para rastreadibilidade
- [x] Stack Tracer completo em erros
- [x] Logs estruturados JSON
- [x] Health Check com status detalhado
- [x] Query Logging com tempo
- [x] Cache Hit/Miss Tracking
- [x] Métricas de performance (tempo, memória, CPU)
- [x] Framework de testes para fluxos críticos
- [x] Alertas configuráveis para anomalias
- [x] Dashboard de monitoramento centralizado

---

**Última atualização:** 2026-01-10
**Versão:** 1.0.0
**Status:** ✅ COMPLETO
