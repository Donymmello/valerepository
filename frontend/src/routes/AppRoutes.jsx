import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/auth/Login";
import RegisterMutuario from "../pages/auth/RegisterMutuario";
import DashboardMutuario from "../pages/portal/DashboardMutuario";
import MeuMutuario from "../pages/portal/MeuMutuario";
import MeusPedidos from "../pages/portal/MeusPedidos";
import CriarPedido from "../pages/portal/CriarPedido";
import DetalhePedido from "../pages/portal/DetalhePedido";
import ExtratoPedido from "../pages/portal/ExtratoPedido";
import DashboardInterno from "../pages/admin/DashboardInterno";
import PortalLayout from "../components/layout/PortalLayout";
import BackofficeLayout from "../components/layout/BackofficeLayout";
import PedidosList from "../pages/admin/pedidos/PedidosList";
import PedidoDetalhe from "../pages/admin/pedidos/PedidoDetalhe";
import MutuariosList from "../pages/admin/mutuarios/MutuariosList";
import MutuarioDetalhe from "../pages/admin/mutuarios/MutuarioDetalhe";
import AprovacoesList from "../pages/admin/aprovacoes/AprovacoesList";
import DesembolsosList from "../pages/admin/desembolsos/DesembolsosList";
import ReembolsosList from "../pages/admin/reembolsos/ReembolsosList";
import RelatoriosList from "../pages/admin/relatorios/RelatoriosList";
import RequisitosCreditoList from "../pages/admin/requistos/RequisitosCreditoList";
import MinhasNotificacoes from "../pages/admin/notificacoes/MinhasNotificacoes";
import Notificacoes from "../pages/portal/Notifacacoes";
import LogsAuditoriaList from "../pages/admin/logs/LogsAuditoriaList";
import ExtratoPedidoInterno from "../pages/admin/pedidos/ExtratoPedidoInterno";
import ExcelImportExport from "../pages/admin/excel/ExcelImportExport";
import AlertasPrazo from "../pages/admin/alertas/AlertasPrazo";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register-mutuario" element={<RegisterMutuario />} />

        <Route
          path="/portal"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <PortalLayout>
                <DashboardMutuario />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/meu-mutuario"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <PortalLayout>
                <MeuMutuario />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/meus-pedidos"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <PortalLayout>
                <MeusPedidos />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/criar-pedido"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <PortalLayout>
                <CriarPedido />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/meus-pedidos/:id"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <PortalLayout>
                <DetalhePedido />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/meus-pedidos/:id/extrato"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <PortalLayout>
                <ExtratoPedido />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/notificacoes"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
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
          path="/interno/alertas-prazo"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
              <BackofficeLayout>
                <AlertasPrazo />
              </BackofficeLayout>
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}