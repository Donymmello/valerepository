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
              <DashboardMutuario />
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/meu-mutuario"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <MeuMutuario />
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/meus-pedidos"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <MeusPedidos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/criar-pedido"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <CriarPedido />
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/meus-pedidos/:id"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <DetalhePedido />
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal/meus-pedidos/:id/extrato"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <ExtratoPedido />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interno"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "GESTOR", "ANALISTA", "DIRETOR"]}>
              <DashboardInterno />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}