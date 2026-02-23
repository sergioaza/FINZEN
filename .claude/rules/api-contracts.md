# Contratos de API — FinZen

## Convenciones generales
- Base URL local: `http://localhost:8000`
- Base URL producción: Render (configurado en `frontend/src/api/axios.js`)
- Auth: Bearer token en header `Authorization: Bearer <jwt>`
- Respuestas de error: `{ "detail": "mensaje de error" }`
- Todos los endpoints (excepto `/auth/login`, `/auth/register`) requieren JWT

## Auth (`/auth`)

| Método | Endpoint | Body | Descripción |
|--------|----------|------|-------------|
| POST | `/auth/register` | `{email, password, name, locale?, country?, currency?}` | Registro. Rate limited. |
| POST | `/auth/login` | `{email, password}` | Login. Rate limited 5/min. Devuelve `{access_token, token_type}` |
| POST | `/auth/logout` | — | Revoca el JWT actual |
| GET | `/auth/me` | — | Perfil del usuario autenticado |
| PATCH | `/auth/me/preferences` | `{locale?, country?, currency?}` | Actualizar idioma/moneda |
| POST | `/auth/verify-email/{token}` | — | Verificar email |
| POST | `/auth/forgot-password` | `{email}` | Enviar email de recuperación |
| POST | `/auth/reset-password` | `{token, new_password}` | Cambiar contraseña |

## Cuentas (`/accounts`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/accounts` | Listar cuentas del usuario |
| POST | `/accounts` | Crear cuenta (`name, type, balance, color, credit_limit?`) |
| PUT | `/accounts/{id}` | Actualizar cuenta |
| DELETE | `/accounts/{id}` | Eliminar cuenta |

**Nota:** `credit_limit` solo aplica a cuentas de tipo `credit`. `credit_limit - balance` = cupo disponible.

## Transacciones (`/transactions`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/transactions` | Listar (filtros: `month`, `year`, `category_id`, `account_id`) |
| POST | `/transactions` | Crear. Valida credit_limit si cuenta es crédito. |
| PUT | `/transactions/{id}` | Actualizar. Revierte saldo anterior y aplica nuevo. |
| DELETE | `/transactions/{id}` | Eliminar. Revierte saldo. |
| POST | `/transactions/transfer` | Crear transferencia (2 tx con `transfer_pair_id`) |

## Categorías (`/categories`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/categories` | Listar (incluye 17 defaults del usuario) |
| POST | `/categories` | Crear categoría personalizada |
| PUT | `/categories/{id}` | Actualizar |
| DELETE | `/categories/{id}` | Eliminar (no se puede si tiene transacciones) |

## Presupuestos (`/budgets`)

| Método | Endpoint | Body | Descripción |
|--------|----------|------|-------------|
| GET | `/budgets` | `?month=&year=` | Listar con gasto actual calculado |
| POST | `/budgets` | `{category_id, month, year, limit_amount}` | Crear presupuesto mensual |
| PUT | `/budgets/{id}` | `{limit_amount}` | Actualizar límite |
| DELETE | `/budgets/{id}` | — | Eliminar |

## Deudas (`/debts`)

| Método | Endpoint | Body | Descripción |
|--------|----------|------|-------------|
| GET | `/debts` | — | Listar deudas con pagos |
| POST | `/debts` | `{counterpart_name, original_amount, type, date, description?, account_id?}` | Crear. Si `type=owed` y `account_id`, deduce de cuenta. |
| PUT | `/debts/{id}` | — | Actualizar deuda |
| DELETE | `/debts/{id}` | — | Eliminar |
| POST | `/debts/{id}/payments` | `{amount, date, notes?, account_id}` | Registrar pago. `account_id` obligatorio. Lógica ingreso/gasto según tipo. |

**Lógica de pagos de deuda:**
- `type=owe` → pago es gasto (débito: `-amount`, crédito: `+amount`)
- `type=owed` → pago es ingreso (débito: `+amount`, crédito: `-amount`)

## Metas de ahorro (`/goals`)

| Método | Endpoint | Body | Descripción |
|--------|----------|------|-------------|
| GET | `/goals` | — | Listar con `current_amount`, `remaining_amount`, `estimated_date` calculados |
| POST | `/goals` | `{name, target_amount, quota_amount, frequency, description?, color?}` | Crear meta |
| PUT | `/goals/{id}` | — | Actualizar |
| DELETE | `/goals/{id}` | — | Eliminar |
| POST | `/goals/{id}/contributions` | `{amount, date, notes?, is_quota_payment?}` | Agregar contribución |
| POST | `/goals/{id}/achieve` | — | Marcar como lograda |

## Dashboard (`/dashboard`)

| Método | Endpoint | Query | Descripción |
|--------|----------|-------|-------------|
| GET | `/dashboard/summary` | `?month=&year=` | Ingresos/gastos del mes (excluye transferencias) |
| GET | `/dashboard/accounts` | — | Saldo total + cuentas con cupo disponible |

## Gastos recurrentes (`/recurring`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/recurring` | Listar recurrentes activos |
| POST | `/recurring` | Crear (`name, amount, frequency, next_date, account_id, category_id`) |
| PUT | `/recurring/{id}` | Actualizar |
| DELETE | `/recurring/{id}` | Eliminar |
| POST | `/recurring/{id}/pay` | Registrar pago y calcular próxima fecha |
