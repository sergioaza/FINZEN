import logging
from app.config import settings

logger = logging.getLogger(__name__)


def send_verification_email(email: str, token: str) -> None:
    url = f"{settings.frontend_url}/confirmar-email?token={token}"
    if not settings.resend_api_key:
        print(f"[DEV] Verification link for {email}: {url}", flush=True)
        return
    try:
        import resend
        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": "FinZen <noreply@resend.dev>",
            "to": email,
            "subject": "Verifica tu cuenta en FinZen",
            "html": f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
              <h2 style="color:#4f46e5;margin-bottom:8px;">Bienvenido a FinZen</h2>
              <p style="color:#374151;">Haz clic en el botón para verificar tu dirección de email:</p>
              <a href="{url}" style="display:inline-block;margin:20px 0;padding:12px 24px;
                 background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
                Verificar mi email
              </a>
              <p style="color:#6b7280;font-size:13px;">
                Si no creaste esta cuenta, ignora este mensaje.<br>
                El enlace expira en 24 horas.
              </p>
            </div>
            """,
        })
    except Exception as e:
        logger.error(f"Error sending verification email to {email}: {e}")
        raise


def send_reset_email(email: str, token: str) -> None:
    url = f"{settings.frontend_url}/restablecer-contrasena?token={token}"
    if not settings.resend_api_key:
        print(f"[DEV] Password reset link for {email}: {url}", flush=True)
        return
    try:
        import resend
        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": "FinZen <noreply@resend.dev>",
            "to": email,
            "subject": "Restablece tu contraseña en FinZen",
            "html": f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
              <h2 style="color:#4f46e5;margin-bottom:8px;">Restablecer contraseña</h2>
              <p style="color:#374151;">Recibimos una solicitud para restablecer tu contraseña.</p>
              <a href="{url}" style="display:inline-block;margin:20px 0;padding:12px 24px;
                 background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
                Restablecer contraseña
              </a>
              <p style="color:#6b7280;font-size:13px;">
                Si no solicitaste esto, ignora este mensaje.<br>
                El enlace expira en 1 hora.
              </p>
            </div>
            """,
        })
    except Exception as e:
        logger.error(f"Error sending reset email to {email}: {e}")
        raise
