# 007 — Login y registro con Google (OAuth 2.0)

**Estado:** pendiente
**Complejidad:** alta
**DB:** requiere migración 008
**Dependencias:** ninguna (standalone)

---

## Compatibilidad con el despliegue actual

- **Vercel** ✅ — agregar `VITE_GOOGLE_CLIENT_ID` en Environment Variables del proyecto
- **Render** ✅ — agregar `GOOGLE_CLIENT_ID` en Environment Variables del servicio
- **Neon** ✅ — migración 008 agrega `google_id` nullable a `users`
- **CORS** ✅ — el flujo usa el backend existente, no requiere cambios de CORS

---

## Flujo de seguridad (crítico)

**El id_token de Google NUNCA se acepta como válido solo porque existe.**

Flujo correcto:
1. Frontend: usuario hace clic en "Continuar con Google" → Google devuelve un `credential` (id_token JWT)
2. Frontend: envía el `credential` al backend en `POST /auth/google`
3. Backend: verifica el `credential` contra los servidores de Google usando `google-auth` library
4. Backend: si es válido, extrae email + google_id + name del payload verificado
5. Backend: busca o crea el usuario, devuelve JWT de FinZen

**Por qué esto es crítico**: si el backend no verifica con Google, un atacante puede forjar cualquier id_token y autenticarse como cualquier usuario.

---

## Edge cases a manejar

| Caso | Comportamiento |
|------|---------------|
| Email nuevo, primer login con Google | Crear usuario, omitir verificación de email (`email_verified=True`), hacer onboarding |
| Email ya registrado con contraseña | Vincular `google_id` a la cuenta existente y hacer login |
| Email ya registrado con Google, vuelve a entrar | Login normal |
| Usuario de Google intenta login con contraseña | Error claro: "Esta cuenta usa Google para iniciar sesión" |

---

## Cambios en backend

### Migración 008

```python
def upgrade():
    op.add_column("users", sa.Column("google_id", sa.String, nullable=True, unique=True))
```

### Dependencia nueva en `requirements.txt`

```
google-auth==2.x.x
```

### Variable de entorno nueva en Render

```
GOOGLE_CLIENT_ID = <tu client id de Google Cloud Console>
```

Agregar a `backend/app/config.py`:
```python
google_client_id: str = ""
```

### Endpoint nuevo `POST /auth/google`

En `backend/app/routers/auth.py`:

```python
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

@router.post("/google", response_model=Token)
def google_login(request: Request, data: dict, db: Session = Depends(get_db)):
    credential = data.get("credential")
    if not credential:
        raise HTTPException(status_code=400, detail="Token de Google requerido")

    # 1. Verificar con Google
    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Token de Google inválido")

    google_id = idinfo["sub"]
    email = idinfo["email"]
    name = idinfo.get("name", email.split("@")[0])

    # 2. Buscar usuario por google_id o email
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            # vincular cuenta existente
            user.google_id = google_id
            user.email_verified = True
        else:
            # crear nuevo usuario
            user = User(
                email=email,
                name=name,
                password_hash="",  # sin contraseña
                email_verified=True,
                google_id=google_id,
            )
            db.add(user)
            db.flush()
            seed_categories(db, user.id)
        db.commit()
        db.refresh(user)

    token = create_token(user.id)
    log_action(db, "google_login", user_id=user.id, ip=request.client.host)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))
```

### Modelo `User`

Agregar campo:
```python
google_id: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
```

---

## Cambios en frontend

### Dependencia nueva

```bash
npm install @react-oauth/google
```

### `frontend/src/main.jsx` (o App.jsx)

Envolver la app con el provider de Google:
```jsx
import { GoogleOAuthProvider } from "@react-oauth/google";

<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <App />
</GoogleOAuthProvider>
```

### Variable de entorno en Vercel

```
VITE_GOOGLE_CLIENT_ID = <tu client id>
```

### `frontend/src/api/auth.js`

```js
googleLogin: (credential) =>
  api.post("/auth/google", { credential }).then((r) => r.data),
```

### `frontend/src/pages/Login.jsx` y `Register.jsx`

Agregar botón de Google justo antes del formulario:
```jsx
import { GoogleLogin } from "@react-oauth/google";

// En el JSX:
<GoogleLogin
  onSuccess={async ({ credential }) => {
    const data = await authApi.googleLogin(credential);
    login(data.access_token, data.user);
    navigate(data.user.onboarding_done ? "/" : "/onboarding");
  }}
  onError={() => setError("Error al iniciar sesión con Google")}
  width="100%"
  text="continue_with"
/>

<div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="px-2 bg-white dark:bg-gray-900 text-gray-400">o</span>
  </div>
</div>
```

---

## Configuración en Google Cloud Console

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear proyecto "FinZen" (o usar uno existente)
3. Habilitar "Google+ API" o "People API"
4. Crear credenciales → OAuth 2.0 Client ID → Web application
5. Agregar en "Authorized JavaScript origins":
   - `http://localhost:3000`
   - `https://<tu-dominio-vercel>.vercel.app`
6. No se necesitan "Authorized redirect URIs" para el flujo de token directo

## Archivos a modificar

- `backend/alembic/versions/008_users_google_id.py` (nuevo)
- `backend/app/models/user.py`
- `backend/app/routers/auth.py`
- `backend/app/config.py`
- `backend/requirements.txt`
- `frontend/src/main.jsx`
- `frontend/src/api/auth.js`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`

## Criterios de aceptación

- [ ] Botón "Continuar con Google" visible en login y registro
- [ ] El id_token se verifica en el backend (nunca solo en frontend)
- [ ] Email nuevo → crea cuenta + onboarding
- [ ] Email existente → vincula y hace login
- [ ] Usuario sin contraseña (solo Google) puede entrar sin contraseña
- [ ] Error claro si el token de Google es inválido

## Notas

- Correr migración 008 en Neon después del deploy
- El campo `password_hash = ""` para usuarios de Google es intencional — `verify_password("", "")` devuelve False, así no pueden hacer login con contraseña vacía
- Agregar `GOOGLE_CLIENT_ID` a las variables de entorno de Render antes de desplegar
- Si el usuario de Google quiere agregar contraseña después: endpoint `POST /auth/add-password` (fuera del scope de este spec)
