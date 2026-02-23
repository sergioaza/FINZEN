---
paths:
  - "backend/alembic/**/*.py"
  - "backend/alembic.ini"
  - "backend/app/models/**/*.py"
---

# Reglas Base de Datos — PostgreSQL 15 + Alembic

## Convenciones de migraciones

### Crear una nueva migración
```bash
docker compose exec backend alembic revision --autogenerate -m "descripcion_corta"
```
- Revisar SIEMPRE el archivo generado antes de aplicarlo — autogenerate no es perfecto.
- Nombrar el archivo con número secuencial: `006_descripcion.py`.
- Cada migración debe tener `upgrade()` y `downgrade()` funcionales.

### Aplicar en local
```bash
docker compose exec backend alembic upgrade head
```

### Aplicar en producción (Neon)
```bash
docker compose exec -e DATABASE_URL="postgresql://neondb_owner:<pass>@ep-aged-voice-aicp7f0m-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" backend alembic upgrade head
```

## Historial de migraciones aplicadas
| Rev | Descripción |
|-----|-------------|
| 001 | Tablas iniciales: users, accounts, categories, transactions, budgets, recurring_expenses, recurring_payments, debts, debt_payments |
| 002 | savings_goals + goal_contributions |
| 003 | Seguridad: email_verified, email_verify_token, reset_token, revoked_tokens, audit_logs |
| 004 | credit_limit en accounts + savings_goals v2 (quota_amount, frequency, WishlistStatus) |
| 005 | locale, country, currency en users |

## Reglas críticas de migraciones

### Enums PostgreSQL
- Al **crear** un enum: `sa.Enum("val1", "val2", name="myenum")`.
- Al **cambiar** el tipo de una columna de enum: usar `USING CASE ... END` explícito.
- Al **renombrar** valores de enum: no es directo — crear nuevo enum, migrar datos, drop viejo.
- Ver migración 004 como referencia para cambios de enum complejos.

### Cambios de columnas
- Agregar columna nullable: seguro, no requiere default.
- Agregar columna NOT NULL: requiere `server_default` o migración en dos pasos.
- Cambiar tipo de columna: incluir `USING` si hay datos existentes.

### Índices y constraints
- Índices en columnas de filtro frecuente: `user_id`, `account_id`, `date`.
- FK constraints: definir con `ondelete="CASCADE"` donde sea apropiado (ej: payments → debt).

## Campos que NO están en la DB (calculados en router)
- `savings_goals`: `current_amount`, `remaining_amount`, `estimated_date`, `estimated_months`
- `debts`: `account_id` en `debt_payments` — se recibe en el endpoint pero no se almacena
- `debts`: campo `origin` — solo existe en el frontend, no en DB ni schema backend

## Conexión a Neon (producción)
- URL: `postgresql://neondb_owner:...@ep-aged-voice-aicp7f0m-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require`
- Neon usa connection pooling — siempre usar la URL de pooler para la app
- `sslmode=require` es obligatorio en Neon

## Conexión local (Docker)
- Host: `localhost:5432` (usuario: finzen, password: finzen, db: finzen_db)
- Configurada en `.env` (no commiteado — ver `.env.example`)
