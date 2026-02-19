import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/auth";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";

export default function OlvideContrasena() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError("Ocurrió un error. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg mb-3">
            <span className="text-white text-xl font-bold">F</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FinZen</h1>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Revisa tu correo</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-sm">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
              Introduce tu email y te enviaremos un enlace para restablecerla.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                Volver al inicio de sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
