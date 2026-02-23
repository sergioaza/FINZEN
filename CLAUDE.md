# FinZen — Guía del Proyecto

App de finanzas personales en español. Stack: React 18 + Vite + Tailwind (frontend), FastAPI + SQLAlchemy 2.0 + Alembic (backend), PostgreSQL 15.

---

## Arquitectura de producción (actual)

```
Vercel          → Frontend React (build estático, CDN global)
Render          → Backend FastAPI + uvicorn (Python 3.11)
Neon.tech       → PostgreSQL serverless (backups automáticos)
GitHub          → Repositorio: https://github.com/sergioaza/FINZEN
```

**Flujo de despliegue:**
- `git push origin main` → Vercel y Render redesplegan automáticamente
- Las migraciones de Alembic hay que correrlas manualmente (ver sección Migraciones)

### Variables de entorno en Render (backend)
Configuradas en el dashboard de Render → Environment:
```
DATABASE_URL   = postgresql://neondb_owner:...@neon.tech/neondb?sslmode=require
SECRET_KEY     = <clave aleatoria 64+ chars>
CORS_ORIGINS   = https://<tu-dominio-vercel>.vercel.app
ACCESS_TOKEN_EXPIRE_MINUTES = 10080
RESEND_API_KEY = <opcional — si está vacío, emails se auto-verifican>
FRONTEND_URL   = https://<tu-dominio-vercel>.vercel.app
```

### Variables de entorno en Vercel (frontend)
El frontend es build estático — las variables de entorno solo afectan el build.
La URL del backend se configura en `frontend/src/api/axios.js` (baseURL apunta a Render).

---

## Arquitectura local (desarrollo)

```
Docker Compose
├── finzen-frontend  → nginx:alpine sirviendo React compilado  (host:3000 → container:80)
├── finzen-backend   → python:3.11-slim + uvicorn              (host:8000 → container:8000)
│     └── volumen mount: ./backend:/app  (hot-reload activo)
└── finzen-db        → postgres:15-alpine                      (host:5432 → container:5432)
      └── volumen: postgres_data (persistente entre reinicios)
```

### Comandos locales
```bash
docker compose up -d                        # levantar todo
docker compose up -d --build frontend       # rebuild frontend (cambios .jsx o deps npm)
docker compose up --build                   # rebuild todo (cambios requirements.txt)
docker compose logs -f backend              # ver logs backend
docker compose down                         # apagar (conserva datos)
docker compose down -v                      # apagar y BORRAR datos
```

### Puertos locales
| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 (usuario: finzen, db: finzen_db) |

---

## Migraciones Alembic

### Historial de migraciones
| Revisión | Descripción |
|----------|-------------|
| `001` | Tablas iniciales: users, accounts, categories, transactions, budgets, recurring_expenses, recurring_payments, debts, debt_payments |
| `002` | savings_goals + goal_contributions (modelo original) |
| `003` | Seguridad: email_verified, email_verify_token, reset_token, revoked_tokens, audit_logs |
| `004` | credit_limit en accounts + savings_goals v2 (quota_amount, frequency, WishlistStatus) |
| `005` | locale, country, currency en users |

### Correr migraciones en producción (Neon)

**Opción A — desde local con Docker corriendo:**
```bash
docker compose exec -e DATABASE_URL="postgresql://neondb_owner:<pass>@ep-aged-voice-aicp7f0m-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" backend alembic upgrade head
```

**Opción B — desde local sin Docker (Python instalado):**
```bash
cd backend
DATABASE_URL="postgresql://..." alembic upgrade head
```

**Opción C — desde la Shell de Render** (plan con shell habilitado):
```bash
alembic upgrade head
```

### Verificar versión actual en Neon
```bash
docker compose exec -e DATABASE_URL="postgresql://..." backend alembic current
# debe mostrar: 005 (head)
```

### Correr migraciones en local (DB local)
```bash
docker compose exec backend alembic upgrade head
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
│   ├── alembic/versions/
│   │   ├── 001_initial.py
│   │   ├── 002_savings_goals.py
│   │   ├── 003_security.py
│   │   ├── 004_credit_limit_goals_v2.py
│   │   └── 005_user_locale_currency.py
│   └── app/
│       ├── main.py                  ← FastAPI app + CORS + routers
│       ├── config.py                ← Pydantic Settings (lee .env / env vars)
│       ├── database.py              ← SQLAlchemy engine + SessionLocal
│       ├── deps.py                  ← get_db(), get_current_user()
│       ├── models/                  ← user, account, category, transaction,
│       │                               budget, recurring, debt, savings_goal
│       ├── schemas/                 ← Pydantic schemas (mirrors de modelos)
│       ├── routers/                 ← auth, accounts, categories, transactions,
│       │                               budgets, recurring, debts, dashboard,
│       │                               savings_goals
│       └── utils/
│           ├── auth.py              ← bcrypt directo + JWT (python-jose)
│           ├── seed.py              ← 17 categorías en español al registrarse
│           ├── email.py             ← envío de emails con Resend
│           └── audit.py             ← log de acciones de seguridad
└── frontend/
    ├── nginx.conf                   ← SPA routing + proxy /api/ → backend
    └── src/
        ├── api/                     ← axios.js (interceptor JWT) + módulos
        ├── context/AuthContext.jsx  ← JWT + user state + i18n changeLanguage
        ├── hooks/
        │   ├── useAuth.js
        │   └── useCurrency.js       ← formateo dinámico según moneda del usuario
        ├── i18n/
        │   ├── index.js             ← configuración i18next (recursos inlineados)
        │   └── locales/             ← es.json, en.json, pt.json
        ├── utils/
        │   ├── format.js            ← formatCurrency(amount, currency, locale)
        │   └── locale.js            ← COUNTRIES, CURRENCIES, COUNTRY_CURRENCY_MAP
        ├── components/
        │   ├── Layout/              ← Sidebar.jsx + Topbar.jsx (dark mode)
        │   └── common/              ← Button, Input, Modal, Badge
        └── pages/                   ← Login, Register, Onboarding, Dashboard,
                                        Transacciones, Estadisticas, Presupuesto,
                                        Recurrentes, Deudas, Cuentas, MetasAhorro
```

---

## Base de datos — tablas

| Tabla | Campos destacados |
|-------|------------------|
| `users` | id, email, password_hash, name, onboarding_done, locale, country, currency, email_verified |
| `accounts` | id, user_id, name, type(debit/credit), account_subtype, balance, **credit_limit**, color |
| `categories` | id, user_id, name, type(income/expense), is_default |
| `transactions` | id, user_id, account_id, category_id, type, amount, date, description, transfer_pair_id |
| `budgets` | id, user_id, category_id, month, year, limit_amount |
| `recurring_expenses` | id, user_id, account_id, category_id, name, amount, frequency, next_date, is_active |
| `recurring_payments` | id, recurring_expense_id, paid_date, amount |
| `debts` | id, user_id, counterpart_name, original_amount, remaining_amount, type(`owe`/`owed`), status(`active`/`paid`), date, description |
| `debt_payments` | id, debt_id, amount, date, notes — `account_id` no se almacena, solo se usa en el router para actualizar saldo |
| `savings_goals` | id, user_id, name, target_amount, **quota_amount**, **frequency**, description, color, status(active/achieved) |
| `goal_contributions` | id, goal_id, amount, date, notes, **is_quota_payment** |
| `revoked_tokens` | id, jti, expires_at, revoked_at |
| `audit_logs` | id, user_id, action, ip, details, created_at |

### Lógica de saldos
- Cuenta débito + gasto → `balance -= amount`
- Cuenta débito + ingreso → `balance += amount`
- Cuenta crédito + gasto → `balance += amount` (deuda sube)
- Cuenta crédito + ingreso/pago → `balance -= amount` (deuda baja)
- Cuenta crédito: `credit_limit` es el cupo total. `credit_limit - balance` = cupo disponible

**Transferencia entre cuentas:** crea 2 transacciones enlazadas por `transfer_pair_id`.
El resumen del mes en Dashboard **excluye** transacciones con `transfer_pair_id != null`.

**Abono a deuda (`POST /debts/{id}/payments`):** `account_id` es **obligatorio**. La lógica depende del tipo de deuda:
- `type = "owe"` (yo debo) → pago es un **gasto**: débito `balance -= amount`, crédito `balance += amount`
- `type = "owed"` (me deben) → pago es un **ingreso**: débito `balance += amount`, crédito `balance -= amount`
- `account_id` no se almacena en DB — se usa solo en el router para actualizar el saldo y se descarta.

**Creación de deuda tipo "owed" con origen "presté dinero":** Si se pasa `account_id` al crear, el backend deduce el monto de esa cuenta inmediatamente (el dinero ya salió). Si el origen es "venta/servicio", no se mueve ningún saldo. El campo `origin` es **solo frontend** — no existe en la DB.

---

## Features implementadas

### Cupo de tarjeta de crédito
- Campo `credit_limit` en `accounts` (nullable, solo aplica a crédito)
- Validación en `create_transaction`, `update_transaction` y `create_transfer`: si `balance + amount > credit_limit` → HTTP 400
- UI: campo en modal de nueva/editar cuenta + onboarding. Card y Dashboard muestran barra de utilización (verde < 70%, ámbar 70-90%, rojo > 90%)

### Metas de ahorro v2 (wishlist)
- Nuevo modelo: `quota_amount` (cuota periódica), `frequency` (daily/weekly/biweekly/monthly), `status` = active | achieved
- Campos calculados (no en DB): `current_amount` (suma de contribuciones), `remaining_amount`, `estimated_date`, `estimated_months`
- Endpoints: `POST /goals/{id}/achieve`, `POST /goals/{id}/contributions`
- UI: botón "Pagar cuota" (1 click, sin modal), "Otro monto" (modal libre), "Lograda ✓"
- Migración 004 convierte enum `goalstatus(completed)` → `wishliststatus(achieved)` y migra `current_amount` a `goal_contributions`

### Origen de deuda al crear (tipo "owed")
- Campo `origin` en el formulario frontend: `"lent"` (presté dinero) vs `"credit"` (venta/servicio)
- Si `origin = "lent"` → se envía `account_id` al backend → descuenta el monto de esa cuenta al crear
- Si `origin = "credit"` → no se envía `account_id` → solo registra la deuda sin mover fondos
- **El campo `origin` no existe en la DB ni en el schema backend** — es estado local del formulario
- Validación frontend: si `type="owed"` y `origin="lent"` y no hay `account_id` → error

### Abonos a deuda con cuenta obligatoria
- `DebtPaymentCreate.account_id` es **obligatorio** (sin `| None`)
- Lógica ingreso/gasto según tipo de deuda (ver sección "Lógica de saldos")
- Labels contextuales en UI: "Descontar de cuenta" (owe) vs "Acreditar a cuenta" (owed)
- No aplica validación de `credit_limit` — solo aplica a transacciones y transferencias

### i18n (español / inglés / portugués)
- Librería: `i18next` + `react-i18next` (recursos inlineados, sin HTTP backend)
- Idioma se cambia automáticamente al login/loadUser según `user.locale`
- `useCurrency()` hook: devuelve función de formato según `user.currency`
- `formatCurrency(amount, currency = "COP", locale = "es-CO")` — backward-compatible
- Registro: selección de idioma, país (auto-sugiere moneda) y moneda
- Endpoint: `PATCH /auth/me/preferences` (locale, country, currency)
- Pendiente: página de perfil para cambiar preferencias post-registro
- Pendiente: conectar `useCurrency()` en todas las páginas (actualmente solo funciona con defaults)

---

## Lecciones aprendidas — bugs conocidos

1. **Pydantic + campo nombrado igual que su tipo** (`date: date | None`): Fix → `from datetime import date as DateType`.

2. **passlib 1.7.4 incompatible con bcrypt ≥ 4.2**: Fix → usar `bcrypt` directamente sin passlib.

3. **JWT `sub` debe ser string**: Fix → `str(user_id)` al crear, `int(sub)` al decodificar.

4. **`pg_isready` sin `-d`**: Fix → agregar `-d ${POSTGRES_DB:-finzen_db}`.

5. **Enum PostgreSQL requiere USING al cambiar tipo**: Al hacer `ALTER COLUMN status TYPE nuevo_enum`, PostgreSQL necesita `USING CASE ... END` explícito. Ver migración 004 como referencia.

6. **Transferencias inflan resumen del mes**: Las transferencias crean 2 transacciones (ingreso + gasto). El dashboard las excluye filtrando `transfer_pair_id == None`.

7. **`origin` de deuda es solo frontend**: El campo `origin` ("lent"/"credit") no existe en DB ni schema backend. Es estado local del formulario que controla si se envía `account_id` al crear la deuda. No agregar `origin` al modelo ni al schema.

8. **`account_id` en pagos de deuda no se almacena**: `DebtPayment` no tiene columna `account_id`. El router lo recibe, actualiza el saldo de la cuenta, y lo descarta. No está en `DebtPaymentOut`.

---

## Decisiones de arquitectura importantes

- `utils/auth.py`: usa bcrypt directo (sin passlib). `create_token` usa `str(user_id)`, `deps.py` convierte `int(sub)`.
- Frontend es build estático servido por nginx → cambios en `.jsx` requieren `--build frontend` en local, y Vercel redespliega desde git en producción.
- Backend tiene volume mount en local → cambios en `.py` se recogen sin rebuild (uvicorn --reload). En Render, el redeploy es automático por git push.
- i18n usa recursos inlineados (importados como JSON) para evitar problemas con nginx SPA y rutas de archivos en producción.
- `savings_goals`: los campos `current_amount`, `remaining_amount`, `estimated_date` son **calculados en el router** (`_compute_summary`), no almacenados en DB.
- Dashboard resumen del mes excluye `transfer_pair_id IS NOT NULL` para no inflar ingresos/gastos con movimientos internos.

---

## Seguridad — estado actual

| Aspecto | Estado |
|---------|--------|
| Contraseñas | bcrypt directo ✓ |
| JWT | HS256, 7 días, con revocación en logout ✓ |
| HTTPS | Vercel + Render proveen SSL automático ✓ |
| CORS | Configurado a dominio Vercel ✓ |
| DB | Neon — no expuesta públicamente ✓ |
| Rate limiting | `slowapi` en /auth/login (5/min) y otros endpoints ✓ |
| Verificación email | Resend. Sin RESEND_API_KEY → auto-verifica (dev mode) ✓ |
| Recuperación contraseña | Implementada con token + email ✓ |
| Audit logs | Tabla `audit_logs` registra login, logout, registro, etc. ✓ |

---

## Pendientes / roadmap

- [ ] **Página de perfil** — cambiar idioma, moneda y país después del registro (endpoint ya existe: `PATCH /auth/me/preferences`)
- [ ] **useCurrency en todas las páginas** — actualmente la infraestructura está lista pero las páginas usan `formatCurrency` con defaults COP
- [ ] **Notificaciones de gastos recurrentes** — avisar cuando se acerca la fecha de cobro
- [ ] **Exportar datos** — CSV o PDF de transacciones por período
- [ ] **Página de estadísticas avanzada** — gráficos de tendencias, categorías top, comparativa mensual
- [ ] **Editar/eliminar pagos de deuda** — actualmente solo se pueden crear
- [ ] **Archivar deudas pagadas** — filtro activo/pagado en la vista de deudas
