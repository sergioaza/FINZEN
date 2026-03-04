# 💸 FinZen

**FinZen** es una aplicación web de finanzas personales en español, diseñada para ayudarte a controlar tus ingresos, gastos, deudas, presupuestos y metas de ahorro desde un solo lugar.

> 🌐 **Demo en producción:** [finzen-six.vercel.app](https://finzen-six.vercel.app)

---

## ✨ Funcionalidades

- **Dashboard** — Resumen del mes: ingresos, gastos y saldo neto. Excluye transferencias internas para no inflar cifras.
- **Transacciones** — Registra ingresos y gastos. Transfiere entre cuentas con trazabilidad.
- **Cuentas** — Débito y crédito. Tarjetas de crédito con control de cupo disponible (verde/ámbar/rojo).
- **Presupuestos** — Límites mensuales por categoría con seguimiento del gasto real.
- **Gastos recurrentes** — Suscripciones y pagos fijos. Marca como pagado y calcula automáticamente la próxima fecha.
- **Deudas** — Registra lo que debes y lo que te deben. Abona desde cualquier cuenta.
- **Metas de ahorro** — Define una meta, una cuota periódica y visualiza la fecha estimada de logro.
- **Estadísticas** — Gráficos de distribución por categoría y evolución mensual.
- **Perfil** — Cambia idioma (ES/EN/PT), país y moneda post-registro.
- **Seguridad** — Verificación de email, recuperación de contraseña, JWT con revocación, rate limiting y audit logs.

---

## 🏗️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 18.3 | UI principal |
| Vite | 5.3 | Build tool |
| Tailwind CSS | 3.4 | Estilos |
| React Router | 6.23 | Navegación SPA |
| Axios | 1.7 | HTTP client con interceptor JWT |
| Recharts | 2.12 | Gráficos |
| i18next | 23.15 | Internacionalización (ES/EN/PT) |
| date-fns | 3.6 | Manejo de fechas |

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| FastAPI | 0.111 | API REST |
| Python | 3.11 | Runtime |
| SQLAlchemy | 2.0 | ORM |
| Alembic | 1.13 | Migraciones de DB |
| PostgreSQL | 15 | Base de datos |
| python-jose | 3.3 | JWT (HS256) |
| bcrypt | 5.0 | Hash de contraseñas |
| slowapi | 0.1.9 | Rate limiting |
| Resend | 2.10 | Envío de emails |
| Pydantic | 2.7 | Validación y settings |

### Infraestructura (Producción)
| Servicio | Rol |
|---------|-----|
| **Vercel** | Frontend estático (CDN global) |
| **Render** | Backend FastAPI + uvicorn |
| **Neon.tech** | PostgreSQL serverless con backups |
| **GitHub** | Repositorio + CI/CD automático |

---

## 🚀 Despliegue en producción

El flujo es completamente automático vía Git:

```
git push origin main
    ↓
Vercel redeploya el frontend
Render redeploya el backend
```

Las migraciones de base de datos **hay que correrlas manualmente** (ver sección Migraciones).

### Variables de entorno — Render (backend)

Configurar en el dashboard de Render → Environment:

```env
DATABASE_URL=postgresql://neondb_owner:<pass>@<host>.neon.tech/neondb?sslmode=require
SECRET_KEY=<clave aleatoria de 64+ caracteres>
CORS_ORIGINS=https://<tu-dominio>.vercel.app
ACCESS_TOKEN_EXPIRE_MINUTES=10080
RESEND_API_KEY=<opcional — sin esto, los emails se auto-verifican en dev>
FRONTEND_URL=https://<tu-dominio>.vercel.app
```

> ⚠️ **Generar `SECRET_KEY` segura:** `python -c "import secrets; print(secrets.token_hex(64))"`

### Variables de entorno — Vercel (frontend)

El frontend es build estático. La URL del backend se configura directamente en `frontend/src/api/axios.js`.

---

## 💻 Desarrollo local

### Requisitos
- [Docker](https://www.docker.com/) y Docker Compose

### Primer arranque

```bash
# 1. Clonar el repositorio
git clone https://github.com/sergioaza/FINZEN.git
cd FINZEN

# 2. Crear el archivo de variables de entorno
cp .env.example .env

# 3. Levantar todos los servicios
docker compose up -d

# 4. Correr las migraciones
docker compose exec backend alembic upgrade head
```

### URLs locales

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger / Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

### Comandos útiles

```bash
# Levantar servicios
docker compose up -d

# Ver logs del backend en tiempo real
docker compose logs -f backend

# Rebuild del frontend (cambios en .jsx o dependencias npm)
docker compose up -d --build frontend

# Rebuild completo (cambios en requirements.txt)
docker compose up --build

# Apagar (conserva datos)
docker compose down

# Apagar y borrar base de datos
docker compose down -v
```

---

## 🗄️ Migraciones Alembic

### Historial de migraciones

| Revisión | Descripción |
|---------|-------------|
| `001` | Tablas iniciales: users, accounts, categories, transactions, budgets, recurring_expenses, recurring_payments, debts, debt_payments |
| `002` | savings_goals + goal_contributions |
| `003` | Seguridad: email_verified, email_verify_token, reset_token, revoked_tokens, audit_logs |
| `004` | credit_limit en accounts + savings_goals v2 (quota_amount, frequency, WishlistStatus) |
| `005` | locale, country, currency en users |

### Correr migraciones en producción (Neon)

```bash
# Opción A — desde local con Docker corriendo
docker compose exec -e DATABASE_URL="postgresql://neondb_owner:<pass>@<host>.neon.tech/neondb?sslmode=require" backend alembic upgrade head

# Opción B — desde local con Python instalado
cd backend
DATABASE_URL="postgresql://..." alembic upgrade head
```

### Verificar versión actual

```bash
docker compose exec backend alembic current
# debe mostrar: 005 (head)
```

---

## 📁 Estructura del proyecto

```
FinZen/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/versions/          ← Migraciones (001→005)
│   └── app/
│       ├── main.py                ← FastAPI app + CORS + routers
│       ├── config.py              ← Settings (lee variables de entorno)
│       ├── database.py            ← SQLAlchemy engine + SessionLocal
│       ├── deps.py                ← get_db(), get_current_user()
│       ├── models/                ← user, account, category, transaction,
│       │                             budget, recurring, debt, savings_goal
│       ├── schemas/               ← Pydantic schemas
│       ├── routers/               ← auth, accounts, categories, transactions,
│       │                             budgets, recurring, debts, dashboard, goals
│       └── utils/
│           ├── auth.py            ← bcrypt + JWT
│           ├── seed.py            ← 17 categorías por defecto al registrarse
│           ├── email.py           ← Resend email service
│           └── audit.py          ← Log de eventos de seguridad
└── frontend/
    ├── nginx.conf                 ← SPA routing + proxy /api/ → backend
    └── src/
        ├── api/                   ← axios.js (interceptor JWT) + módulos
        ├── context/               ← AuthContext.jsx (JWT + i18n)
        ├── hooks/                 ← useAuth.js, useCurrency.js
        ├── i18n/                  ← es.json, en.json, pt.json
        ├── utils/                 ← format.js, locale.js
        ├── components/
        │   ├── Layout/            ← Sidebar.jsx, Topbar.jsx
        │   └── common/            ← Button, Input, Modal, Badge
        └── pages/                 ← Login, Register, Onboarding, Dashboard,
                                      Transacciones, Estadisticas, Presupuesto,
                                      Recurrentes, Deudas, Cuentas, MetasAhorro,
                                      Perfil, ConfirmarEmail, RestablecerContrasena
```

---

## 🗃️ Modelo de base de datos

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios con preferencias de locale, país y moneda |
| `accounts` | Cuentas débito/crédito. Crédito incluye `credit_limit` |
| `categories` | Categorías de ingreso/gasto (17 por defecto + personalizadas) |
| `transactions` | Movimientos. Transferencias se enlazan con `transfer_pair_id` |
| `budgets` | Presupuestos mensuales por categoría |
| `recurring_expenses` | Gastos recurrentes con frecuencia y próxima fecha |
| `debts` | Deudas (type: `owe` = yo debo / `owed` = me deben) |
| `savings_goals` | Metas con cuota periódica y frecuencia |
| `goal_contributions` | Aportes a metas |
| `revoked_tokens` | JWT revocados (logout) |
| `audit_logs` | Log de eventos de seguridad (login, logout, registro, etc.) |

### Lógica de saldos

```
Cuenta débito  + gasto   → balance -= amount
Cuenta débito  + ingreso → balance += amount
Cuenta crédito + gasto   → balance += amount  (deuda aumenta)
Cuenta crédito + ingreso → balance -= amount  (deuda disminuye)

Cupo disponible = credit_limit - balance
```

---

## 🔒 Seguridad

| Aspecto | Implementación |
|--------|---------------|
| Contraseñas | bcrypt directo (sin passlib) |
| Autenticación | JWT HS256, 7 días, con revocación en logout |
| HTTPS | Automático via Vercel + Render |
| CORS | Restringido al dominio de Vercel |
| Rate limiting | slowapi: 5/min en login, 3/hour en forgot-password |
| Verificación email | Resend. Sin API key → auto-verifica (modo dev) |
| Recuperación contraseña | Token temporal por email |
| Audit logs | Tabla `audit_logs` con IP, acción y timestamp |

---

## 🌍 Internacionalización

La app soporta 3 idiomas configurables por usuario:

- 🇪🇸 Español (`es-CO`, `es-MX`, etc.)
- 🇺🇸 Inglés (`en-US`)
- 🇧🇷 Portugués (`pt-BR`)

El idioma se cambia automáticamente al hacer login según las preferencias del usuario. También se puede cambiar desde la página de perfil.

---

## 📡 API Reference

Base URL local: `http://localhost:8000`
Documentación interactiva: `http://localhost:8000/docs`

Todos los endpoints (excepto `/auth/login` y `/auth/register`) requieren:
```
Authorization: Bearer <jwt_token>
```

### Endpoints principales

| Grupo | Prefijo | Descripción |
|-------|---------|-------------|
| Auth | `/auth` | Registro, login, logout, perfil, verificación email |
| Cuentas | `/accounts` | CRUD de cuentas bancarias |
| Transacciones | `/transactions` | CRUD + transferencias entre cuentas |
| Categorías | `/categories` | CRUD de categorías |
| Presupuestos | `/budgets` | Presupuestos mensuales |
| Recurrentes | `/recurring` | Gastos recurrentes + registro de pagos |
| Deudas | `/debts` | Deudas + abonos |
| Metas | `/goals` | Metas de ahorro + contribuciones |
| Dashboard | `/dashboard` | Resumen del mes + totales por cuenta |

---

## 🛣️ Roadmap

- [ ] Notificaciones de gastos recurrentes próximos al vencer
- [ ] Exportar transacciones a CSV / PDF
- [ ] Estadísticas avanzadas: tendencias, top categorías, comparativa mensual
- [ ] Editar y eliminar pagos de deuda
- [ ] Archivar deudas pagadas con filtro activo/pagado

---

## 📄 Licencia

MIT — libre para uso personal y educativo.

---

<p align="center">
  Hecho con ❤️ por <a href="https://github.com/sergioaza">sergioaza</a>
</p>
