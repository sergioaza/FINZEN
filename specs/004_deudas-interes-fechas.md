# 004 — Deudas: tasa de interés, fechas y claridad de campos

**Estado:** pendiente
**Complejidad:** media
**DB:** requiere migración 006
**Dependencias:** ninguna

---

## Problemas

1. No hay campo de tasa de interés mensual en las deudas.
2. El campo `date` es ambiguo — en la UI no queda claro si es "fecha de creación" o "fecha del préstamo".
3. No hay fecha estimada de finalización de la deuda.

---

## Decisiones de diseño

### ¿Cómo se aplica el interés?

**Opción elegida: campo informativo + proyección calculada en frontend.**

- El campo `interest_rate` (% mensual) se guarda en DB pero no modifica `remaining_amount` automáticamente.
- El backend calcula en el router (`_compute_debt_summary`) el saldo proyectado con interés para mostrar en UI.
- El usuario sigue registrando los abonos reales — el sistema le muestra cuánto está pagando de interés vs capital.

Esto evita tareas cron que modifiquen saldos automáticamente (riesgo de inconsistencia si el usuario no registra pagos).

---

## Cambios en backend

### Migración 006

```python
# backend/alembic/versions/006_debt_interest_end_date.py
def upgrade():
    op.add_column("debts", sa.Column("interest_rate", sa.Float, nullable=True))
    # interest_rate: % mensual (ej: 2.5 = 2.5% mensual). NULL = sin interés.

    op.add_column("debts", sa.Column("estimated_end_date", sa.Date, nullable=True))
    # estimated_end_date: fecha objetivo de pago total. Calculada o ingresada manualmente.
```

### Modelo `backend/app/models/debt.py`

Agregar campos nuevos al modelo `Debt`:
```python
interest_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
estimated_end_date: Mapped[DateType | None] = mapped_column(Date, nullable=True)
```

### Schemas `backend/app/schemas/debt.py`

- `DebtCreate`: agregar `interest_rate: float | None = None`, `estimated_end_date: DateType | None = None`
- `DebtUpdate`: agregar los mismos campos opcionales
- `DebtOut`: agregar `interest_rate: float | None`, `estimated_end_date: DateType | None`
- Calcular y agregar `projected_balance` en `DebtOut` (campo calculado, no en DB):
  - Si `interest_rate` existe: `projected_balance = remaining_amount * (1 + interest_rate/100)`
  - Si no: `projected_balance = remaining_amount`

### Router `backend/app/routers/debts.py`

- Agregar campo calculado `projected_balance` antes de retornar en `list_debts` y `create_debt`

---

## Cambios en frontend

### Modal "Nueva deuda" (`Deudas.jsx`)

1. **Renombrar label del campo `date`**: "Fecha de inicio de la deuda" (en lugar de solo "Fecha")
2. **Nuevo campo**: `interest_rate` — input numérico opcional, label "Tasa de interés mensual (%)", placeholder "0"
3. **Nuevo campo**: `estimated_end_date` — input tipo date opcional, label "Fecha estimada de pago total"

### DebtCard

Si la deuda tiene `interest_rate`:
- Mostrar badge o línea: "Interés: X% mensual"
- Mostrar `projected_balance` (saldo proyectado con interés al próximo mes)
- Diferenciar visualmente: saldo actual vs saldo proyectado

### Traducciones (es/en/pt)

Agregar en la sección `debts` de los 3 locales:
```json
"interest_rate": "Tasa de interés mensual (%)",
"estimated_end_date": "Fecha estimada de pago total",
"projected_balance": "Saldo proyectado",
"date_label": "Fecha de inicio de la deuda",
"no_interest": "Sin interés"
```

## Archivos a modificar

- `backend/alembic/versions/006_debt_interest_end_date.py` (nuevo)
- `backend/app/models/debt.py`
- `backend/app/schemas/debt.py`
- `backend/app/routers/debts.py`
- `frontend/src/pages/Deudas.jsx`
- `frontend/src/i18n/locales/es.json`, `en.json`, `pt.json`

## Criterios de aceptación

- [ ] Al crear deuda se puede ingresar tasa de interés y fecha estimada (ambos opcionales)
- [ ] La DebtCard muestra tasa de interés y proyección si están definidas
- [ ] El label "Fecha" en el formulario dice "Fecha de inicio de la deuda"
- [ ] Deudas existentes sin interés siguen funcionando igual (campos nullable)
- [ ] Migración 006 es reversible (downgrade quita las columnas)

## Notas

- `interest_rate` es porcentaje mensual (no anual) para simplificar
- `estimated_end_date` puede ser `null` — el sistema no la requiere
- NO modificar la lógica de `remaining_amount` — el interés es solo proyección visual
- Correr migración en Neon después del deploy (ver CLAUDE.md sección Migraciones)
