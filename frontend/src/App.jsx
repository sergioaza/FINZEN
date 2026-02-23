import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { Sidebar } from "./components/Layout/Sidebar";
import { Topbar } from "./components/Layout/Topbar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import VerificarEmail from "./pages/VerificarEmail";
import ConfirmarEmail from "./pages/ConfirmarEmail";
import OlvideContrasena from "./pages/OlvideContrasena";
import RestablecerContrasena from "./pages/RestablecerContrasena";
import Dashboard from "./pages/Dashboard";
import Transacciones from "./pages/Transacciones";
import Estadisticas from "./pages/Estadisticas";
import Presupuesto from "./pages/Presupuesto";
import Recurrentes from "./pages/Recurrentes";
import Deudas from "./pages/Deudas";
import Cuentas from "./pages/Cuentas";
import MetasAhorro from "./pages/MetasAhorro";
import Perfil from "./pages/Perfil";

const PAGE_TITLE_KEYS = {
  "/": "nav.dashboard",
  "/transacciones": "nav.transactions",
  "/estadisticas": "nav.statistics",
  "/presupuesto": "nav.budgets",
  "/recurrentes": "nav.recurring",
  "/deudas": "nav.debts",
  "/cuentas": "nav.accounts",
  "/metas-ahorro": "nav.goals",
  "/perfil": "nav.profile",
};

function PrivateRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboarding_done) return <Navigate to="/onboarding" replace />;
  return <AppLayout />;
}

function AppLayout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const titleKey = PAGE_TITLE_KEYS[location.pathname];
  const title = titleKey ? t(titleKey) : "FinZen";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function OnboardingRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboarding_done) return <Navigate to="/" replace />;
  return <Onboarding />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route path="/verificar-email" element={<VerificarEmail />} />
          <Route path="/confirmar-email" element={<ConfirmarEmail />} />
          <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
          <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transacciones" element={<Transacciones />} />
            <Route path="/estadisticas" element={<Estadisticas />} />
            <Route path="/presupuesto" element={<Presupuesto />} />
            <Route path="/recurrentes" element={<Recurrentes />} />
            <Route path="/deudas" element={<Deudas />} />
            <Route path="/cuentas" element={<Cuentas />} />
            <Route path="/metas-ahorro" element={<MetasAhorro />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
