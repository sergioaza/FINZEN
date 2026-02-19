import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";

export default function ConfirmarEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch(() => setStatus("error"));
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="w-full max-w-md text-center">
        {status === "loading" && (
          <>
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-gray-500 dark:text-gray-400">Verificando tu email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email verificado
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Tu cuenta ha sido activada correctamente. Serás redirigido al inicio de sesión en unos segundos.
            </p>
            <Link
              to="/login"
              className="inline-block py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
            >
              Iniciar sesión
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Enlace inválido
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              El enlace de verificación no es válido o ha expirado. Solicita uno nuevo desde la página de verificación.
            </p>
            <Link
              to="/verificar-email"
              className="inline-block py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
            >
              Solicitar nuevo enlace
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
