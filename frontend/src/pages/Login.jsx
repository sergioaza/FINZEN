import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { LogoIcon } from "../components/Logo";

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 relative overflow-hidden flex-col items-center justify-center p-12">
      {/* Background orbs */}
      <div className="absolute top-20 left-16 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl" />
      <div className="absolute bottom-24 right-12 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-indigo-400/10 rounded-full blur-2xl" />

      {/* Logo */}
      <div className="relative z-10 text-center mb-10 flex flex-col items-center">
        <LogoIcon className="w-20 h-20 mb-4 drop-shadow-2xl" />
        <h1 className="text-4xl tracking-tight text-white font-light">
          Fin<span className="font-bold text-indigo-300">Zen</span>
        </h1>
        <p className="text-indigo-200/80 text-base mt-2">Tus finanzas, bajo control total</p>
      </div>

      {/* Floating mock cards */}
      <div className="relative z-10 w-full max-w-xs space-y-3">
        {/* Balance card */}
        <div className="animate-float bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 shadow-2xl">
          <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">Saldo total</p>
          <p className="text-white text-3xl font-bold tracking-tight">€4,280.50</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-emerald-400 text-sm font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
              +12.4%
            </span>
            <span className="text-indigo-300/70 text-xs">vs mes anterior</span>
          </div>
        </div>

        {/* Two mini cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="animate-float-delayed bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15">
            <p className="text-indigo-300/80 text-xs font-medium mb-1">Gastos feb.</p>
            <p className="text-white text-xl font-bold">€820</p>
            <div className="w-full bg-white/15 rounded-full h-1.5 mt-2.5">
              <div className="bg-rose-400 h-1.5 rounded-full" style={{ width: "65%" }} />
            </div>
          </div>
          <div className="animate-float-delayed bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15">
            <p className="text-indigo-300/80 text-xs font-medium mb-1">Ahorros</p>
            <p className="text-white text-xl font-bold">€1,200</p>
            <div className="w-full bg-white/15 rounded-full h-1.5 mt-2.5">
              <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: "80%" }} />
            </div>
          </div>
        </div>

        {/* Recent transaction */}
        <div className="animate-float-slow bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-400/20 border border-rose-400/30 rounded-lg flex items-center justify-center shrink-0 text-base">
            🛒
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">Supermercado</p>
            <p className="text-indigo-300/70 text-xs">Hoy · 14:32</p>
          </div>
          <p className="text-rose-400 text-sm font-bold shrink-0">-€47.20</p>
        </div>
      </div>

      {/* Bottom tagline */}
      <p className="relative z-10 mt-12 text-indigo-300/50 text-xs text-center">
        Control financiero inteligente y sencillo
      </p>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slowWarning, setSlowWarning] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setLoading(true);
    const timer = setTimeout(() => setSlowWarning(true), 3000);
    try {
      const data = await authApi.login(form);
      login(data.access_token, data.user);
      navigate(data.user.onboarding_done ? "/" : "/onboarding");
    } catch (err) {
      if (err.response?.status === 403) {
        setUnverified(true);
      } else {
        setError(err.response?.data?.detail || "Error al iniciar sesión");
      }
    } finally {
      clearTimeout(timer);
      setSlowWarning(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      {/* Right panel — form */}
      <div className="flex flex-1 lg:max-w-md xl:max-w-lg items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <LogoIcon className="w-14 h-14 mb-3" />
            <h1 className="text-2xl tracking-tight text-gray-900 dark:text-white font-light">
              Fin<span className="font-bold text-indigo-600 dark:text-indigo-400">Zen</span>
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Bienvenido de nuevo</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Ingresa tus datos para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tu@email.com"
              required
            />
            <Input
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
            <div className="flex justify-end">
              <Link
                to="/olvide-contrasena"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
            {unverified && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
                Debes verificar tu email antes de iniciar sesión.{" "}
                <Link
                  to={`/verificar-email?email=${encodeURIComponent(form.email)}`}
                  className="underline font-semibold"
                >
                  Reenviar verificación
                </Link>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : "Iniciar sesión"}
            </Button>
            {slowWarning && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center animate-pulse">
                Conectando con el servidor, un momento...
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
