# FinZen — Guía del Proyecto

App de finanzas personales en español. Stack: React 18 + Vite + Tailwind (frontend), FastAPI + SQLAlchemy 2.0 + Alembic (backend), PostgreSQL 15, Docker Compose.

---

## Arquitectura actual (local)

```
Docker Compose
├── finzen-frontend  → nginx:alpine sirviendo React compilado  (host:3000 → container:80)
├── finzen-backend   → python:3.11-slim + uvicorn              (host:8000 → container:8000)
│     └── volumen mount: ./backend:/app  (hot-reload activo)
└── finzen-db        → postgres:15-alpine                      (host:5432 → container:5432)
      └── volumen: postgres_data (persistente entre reinicios)
```

### Puertos y URLs locales
| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 (usuario: finzen, db: finzen_db) |

### Comandos básicos
```bash
# Levantar todo
docker compose up -d

# Levantar y reconstruir imágenes (tras cambios en Dockerfile o requirements)
docker compose up --build

# Reconstruir solo el frontend (tras cambios en .jsx o .css)
docker compose up -d --build frontend

# Ver logs en tiempo real
docker compose logs -f backend
docker compose logs -f frontend

# Apagar (conserva datos)
docker compose down

# Apagar y BORRAR datos (volúmenes)
docker compose down -v
```

---

## Estructura de archivos clave

```
FinZen/
├── CLAUDE.md                        ← este archivo
├── docker-compose.yml
├── .env                             ← no commiteado (ver .env.example)
├── .env.example
├── backend/
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/versions/001_initial.py   ← migración única con todas las tablas
│   └── app/
│       ├── main.py                  ← FastAPI app + CORS + 8 routers
│       ├── config.py                ← Pydantic Settings (lee .env / env vars)
│       ├── database.py              ← SQLAlchemy engine + SessionLocal
│       ├── deps.py                  ← get_db(), get_current_user()
│       ├── models/                  ← user, account, category, transaction,
│       │                               budget, recurring, debt
│       ├── schemas/                 ← Pydantic schemas (mirrors de modelos)
│       ├── routers/                 ← auth, accounts, categories, transactions,
│       │                               budgets, recurring, debts, dashboard
│       └── utils/
│           ├── auth.py              ← bcrypt directo + JWT (python-jose)
│           └── seed.py              ← 17 categorías en español al registrarse
└── frontend/
    ├── nginx.conf                   ← SPA routing + proxy /api/ → backend
    └── src/
        ├── api/                     ← axios.js (interceptor JWT) + módulos
        ├── context/AuthContext.jsx  ← JWT + user state + onboarding_done
        ├── components/
        │   ├── Layout/              ← Sidebar.jsx + Topbar.jsx (dark mode)
        │   └── common/              ← Button, Input, Modal, Badge
        └── pages/                   ← Login, Register, Onboarding, Dashboard,
                                        Transacciones, Estadisticas, Presupuesto,
                                        Recurrentes, Deudas, Cuentas
```

---

## Base de datos — tablas

| Tabla | Campos destacados |
|-------|------------------|
| `users` | id, email, password_hash, name, onboarding_done |
| `accounts` | id, user_id, name, type(debit/credit), account_subtype, balance, color |
| `categories` | id, user_id, name, type(income/expense), is_default |
| `transactions` | id, user_id, account_id, category_id, type, amount, date, transfer_pair_id |
| `budgets` | id, user_id, category_id, month, year, limit_amount |
| `recurring_expenses` | id, user_id, account_id, category_id, name, amount, frequency, next_date, is_active |
| `recurring_payments` | id, recurring_expense_id, paid_date, amount |
| `debts` | id, user_id, counterpart_name, original_amount, remaining_amount, type, status |
| `debt_payments` | id, debt_id, amount, date, notes |

**Lógica de saldos:**
- Cuenta débito + gasto → `balance -= amount`
- Cuenta débito + ingreso → `balance += amount`
- Cuenta crédito + gasto → `balance += amount` (deuda sube)
- Cuenta crédito + ingreso/pago → `balance -= amount` (deuda baja)

**Transferencia entre cuentas:** crea 2 transacciones enlazadas por `transfer_pair_id`.

---

## Lecciones aprendidas — bugs conocidos

1. **Pydantic + campo nombrado igual que su tipo** (`date: date | None`): Pydantic pasa el dict de clase como `localns` al evaluar anotaciones, lo que hace que `date` resuelva al valor del campo (`None`) en vez del tipo. Fix: renombrar el import → `from datetime import date as DateType`.

2. **passlib 1.7.4 incompatible con bcrypt ≥ 4.2**: `detect_wrap_bug()` envía password >72 bytes, bcrypt ahora lanza `ValueError`. Fix: usar `bcrypt` directamente sin passlib.

3. **JWT `sub` debe ser string**: `python-jose` lanza `JWTClaimsError` si `sub` es entero. Fix: `str(user_id)` al crear, `int(sub)` al decodificar.

4. **`pg_isready` sin `-d`**: usa el username como nombre de DB por defecto → logs FATAL. Fix: agregar `-d ${POSTGRES_DB:-finzen_db}`.

---

## Despliegue en producción — checklist completo

### Opción recomendada: VPS + Docker Compose (igual que local)

**Proveedor recomendado:** Hetzner CPX11 (~4€/mes) — 2 vCPU, 2GB RAM, suficiente para uso personal o pequeño equipo.

### Paso a paso

```bash
# 1. En el servidor: instalar Docker
curl -fsSL https://get.docker.com | sh

# 2. Subir el código
git clone <tu-repo> /opt/finzen
# o: rsync -avz ./ usuario@servidor:/opt/finzen/

# 3. Configurar variables de entorno
cd /opt/finzen
cp .env.example .env
nano .env   # ← cambiar valores (ver sección siguiente)

# 4. Levantar
docker compose up -d --build

# 5. SSL con Let's Encrypt
apt install certbot python3-certbot-nginx
certbot --nginx -d tudominio.com
```

### Variables .env para producción

```env
POSTGRES_USER=finzen
POSTGRES_PASSWORD=<contraseña fuerte, 32+ caracteres>
POSTGRES_DB=finzen_db

DATABASE_URL=postgresql://finzen:<password>@db:5432/finzen_db

# Generar con: python3 -c "import secrets; print(secrets.token_hex(64))"
SECRET_KEY=<clave aleatoria de 64+ caracteres>

CORS_ORIGINS=https://tudominio.com
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### Modificaciones necesarias en docker-compose para producción

```yaml
# Quitar exposición de puertos de la DB (no debe ser accesible desde fuera)
db:
  # ports:           ← COMENTAR O ELIMINAR ESTO
  #   - "5432:5432"

# El backend tampoco necesita exponerse si nginx hace proxy
backend:
  # ports:           ← opcional, comentar si nginx hace proxy interno
  #   - "8000:8000"
```

---

## Seguridad — estado actual vs producción

| Aspecto | Estado actual | Para producción |
|---------|--------------|-----------------|
| Contraseñas | bcrypt ✓ | OK |
| JWT | HS256, 7 días ✓ | Considerar reducir a 1 día + refresh token |
| HTTPS | No (local) | **Obligatorio** — Let's Encrypt (gratis) |
| CORS | Configurado ✓ | Cambiar a dominio real |
| DB expuesta | Sí (puerto 5432) | **Quitar** el `ports:` de la DB |
| SECRET_KEY | Débil | **Cambiar** por clave aleatoria |
| Rate limiting | No | Agregar en `/auth/login` (slowapi) |
| Verificación email | No | Recomendado agregar |
| Recuperación contraseña | No | Recomendado agregar |
| Backups DB | No | **Obligatorio** (ver abajo) |

---

## Backups de base de datos

```bash
# Backup manual
docker compose exec db pg_dump -U finzen finzen_db > backup_$(date +%Y%m%d).sql

# Restaurar
cat backup_20260218.sql | docker compose exec -T db psql -U finzen finzen_db

# Backup automático diario con cron (agregar en el servidor)
# crontab -e
0 3 * * * cd /opt/finzen && docker compose exec -T db pg_dump -U finzen finzen_db > /backups/finzen_$(date +\%Y\%m\%d).sql

# Subir backup a Backblaze B2 o S3 (instalar rclone)
rclone copy /backups/ b2:mi-bucket/finzen-backups/
```

---

## Lo que falta para producción completa

### Alta prioridad
- [ ] **Verificación de email al registrarse** — sin esto cualquiera usa emails falsos
- [ ] **Recuperación de contraseña** — actualmente no existe forma de recuperarla
- [ ] **Rate limiting en login** — previene fuerza bruta (librería: `slowapi`)

### Servicio de email recomendado
**Resend** (resend.com) — más fácil de integrar con FastAPI, 3.000 emails/mes gratis.

```python
# requirements.txt: agregar resend==2.x
import resend
resend.api_key = settings.resend_api_key

resend.Emails.send({
    "from": "noreply@tudominio.com",
    "to": user.email,
    "subject": "Verifica tu cuenta en FinZen",
    "html": "<p>Haz clic aquí para verificar: <a href='...'>Verificar</a></p>",
})
```

### Opciones de DB gestionada (alternativa a auto-gestionar backups)
| Servicio | Gratis hasta | Notas |
|----------|-------------|-------|
| Neon.tech | 0.5 GB | PostgreSQL serverless, backups automáticos |
| Supabase | 500 MB | PostgreSQL managed + dashboard visual |
| Railway | 1 GB | Muy fácil de usar |

Con cualquiera de estos, solo cambias `DATABASE_URL` en el `.env` y eliminas el servicio `db:` del `docker-compose.yml`.

---

## Monitoreo básico (gratuito)

- **Uptime Robot** (uptimerobot.com) — monitorea que el servidor responda, alerta por email si cae. Gratis para 50 monitores.
- **Logs**: `docker compose logs -f` o configurar un agregador como Loki + Grafana.
