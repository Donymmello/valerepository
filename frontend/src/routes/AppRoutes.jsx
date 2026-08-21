import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import ProtectedRoute from "../components/ProtectedRoute";
import PortalLayout from "../components/layout/PortalLayout";
import BackofficeLayout from "../components/layout/BackofficeLayout";

// Páginas carregadas sob demanda (code-splitting): cada rota só baixa o
// seu próprio chunk quando é visitada, em vez de tudo entrar no bundle
// inicial (portal + backoffice + superadmin de uma vez).
const Login = lazy(() => import("../pages/auth/Login"));
const RegisterMutuario = lazy(() => import("../pages/auth/RegisterMutuario"));
const VerifyOTP = lazy(() => import("../pages/auth/VerifyOTP"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));
const RegisterUser = lazy(() => import("../pages/auth/RegisterUser"));
const ConvitesPortal = lazy(() => import("../pages/auth/ConvitesPortal"));
const LandingPage = lazy(() => import("../pages/public/LandingPage"));

const DashboardMutuario = lazy(() => import("../pages/portal/DashboardMutuario"));
const MeuMutuario = lazy(() => import("../pages/portal/MeuMutuario"));
const MeuMutuarioEditar = lazy(() => import("../pages/portal/MeuMutuarioEditar"));
const MeusPedidos = lazy(() => import("../pages/portal/MeusPedidos"));
const CriarPedido = lazy(() => import("../pages/portal/CriarPedido"));
const DetalhePedido = lazy(() => import("../pages/portal/DetalhePedido"));
const ExtratoPedido = lazy(() => import("../pages/portal/ExtratoPedido"));
const MeusCreditos = lazy(() => import("../pages/portal/MeusCreditos"));
const DetalheCredito = lazy(() => import("../pages/portal/DetalheCredito"));
const EfetuarPagamento = lazy(() => import("../pages/portal/EfetuarPagamento"));
const Notificacoes = lazy(() => import("../pages/portal/Notificacoes"));

const DashboardInterno = lazy(() => import("../pages/admin/DashboardInterno"));
const PedidosList = lazy(() => import("../pages/admin/pedidos/PedidosList"));
const PedidoDetalhe = lazy(() => import("../pages/admin/pedidos/PedidoDetalhe"));
const MutuariosList = lazy(() => import("../pages/admin/mutuarios/MutuariosList"));
const MutuarioDetalhe = lazy(() => import("../pages/admin/mutuarios/MutuarioDetalhe"));
const CreditoDetalhe = lazy(() => import("../pages/admin/creditos/CreditoDetalhe"));
const AprovacoesList = lazy(() => import("../pages/admin/aprovacoes/AprovacoesList"));
const DesembolsosList = lazy(() => import("../pages/admin/desembolsos/DesembolsosList"));
const ReembolsosList = lazy(() => import("../pages/admin/reembolsos/ReembolsosList"));
const RelatoriosList = lazy(() => import("../pages/admin/relatorios/RelatoriosList"));
const RequisitosCreditoList = lazy(() => import("../pages/admin/requisitos/RequisitosCreditoList"));
const MinhasNotificacoes = lazy(() => import("../pages/admin/notificacoes/MinhasNotificacoes"));
const LogsAuditoriaList = lazy(() => import("../pages/admin/auditoria/LogsAuditoriaList"));
const ExtratoPedidoInterno = lazy(() => import("../pages/admin/pedidos/ExtratoPedidoInterno"));
const ExcelImportExport = lazy(() => import("../pages/admin/excel/ExcelImportExport"));
const AlertasPrazo = lazy(() => import("../pages/admin/alertas/AlertasPrazo"));
const EmpresaConfiguracoes = lazy(() => import("../pages/admin/empresa/EmpresaConfiguracoes"));

const EmpresasList = lazy(() => import("../pages/superadmin/EmpresasList"));
const SolicitacoesAcessoList = lazy(() => import("../pages/superadmin/SolicitacoesAcessoList"));

const SUPERADMIN_LINKS = [
  { label: "Empresas", to: "/superadmin/empresas" },
  { label: "Pedidos de Acesso", to: "/superadmin/solicitacoes-acesso" },
];

function SuspenseFallback() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/landing-page" replace />} />

          <Route path="/landing-page" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-mutuario" element={<RegisterMutuario />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/portal"
            element={
              <ProtectedRoute allowedRoles={["MUTUARIO", "USER"]}>
                <PortalLayout>
                  <DashboardMutuario />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/meu-mutuario"
            element={
              <ProtectedRoute allowedRoles={["MUTUARIO", "USER"]}>
                <PortalLayout>
                  <MeuMutuario />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/editar-perfil"
            element={
              <ProtectedRoute allowedRoles={["MUTUARIO", "USER"]}>
                <PortalLayout>
                  <MeuMutuarioEditar />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/meus-pedidos"
            element={
              <ProtectedRoute allowedRoles={["MUTUARIO", "USER"]}>
                <PortalLayout>
                  <MeusPedidos />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/criar-pedido"
            element={
              <ProtectedRoute allowedRoles={["MUTUARIO", "USER"]}>
                <PortalLayout>
                  <CriarPedido />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/meus-creditos"
            element={
              <ProtectedRoute allowedRoles={["MUTUARIO", "USER"]}>
                <PortalLayout>
                  <MeusCreditos />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/meus-creditos/:id"
            element={
              <ProtectedRoute allowedRoles={["MUTUARIO", "USER"]}>
                <PortalLayout>
                  <DetalheCredito />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/meus-creditos/:creditoId/pagamento"
            element={
              <ProtectedRoute allowedRoles={["MUTUARIO", "USER"]}>
                <PortalLayout>
                  <EfetuarPagamento />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/meus-pedidos/:id"
            element={
              <ProtectedRoute allowedRoles={["MUTUARIO", "USER"]}>
                <PortalLayout>
                  <DetalhePedido />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/meus-pedidos/:id/extrato"
            element={
              <ProtectedRoute allowedRoles={["MUTUARIO", "USER"]}>
                <PortalLayout>
                  <ExtratoPedido />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/notificacoes"
            element={
              <ProtectedRoute allowedRoles={["MUTUARIO", "USER"]}>
                <PortalLayout>
                  <Notificacoes />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <DashboardInterno />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/register-interno"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <BackofficeLayout>
                  <RegisterUser />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/convites-portal"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR"]}>
                <BackofficeLayout>
                  <ConvitesPortal />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/pedidos"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <PedidosList />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/pedidos/:id"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <PedidoDetalhe />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/mutuarios"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <MutuariosList />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/mutuarios/:id"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <MutuarioDetalhe />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/creditos/:id"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <CreditoDetalhe />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/aprovacoes"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <AprovacoesList />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/desembolsos"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <DesembolsosList />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/reembolsos"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <ReembolsosList />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/relatorios"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <RelatoriosList />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/requisitos-credito"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <RequisitosCreditoList />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/notificacoes"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <MinhasNotificacoes />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/logs-auditoria"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <LogsAuditoriaList />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/pedidos/:id/extrato"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <ExtratoPedidoInterno />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/excel"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <ExcelImportExport />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/empresa"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR"]}>
                <BackofficeLayout>
                  <EmpresaConfiguracoes />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/interno/alertas-prazo"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
                <BackofficeLayout>
                  <AlertasPrazo />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin"
            element={<Navigate to="/superadmin/empresas" replace />}
          />

          <Route
            path="/superadmin/empresas"
            element={
              <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
                <BackofficeLayout
                  variant="minimal"
                  title="Plataforma"
                  subtitle="Gestão de empresas e subscrições"
                  homePath="/superadmin/empresas"
                  links={SUPERADMIN_LINKS}
                >
                  <EmpresasList />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/solicitacoes-acesso"
            element={
              <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
                <BackofficeLayout
                  variant="minimal"
                  title="Plataforma"
                  subtitle="Gestão de empresas e subscrições"
                  homePath="/superadmin/empresas"
                  links={SUPERADMIN_LINKS}
                >
                  <SolicitacoesAcessoList />
                </BackofficeLayout>
              </ProtectedRoute>
            }
          />

          {/* Qualquer caminho não reconhecido volta para a landing page,
              em vez de ficar em branco sem explicação nenhuma. */}
          <Route path="*" element={<Navigate to="/landing-page" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
