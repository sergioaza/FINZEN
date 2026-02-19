import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { authApi } from "../api/auth";

export default function VerificarEmail() {
  const location = useLocation();
  const email = location.state?.email || new URLSearchParams(location.search).get("email") || "";
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      await authApi.resendVerification(email);
      setResent(true);
    } catch {
      setError("No se pudo reenviar el correo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Revisa tu bandeja de entrada
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          Te enviamos un enlace de verificación
          {email && (
            <> a <span className="font-semibold text-gray-700 dark:text-gray-300">{email}</span></>
          )}.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mb-8">
          Haz clic en el enlace del correo para activar tu cuenta. Si no lo ves, revisa la carpeta de spam.
        </p>

        {resent ? (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm mb-6">
            Correo reenviado correctamente.
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            {email && (
              <button
                onClick={handleResend}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg font-semibold transition-colors mb-4"
              >
                {loading ? "Reenviando..." : "Reenviar correo de verificación"}
              </button>
            )}
          </>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400">
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
