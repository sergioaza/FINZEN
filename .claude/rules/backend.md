---
paths:
  - "backend/app/**/*.py"
  - "backend/alembic/**/*.py"
  - "backend/requirements.txt"
---

# Reglas Backend — FastAPI + SQLAlchemy 2.0

## Stack y convenciones
- **FastAPI** con Python 3.11. Endpoints asíncronos cuando sea necesario.
- **SQLAlchemy 2.0** — usar `session.exec()` (estilo 2.0), no `session.query()`.
- **Pydantic v2** para schemas. Validación de entrada en todos los endpoints.
- **Alembic** para migraciones. Nunca modificar modelos sin crear migración.

## Estructura de archivos
```
app/
├── main.py       ← FastAPI app + CORS + registro de routers
├── config.py     ← Pydantic Settings (lee .env / env vars via DATABASE_URL etc.)
├── database.py   ← engine + SessionLocal + Base
├── deps.py       ← get_db(), get_current_user() — SIEMPRE usar para auth
├── models/       ← un archivo por entidad
├── schemas/      ← un archivo por entidad (mirrors de modelos)
├── routers/      ← un archivo por entidad
└── utils/
    ├── auth.py   ← bcrypt directo (sin passlib) + JWT (python-jose)
    ├── seed.py   ← 17 categorías en español al registrar usuario
    ├── email.py  ← Resend API
    └── audit.py  ← log de acciones de seguridad
```

## Autenticación y seguridad
- **Siempre** usar `get_current_user()` de `deps.py` como dependencia en endpoints protegidos.
- JWT: `create_token` usa `str(user_id)`, `deps.py` convierte `int(sub)` al decodificar.
- bcrypt directo sin passlib (passlib 1.7.4 es incompatible con bcrypt ≥ 4.2).
- Todos los endpoints de usuario filtran por `user_id` del token — nunca confiar en IDs del request body para ownership.

## Modelos SQLAlchemy
- Definir relaciones con `relationship()` y `back_populates`.
- Campos nullable con `Optional[type] = None`.
- **Bug conocido**: si un campo se llama igual que su tipo (ej: `date: date`), importar el tipo con alias: `from datetime import date as DateType`.
- Enums de PostgreSQL: cambiar tipo requiere `USING CASE ... END` explícito en migraciones (ver migración 004).

## Schemas Pydantic
- `*Create`: para POST (sin id, sin timestamps).
- `*Update`: para PATCH/PUT (campos opcionales).
- `*Out`: para respuestas (incluye id y campos calculados).
- Campos calculados (no en DB) se agregan en el router antes de retornar, no en el modelo.

## Lógica de saldos de cuentas
```
Débito + gasto   → balance -= amount
Débito + ingreso → balance += amount
Crédito + gasto  → balance += amount  (deuda sube)
Crédito + ingreso/pago → balance -= amount  (deuda baja)
```
- Validar `credit_limit` en create/update transaction y create_transfer: `balance + amount > credit_limit` → HTTP 400.
- La validación de credit_limit NO aplica a pagos de deuda.

## Lógica de deudas
- `type = "owe"` (yo debo): pago = gasto → débito `balance -= amount`, crédito `balance += amount`
- `type = "owed"` (me deben): pago = ingreso → débito `balance += amount`, crédito `balance -= amount`
- `account_id` en pagos de deuda: obligatorio en schema, usado en router para actualizar saldo, **no almacenado en DB**.
- Creación de deuda "owed" + `account_id`: deducir monto de cuenta inmediatamente (dinero ya salió).

## Transferencias
- Crear 2 transacciones enlazadas por `transfer_pair_id` (UUID).
- Dashboard excluye transferencias: filtrar `transfer_pair_id IS NOT NULL`.

## Rate limiting
- `slowapi` activo en `/auth/login` (5/min) y otros endpoints sensibles.
- No aplicar rate limiting indiscriminadamente — solo endpoints de auth y acciones críticas.

## Deploy
- Cambios en `.py` se recogen automáticamente en local (uvicorn --reload + volume mount).
- En producción (Render): push a `main` dispara redeploy automático.
- Migraciones Alembic hay que correrlas manualmente después del deploy (ver CLAUDE.md sección Migraciones).
