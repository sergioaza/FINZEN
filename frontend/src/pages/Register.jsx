import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import { Input, Select } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { LANGUAGES, COUNTRIES, CURRENCIES, COUNTRY_CURRENCY_MAP, COUNTRY_LOCALE_MAP } from "../utils/locale";

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 relative overflow-hidden flex-col items-center justify-center p-12">
      {/* Background orbs */}
      <div className="absolute top-20 left-16 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl" />
      <div className="absolute bottom-24 right-12 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-indigo-400/10 rounded-full blur-2xl" />

      {/* Logo */}
      <div className="relative z-10 text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-400 to-violet-400 rounded-2xl mb-5 shadow-2xl shadow-indigo-900/50">
          <span className="text-white text-3xl font-bold">F</span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">FinZen</h1>
        <p className="text-indigo-200/80 text-base mt-2">Empieza gratis, sin tarjeta requerida</p>
      </div>

      {/* Feature list */}
      <div className="relative z-10 w-full max-w-xs space-y-3">
        {[
          { icon: "💳", title: "Múltiples cuentas", desc: "Débito, crédito y efectivo en un lugar" },
          { icon: "📊", title: "Estadísticas visuales", desc: "Entiende en qué gastas tu dinero" },
          { icon: "🎯", title: "Presupuestos", desc: "Fija límites y mantén el control" },
          { icon: "🔄", title: "Gastos recurrentes", desc: "Nunca olvides suscripciones o pagos" },
        ].map((f, i) => (
          <div
            key={f.title}
            className="animate-float bg-white/10 backdrop-blur-md rounded-xl px-4 py-3.5 border border-white/15 flex items-center gap-3"
            style={{ animationDelay: `${i * 0.6}s`, animationDuration: `${5 + i * 0.5}s` }}
          >
            <span className="text-xl shrink-0">{f.icon}</span>
            <div>
              <p className="text-white text-sm font-semibold">{f.title}</p>
              <p className="text-indigo-300/70 text-xs">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="relative z-10 mt-10 text-indigo-300/50 text-xs text-center">
        Únete a quienes ya controlan sus finanzas
      </p>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ name: "", email: "", password: "", locale: "es", country: "", currency: "COP" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slowWarning, setSlowWarning] = useState(false);

  const handleCountryChange = (country) => {
    const currency = COUNTRY_CURRENCY_MAP[country] || form.currency;
    const locale = COUNTRY_LOCALE_MAP[country] || form.locale;
    setForm({ ...form, country, currency, locale });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => setSlowWarning(true), 3000);
    try {
      await authApi.register({ ...form, country: form.country || null });
      // Intentar login automático tras registro
      try {
        const loginData = await authApi.login({ email: form.email, password: form.password });
        login(loginData.access_token, loginData.user);
        navigate("/");
      } catch (loginErr) {
        // 403 = email no verificado
        if (loginErr.response?.status === 403) {
          navigate("/verificar-email", { state: { email: form.email } });
        } else {
          navigate("/login");
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Error al registrarse");
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
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg mb-3">
              <span className="text-white text-xl font-bold">F</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FinZen</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Crea tu cuenta</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Gratis, sin compromisos</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre completo"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tu nombre"
              required
            />
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
              placeholder="Mínimo 6 caracteres"
              required
            />
            <Select
              label="Idioma"
              value={form.locale}
              onChange={(e) => setForm({ ...form, locale: e.target.value })}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </Select>
            <Select
              label="País (opcional)"
              value={form.country}
              onChange={(e) => handleCountryChange(e.target.value)}
            >
              <option value="">— Selecciona un país —</option>
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
            <Select
              label="Moneda"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : "Crear cuenta gratis"}
            </Button>
            {slowWarning && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center animate-pulse">
                Conectando con el servidor, un momento...
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
