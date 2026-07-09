# Graph Report - .  (2026-07-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1005 nodes · 1928 edges · 81 communities (64 shown, 17 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 174 edges (avg confidence: 0.57)
- Token cost: 5,114 input · 825 output

## Graph Freshness
- Built from commit: `c2d6c1ad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth and Excel Export API|Auth and Excel Export API]]
- [[_COMMUNITY_Attachment and Portal Controller|Attachment and Portal Controller]]
- [[_COMMUNITY_Server and Route Setup|Server and Route Setup]]
- [[_COMMUNITY_Frontend Utility Functions|Frontend Utility Functions]]
- [[_COMMUNITY_Authentication Controller|Authentication Controller]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Critical Flow Tests|Critical Flow Tests]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Admin API Requests|Admin API Requests]]
- [[_COMMUNITY_Reembolso Controller|Reembolso Controller]]
- [[_COMMUNITY_Comprovativo Controller|Comprovativo Controller]]
- [[_COMMUNITY_Pedido de Crédito Controller|Pedido de Crédito Controller]]
- [[_COMMUNITY_Aprovação de Pedido Flow|Aprovação de Pedido Flow]]
- [[_COMMUNITY_Mutuário Frontend Pages|Mutuário Frontend Pages]]
- [[_COMMUNITY_Portal API Requests|Portal API Requests]]
- [[_COMMUNITY_Simulação Controller|Simulação Controller]]
- [[_COMMUNITY_Desembolso Controller|Desembolso Controller]]
- [[_COMMUNITY_Excel Import Export|Excel Import Export]]
- [[_COMMUNITY_Health Check Middleware|Health Check Middleware]]
- [[_COMMUNITY_Pedido Requisito Controller|Pedido Requisito Controller]]
- [[_COMMUNITY_Mutuário Controller|Mutuário Controller]]
- [[_COMMUNITY_Alert Manager Service|Alert Manager Service]]
- [[_COMMUNITY_Requisito Frontend Components|Requisito Frontend Components]]
- [[_COMMUNITY_Monitoring and Alerts Backend|Monitoring and Alerts Backend]]
- [[_COMMUNITY_Core Credit Models|Core Credit Models]]
- [[_COMMUNITY_Notificação Controller|Notificação Controller]]
- [[_COMMUNITY_Comprovativo Backoffice UI|Comprovativo Backoffice UI]]
- [[_COMMUNITY_Alerta de Prazo Controller|Alerta de Prazo Controller]]
- [[_COMMUNITY_Alerts Controller|Alerts Controller]]
- [[_COMMUNITY_Vincular Mutuário Controller|Vincular Mutuário Controller]]
- [[_COMMUNITY_Crédito Service|Crédito Service]]
- [[_COMMUNITY_Database Sync and Logging|Database Sync and Logging]]
- [[_COMMUNITY_Relatório Controller|Relatório Controller]]
- [[_COMMUNITY_Requisito de Crédito Controller|Requisito de Crédito Controller]]
- [[_COMMUNITY_Alerta de Pagamento Controller|Alerta de Pagamento Controller]]
- [[_COMMUNITY_Log de Auditoria Controller|Log de Auditoria Controller]]
- [[_COMMUNITY_Monitoring Dashboard Controller|Monitoring Dashboard Controller]]
- [[_COMMUNITY_Credit System Roles and Rules|Credit System Roles and Rules]]
- [[_COMMUNITY_Portal Excel Export Controller|Portal Excel Export Controller]]
- [[_COMMUNITY_Performance Metrics Middleware|Performance Metrics Middleware]]
- [[_COMMUNITY_Dashboard and Reports UI|Dashboard and Reports UI]]
- [[_COMMUNITY_Database and Core Models|Database and Core Models]]
- [[_COMMUNITY_Extrato Controller|Extrato Controller]]
- [[_COMMUNITY_Auth and Crédito Routes|Auth and Crédito Routes]]
- [[_COMMUNITY_Excel Service|Excel Service]]
- [[_COMMUNITY_Cache Manager|Cache Manager]]
- [[_COMMUNITY_Aprovação Routes|Aprovação Routes]]
- [[_COMMUNITY_Anexo and Requisito Models|Anexo and Requisito Models]]
- [[_COMMUNITY_Auth and User Setup|Auth and User Setup]]
- [[_COMMUNITY_Query Logger|Query Logger]]
- [[_COMMUNITY_Error Handler Middleware|Error Handler Middleware]]
- [[_COMMUNITY_Crédito Detail UI|Crédito Detail UI]]
- [[_COMMUNITY_Comprovativo Model|Comprovativo Model]]
- [[_COMMUNITY_Desembolso Model|Desembolso Model]]
- [[_COMMUNITY_Generate Referencia Utility|Generate Referencia Utility]]
- [[_COMMUNITY_Log Auditoria Utility|Log Auditoria Utility]]
- [[_COMMUNITY_Generate Código Mutuário|Generate Código Mutuário]]
- [[_COMMUNITY_Database Transaction Utility|Database Transaction Utility]]
- [[_COMMUNITY_Log Auditoria Model|Log Auditoria Model]]
- [[_COMMUNITY_Mutuário Model|Mutuário Model]]
- [[_COMMUNITY_Notificação Model|Notificação Model]]
- [[_COMMUNITY_Parcela Pagamento Model|Parcela Pagamento Model]]
- [[_COMMUNITY_Pedido de Crédito Model|Pedido de Crédito Model]]
- [[_COMMUNITY_Reembolso Model|Reembolso Model]]
- [[_COMMUNITY_Requisito de Crédito Model|Requisito de Crédito Model]]
- [[_COMMUNITY_Simulação Model|Simulação Model]]
- [[_COMMUNITY_User Model|User Model]]
- [[_COMMUNITY_Crédito Module Stubs|Crédito Module Stubs]]
- [[_COMMUNITY_Excel Export Module|Excel Export Module]]
- [[_COMMUNITY_Email Verification Token|Email Verification Token]]
- [[_COMMUNITY_Password Reset Token|Password Reset Token]]
- [[_COMMUNITY_Alerta de Prazo Controller|Alerta de Prazo Controller]]
- [[_COMMUNITY_Extrato Controller|Extrato Controller]]
- [[_COMMUNITY_Mutuário Controller|Mutuário Controller]]
- [[_COMMUNITY_Notificação Controller|Notificação Controller]]
- [[_COMMUNITY_Pedido Requisito Controller|Pedido Requisito Controller]]
- [[_COMMUNITY_Relatório Controller|Relatório Controller]]
- [[_COMMUNITY_Requisito Crédito Controller|Requisito Crédito Controller]]

## God Nodes (most connected - your core abstractions)
1. `formatDate()` - 42 edges
2. `useAuth()` - 29 edges
3. `formatCurrency()` - 29 edges
4. `getStatusLabel()` - 24 edges
5. `getStatusColor()` - 24 edges
6. `User` - 15 edges
7. `Mutuario` - 15 edges
8. `PedidoCredito` - 15 edges
9. `AlertManager` - 15 edges
10. `Desembolso` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Role-Based Access Control – ADMIN, GESTOR, ANALISTA, DIRETOR, USER` --references--> `Role Middleware`  [INFERRED]
  PROJECT_CONTEXT.md → backend/middlewares/role.middleware.js
- `README – Sistema de Gestão de Créditos Vale do Zambeze` --conceptually_related_to--> `Project Context – Sistema de Gestão de Créditos`  [INFERRED]
  README.md → PROJECT_CONTEXT.md
- `Approval Flow – Etapas 1–3 and Rejection` --references--> `Regras do Pedido – Status and Permissions Matrix`  [EXTRACTED]
  PROJECT_CONTEXT.md → backend/utils/regrasPedido.js
- `Credit Lifecycle – RASCUNHO to ENCERRADO` --references--> `Regras do Pedido – Status and Permissions Matrix`  [EXTRACTED]
  PROJECT_CONTEXT.md → backend/utils/regrasPedido.js
- `Backend Monitoring and Debugging Documentation` --references--> `Error Handler Middleware`  [EXTRACTED]
  backend/MONITORING.md → backend/middleware/errorHandler.middleware.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Financial Flow – Desembolso, Reembolso, Encerramento** — backend_controllers_desembolso, backend_controllers_reembolso, backend_models_desembolso, backend_models_reembolso, backend_models_pedido_credito, concept_credit_lifecycle [EXTRACTED 0.95]
- **Observability Stack – Logger, AlertManager, CacheManager, QueryLogger, Metrics, RequestID** — backend_utils_logger, backend_utils_alert_manager, backend_utils_cache_manager, backend_utils_query_logger, backend_middleware_performance_metrics, backend_middleware_request_id, backend_middleware_error_handler [EXTRACTED 0.98]
- **Approval Pipeline – Controller, Model, Regras, Role Middleware** — backend_controllers_aprovacao_pedido, backend_models_aprovacao_pedido, backend_utils_regras_pedido, backend_middlewares_role, concept_approval_flow [EXTRACTED 0.95]

## Communities (81 total, 17 thin omitted)

### Community 0 - "Auth and Excel Export API"
Cohesion: 0.06
Nodes (43): Frontend HTML Entry, axios, exportarDesembolsosExcelRequest(), exportarMutuariosExcelRequest(), exportarPedidosExcelRequest(), exportarReembolsosExcelRequest(), exportarRelatorioFinanceiroExcelRequest(), importarMutuariosExcelRequest() (+35 more)

### Community 1 - "Attachment and Portal Controller"
Cohesion: 0.08
Nodes (40): anexar(), {
    Anexo,
    PedidoRequisito,
}, download(), listar(), path, anexarReqPedido(), calcularPrestacao, createMeuPedido() (+32 more)

### Community 2 - "Server and Route Setup"
Cohesion: 0.05
Nodes (38): Simulação Controller, Simulação Routes, alertaPagamentoRoutes, alertaPrazoRoutes, alertsRoutes, anexoRoutes, app, aprovacaoPedidoRoutes (+30 more)

### Community 3 - "Frontend Utility Functions"
Cohesion: 0.19
Nodes (23): createDesembolsoRequest(), deleteMutuarioRequest(), getAllAprovacoesRequest(), getAllDesembolsosRequest(), getAllPedidosRequest(), getMutuarioByIdRequest(), updateMutuarioRequest(), exportarMeusPedidosExcelRequest() (+15 more)

### Community 4 - "Authentication Controller"
Cohesion: 0.12
Nodes (28): bcrypt, bootstrapAdmin(), crypto, forgotPassword(), generateCodigoMutuario, { generateOTP, getExpirationTime }, generateToken(), getMe() (+20 more)

### Community 5 - "Backend Dependencies"
Cohesion: 0.06
Nodes (32): dependencies, bcryptjs, cors, crypto, dotenv, express, jsonwebtoken, mongoose (+24 more)

### Community 6 - "Critical Flow Tests"
Cohesion: 0.06
Nodes (31): TODO: Testar alerta de performance, TODO: Testar alerta de memória, TODO: Testar alerta de CPU, TODO: Testar acknowledge, TODO: Testar configuração, TODO: Testar geração de Request ID, TODO: Verificar formato de logs, TODO: Testar métricas de performance (+23 more)

### Community 7 - "Frontend Dependencies"
Cohesion: 0.07
Nodes (27): dependencies, @emotion/react, @emotion/styled, @mui/icons-material, @mui/material, react, react-dom, react-router-dom (+19 more)

### Community 8 - "Admin API Requests"
Cohesion: 0.13
Nodes (17): createReembolsoRequest(), deleteNotificacaoRequest(), getAllLogsAuditoriaRequest(), getAllReembolsosRequest(), getCreditosElegiveisReembolsoRequest(), getLogAuditoriaByIdRequest(), getMeusLogsAuditoriaRequest(), getMinhasNotificacoesRequest() (+9 more)

### Community 9 - "Reembolso Controller"
Cohesion: 0.12
Nodes (23): calcularEstadoFinanceiro(), createReembolso(), CreditoService, generateReferencia, getAllReembolsos(), getReembolsoByCredito(), obterReembolso(), {
  podeRegistrarReembolso,
  ESTADO_CREDITO,
} (+15 more)

### Community 10 - "Comprovativo Controller"
Cohesion: 0.11
Nodes (21): { Comprovativo, PedidoCredito, Reembolso, User }, downloadComprovativo(), enviarComprovativo(), generateReferencia, getComprovativos(), getMeusComprovativos(), path, { podeRegistrarReembolso, STATUS_PEDIDO } (+13 more)

### Community 11 - "Pedido de Crédito Controller"
Cohesion: 0.14
Nodes (23): calcularPrestacao, createPedidoCredito(), criarAlertasPedidoCriado(), deletePedidoCredito(), generateNumeroPedido(), getAllPedidosCredito(), getPedidoCreditoById(), getPedidosByMutuario() (+15 more)

### Community 12 - "Aprovação de Pedido Flow"
Cohesion: 0.18
Nodes (20): {
  AprovacaoPedido,
  PedidoCredito,
  User,
  Mutuario,
  Notificacao,
  PedidoRequisito,
  RequisitoCredito,
}, calcularProximoFluxoAprovacao(), criarNotificacao(), decidirAprovacao(), {
  podeAprovarPedido,
  podeRejeitarPedido,
  podeTransitarStatus,
  STATUS_PEDIDO,
}, registrarLogAuditoria, verificarRequisitosObrigatoriosPendentes(), obterPerfilUser() (+12 more)

### Community 13 - "Mutuário Frontend Pages"
Cohesion: 0.13
Nodes (18): getAllMutuariosRequest(), getMeuMutuarioRequest(), updateMeuMutuarioRequest(), Hero Image – Layered Isometric Blocks (Purple), Backoffice Layout, Portal Layout, Dashboard Interno Page, MutuariosList() (+10 more)

### Community 14 - "Portal API Requests"
Cohesion: 0.19
Nodes (17): deleteNotificacaoRequest(), downloadComprovatioRequest(), enviarComprovatioRequest(), exportarMeuExtratoExcelRequest(), getMeuExtratoPedidoRequest(), getMeuPedidoByIdRequest(), getMeusComprovatioRequest(), getMinhasNotificacoesRequest() (+9 more)

### Community 15 - "Simulação Controller"
Cohesion: 0.14
Nodes (13): calcular(), calcularPrestacao, listarMinhasSimulacoes(), reclamarSimulacao(), { Simulacao }, simular(), jwt, Simulacao (+5 more)

### Community 16 - "Desembolso Controller"
Cohesion: 0.15
Nodes (16): createDesembolso(), creditoService, { Desembolso, PedidoCredito, User, ParcelaPagamento }, generateReferencia, getAllDesembolsos(), getDesembolsoByPedido(), {
  podeDesembolsarPedido,
  podeTransitarStatus,
  STATUS_PEDIDO,
}, registrarLogAuditoria (+8 more)

### Community 17 - "Excel Import Export"
Cohesion: 0.20
Nodes (16): excellService, exportarDesembolsos(), exportarMutuarios(), exportarPedidos(), exportarReembolsos(), exportarRelatorioFinanceiro(), importarMutuarios(), importarPedidos() (+8 more)

### Community 18 - "Health Check Middleware"
Cohesion: 0.15
Nodes (14): checkDatabase(), checkSystemHealth(), healthCheck(), logger, os, ping(), { sequelize }, generateRequestId() (+6 more)

### Community 19 - "Pedido Requisito Controller"
Cohesion: 0.16
Nodes (15): adicionarPedidoRequisito(), getRequisitosByPedido(), {
  PedidoCredito,
  RequisitoCredito,
  PedidoRequisito,
  Notificacao,
}, {
  podeValidarRequisito,
  statusPermiteAcao,
}, registrarLogAuditoria, validarRequisitoPedido(), Notificacao, PedidoRequisito (+7 more)

### Community 20 - "Mutuário Controller"
Cohesion: 0.22
Nodes (13): createMutuario(), deleteMutuario(), generateCodigoMutuario, getAllMutuarios(), getMutuarioById(), { Mutuario, User, PedidoCredito }, registrarLogAuditoria, updateMutuario() (+5 more)

### Community 22 - "Requisito Frontend Components"
Cohesion: 0.24
Nodes (13): adicionarPedidoRequisitoRequest(), createRequisitoRequest(), downloadAnexoRequest(), getAllRequisitosRequest(), getAnexosByRequisitoRequest(), getRequisitosByPedidoRequest(), updateRequisitoRequest(), validarRequisitoPedidoRequest() (+5 more)

### Community 23 - "Monitoring and Alerts Backend"
Cohesion: 0.19
Nodes (14): Alerts Controller, Health Check Controller, Monitoring Dashboard Controller, Error Handler Middleware, Performance Metrics Middleware, Request ID Middleware, Backend Monitoring and Debugging Documentation, Alerts Routes (+6 more)

### Community 24 - "Core Credit Models"
Cohesion: 0.25
Nodes (13): Aprovação de Pedido Controller, Desembolso Controller, Reembolso Controller, Aprovação de Pedido Model, Desembolso Model, Log de Auditoria Model, Notificação Model, Pedido de Crédito Model (+5 more)

### Community 25 - "Notificação Controller"
Cohesion: 0.21
Nodes (12): createNotificacao(), deleteNotificacao(), getMinhasNotificacoes(), getNotificacaoById(), marcarComoLida(), marcarTodasComoLidas(), { Notificacao }, authMiddleware (+4 more)

### Community 26 - "Comprovativo Backoffice UI"
Cohesion: 0.23
Nodes (10): decidirAprovacaoRequest(), downloadComprovatioRequest(), getAprovacoesByPedidoRequest(), getComprovatiosByPedidoRequest(), getExtratoPedidoInternoRequest(), getPedidoByIdRequest(), validarComprovatioRequest(), ComprovativoBackofficeSection() (+2 more)

### Community 27 - "Alerta de Prazo Controller"
Cohesion: 0.21
Nodes (11): criarNotificacao(), obterDestinatariosInternos(), { Op }, { PedidoCredito, Notificacao, User, Mutuario }, registrarLogAuditoria, verificarAlertasPrazo(), authMiddleware, authorizeRoles (+3 more)

### Community 28 - "Alerts Controller"
Cohesion: 0.23
Nodes (11): acknowledgeAlert(), alertManager, getActiveAlerts(), getAlertHistory(), getAlertStats(), getThresholds(), logger, setThreshold() (+3 more)

### Community 29 - "Vincular Mutuário Controller"
Cohesion: 0.23
Nodes (11): associarUserMutuario(), getAssociacaoMutuario(), getUsersNaoAssociados(), { Op }, registrarLogAuditoria, removerAssociacaoUserMutuario(), { User, Mutuario }, {
  associarUserMutuario,
  removerAssociacaoUserMutuario,
  getAssociacaoMutuario,
  getUsersNaoAssociados,
} (+3 more)

### Community 30 - "Crédito Service"
Cohesion: 0.21
Nodes (8): atualizarParcelaAposReembolso(), atualizarSaldo(), buscarCreditoComReembolsos(), criarCredito(), generateCodParcela, gerarNumeroContrato(), { Mutuario, User, Credito, PedidoCredito, ParcelaPagamento, Reembolso, Desembolso }, registarReembolso()

### Community 31 - "Database Sync and Logging"
Cohesion: 0.17
Nodes (7): logger, sequelize, fs, LOG_LEVELS, logger, logsDir, path

### Community 32 - "Relatório Controller"
Cohesion: 0.18
Nodes (10): dashboardFinanceiro(), { Op }, {
  PedidoCredito,
  Credito,
  Mutuario,
  ParcelaPagamento,
  Desembolso,
  Reembolso,
}, Credito, ParcelaPagamento, authMiddleware, authorizeRoles, {
  dashboardFinanceiro,
  getResumoGeral,
  getRelatorioPedidos,
  getRelatorioFinanceiroPedidos,
  getRelatorioDesembolsos,
  getRelatorioReembolsos,
} (+2 more)

### Community 33 - "Requisito de Crédito Controller"
Cohesion: 0.24
Nodes (10): createRequisito(), getAllRequisitos(), registrarLogAuditoria, {RequisitoCredito}, updateRequisito(), authMiddleware, authorizeRoles, {
    createRequisito,
    getAllRequisitos,
    updateRequisito,
} (+2 more)

### Community 34 - "Alerta de Pagamento Controller"
Cohesion: 0.18
Nodes (9): criarNotificacaoSemDuplicar(), { Op }, {
  ParcelaPagamento,
  PedidoCredito,
  Mutuario,
  Notificacao,
}, verificarAlertasPagamento(), authMiddleware, authorizeRoles, express, router (+1 more)

### Community 35 - "Log de Auditoria Controller"
Cohesion: 0.24
Nodes (9): getAllLogsAuditoria(), getLogAuditoriaById(), getMeusLogsAuditoria(), { LogAuditoria, User }, authMiddleware, authorizeRoles, express, {
  getAllLogsAuditoria,
  getLogAuditoriaById,
  getMeusLogsAuditoria,
} (+1 more)

### Community 36 - "Monitoring Dashboard Controller"
Cohesion: 0.22
Nodes (9): cacheManager, { getMetricsStats }, getMonitoringDashboard(), logger, { sequelize }, getMetricsStats(), express, { getMonitoringDashboard } (+1 more)

### Community 37 - "Credit System Roles and Rules"
Cohesion: 0.24
Nodes (11): Pedido de Crédito Controller, Auth Middleware, Role Middleware, Aprovação de Pedido Routes, Pedido de Crédito Routes, Regras do Pedido – Status and Permissions Matrix, Approval Flow – Etapas 1–3 and Rejection, Credit Lifecycle – RASCUNHO to ENCERRADO (+3 more)

### Community 38 - "Portal Excel Export Controller"
Cohesion: 0.22
Nodes (9): exportarMeuExtratoPedido(), exportarMeusPedidos(), {
  PedidoCredito,
  Mutuario,
  AprovacaoPedido,
  Desembolso,
  Reembolso,
  User,
}, XLSX, authMiddleware, authorizeRoles, {
  exportarMeusPedidos,
  exportarMeuExtratoPedido,
}, express (+1 more)

### Community 39 - "Performance Metrics Middleware"
Cohesion: 0.20
Nodes (7): alertManager, getMemoryUsage(), logger, metricsStore, os, performanceMetricsMiddleware(), logger

### Community 40 - "Dashboard and Reports UI"
Cohesion: 0.29
Nodes (7): getRelatorioDesembolsosRequest(), getRelatorioFinanceiroPedidosRequest(), getRelatorioPedidosRequest(), getRelatorioReembolsosRequest(), getResumoGeralRequest(), DashboardInterno(), RelatoriosList()

### Community 41 - "Database and Core Models"
Cohesion: 0.20
Nodes (7): { Sequelize }, AprovacaoPedido, { DataTypes }, sequelize, Credito, { DataTypes }, sequelize

### Community 42 - "Extrato Controller"
Cohesion: 0.22
Nodes (8): getExtratoPedido(), {
  PedidoCredito,
  Mutuario,
  User,
  Reembolso,
  Desembolso,
  AprovacaoPedido,
}, AprovacaoPedido, Reembolso, authMiddleware, express, { getExtratoPedido }, router

### Community 43 - "Auth and Crédito Routes"
Cohesion: 0.18
Nodes (8): jwt, authMiddleware, authorizeRoles, {
  buscarCreditosElegiveisReembolso,
  buscarCreditoComReembolsos,
  getAllCreditos,
}, express, router, buscarCreditosElegiveisReembolso(), getAllCreditos()

### Community 46 - "Aprovação Routes"
Cohesion: 0.22
Nodes (8): getAllAprovacoes(), getAprovacoesByPedido(), getMinhasAprovacoes(), authMiddleware, authorizeRoles, express, {
  getAprovacoesByPedido,
  decidirAprovacao,
  getMinhasAprovacoes,
  getAllAprovacoes,
}, router

### Community 47 - "Anexo and Requisito Models"
Cohesion: 0.22
Nodes (7): Anexo, { DataTypes }, PedidoRequisito, sequelize, { DataTypes }, PedidoRequisito, sequelize

### Community 48 - "Auth and User Setup"
Cohesion: 0.40
Nodes (6): Auth Controller, Mutuário Model, User Model, Auth Routes, Generate Código Mutuário Utility, Log Auditoria Utility

### Community 49 - "Query Logger"
Cohesion: 0.47
Nodes (4): extractActionFromSQL(), extractTableFromSQL(), logger, setupContextualQueryLogging()

### Community 50 - "Error Handler Middleware"
Cohesion: 0.50
Nodes (3): errorHandlerMiddleware(), formatError(), logger

### Community 51 - "Crédito Detail UI"
Cohesion: 0.70
Nodes (4): getMeuCreditoRequest(), DetalheCredito(), getChipColor(), getEstadoLabel()

### Community 52 - "Comprovativo Model"
Cohesion: 0.50
Nodes (3): Comprovativo, { DataTypes }, sequelize

### Community 53 - "Desembolso Model"
Cohesion: 0.50
Nodes (3): { DataTypes }, Desembolso, sequelize

### Community 58 - "Log Auditoria Model"
Cohesion: 0.50
Nodes (3): { DataTypes }, LogAuditoria, sequelize

### Community 59 - "Mutuário Model"
Cohesion: 0.50
Nodes (3): { DataTypes }, Mutuario, sequelize

### Community 60 - "Notificação Model"
Cohesion: 0.50
Nodes (3): { DataTypes }, Notificacao, sequelize

### Community 61 - "Parcela Pagamento Model"
Cohesion: 0.50
Nodes (3): { DataTypes }, ParcelaPagamento, sequelize

### Community 62 - "Pedido de Crédito Model"
Cohesion: 0.50
Nodes (3): { DataTypes }, PedidoCredito, sequelize

### Community 63 - "Reembolso Model"
Cohesion: 0.50
Nodes (3): { DataTypes }, Reembolso, sequelize

### Community 64 - "Requisito de Crédito Model"
Cohesion: 0.50
Nodes (3): {DataTypes}, RequisitoCredito, sequelize

### Community 65 - "Simulação Model"
Cohesion: 0.50
Nodes (3): { DataTypes }, sequelize, Simulacao

### Community 66 - "User Model"
Cohesion: 0.50
Nodes (3): { DataTypes }, sequelize, User

### Community 67 - "Crédito Module Stubs"
Cohesion: 0.67
Nodes (3): Crédito Controller (empty), Crédito Routes (empty), Crédito Service (empty)

## Ambiguous Edges - Review These
- `Desembolso Model` → `Reembolso Model`  [AMBIGUOUS]
  PROJECT_CONTEXT.md · relation: shares_data_with

## Knowledge Gaps
- **380 isolated node(s):** `sequelize`, `logger`, `{ Sequelize }`, `{ Op }`, `{
  ParcelaPagamento,
  PedidoCredito,
  Mutuario,
  Notificacao,
}` (+375 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Desembolso Model` and `Reembolso Model`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **Why does `Docker Compose Configuration` connect `Server and Route Setup` to `Auth and Excel Export API`?**
  _High betweenness centrality (0.333) - this node is a cross-community bridge._
- **Why does `axios` connect `Auth and Excel Export API` to `Frontend Dependencies`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Frontend Dependencies` to `Auth and Excel Export API`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `TODO: Implementar mock de login`, `TODO: Implementar validação de erro`, `TODO: Implementar verificação de token` to the rest of the system?**
  _411 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth and Excel Export API` be split into smaller, more focused modules?**
  _Cohesion score 0.06144393241167435 - nodes in this community are weakly interconnected._
- **Should `Attachment and Portal Controller` be split into smaller, more focused modules?**
  _Cohesion score 0.07632850241545894 - nodes in this community are weakly interconnected._