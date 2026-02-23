# 005 — Deudas vinculadas a pagos recurrentes automáticos

**Estado:** pendiente
**Complejidad:** alta
**DB:** requiere migración 007
**Dependencias:** spec 004 (deuda debe tener campos estables antes de vincular)

---

## Problema

Las cuotas de deudas (préstamos, créditos) son pagos periódicos. Hoy hay que registrar la transacción recurrente Y el abono a la deuda por separado. Si se vinculan, al pagar el recurrente se abona automáticamente a la deuda.

---

## Decisión de diseño

- La vinculación es **opcional** — un recurrente puede o no tener `debt_id`
- Al pagar el recurrente vinculado, se crea automáticamente un `DebtPayment` y se descuenta de `remaining_amount`
- Si `debt.remaining_amount` llega a 0, la deuda se marca como `paid`
- La cuenta que se descuenta es la misma del recurrente (`recurring_expense.account_id`)

---

## Cambios en backend

### Migración 007

```python
def upgrade():
    op.add_column(
        "recurring_expenses",
        sa.Column("debt_id", sa.Integer, sa.ForeignKey("debts.id", ondelete="SET NULL"), nullable=True)
    )
    # ondelete="SET NULL": si se elimina la deuda, el recurrente sigue existiendo sin vínculo
```

### Modelo `backend/app/models/recurring.py`

```python
debt_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("debts.id", ondelete="SET NULL"), nullable=True)
debt = relationship("Debt", foreign_keys=[debt_id])
```

### Schemas `backend/app/schemas/recurring.py`

- `RecurringExpenseCreate`: agregar `debt_id: int | None = None`
- `RecurringExpenseUpdate`: agregar `debt_id: int | None = None`
- `RecurringExpenseOut`: agregar `debt_id: int | None`

### Router `backend/app/routers/recurring.py`

En el endpoint de pagar (`POST /recurring/{id}/pay`):
```python
# DESPUÉS de crear el RecurringPayment y actualizar account.balance...
if recurring.debt_id:
    debt = db.query(Debt).filter(
        Debt.id == recurring.debt_id,
        Debt.user_id == current_user.id,  # verificar ownership
        Debt.status == DebtStatus.active,
    ).first()
    if debt:
        payment_amount = min(data.amount, debt.remaining_amount)
        debt.remaining_amount -= payment_amount
        debt.remaining_amount = max(0, debt.remaining_amount)
        if debt.remaining_amount <= 0:
            debt.status = DebtStatus.paid
        db.add(DebtPayment(
            debt_id=debt.id,
            amount=payment_amount,
            date=data.paid_date,
            notes=f"Pago automático desde recurrente: {recurring.name}",
        ))
```

**Importante**: verificar que `Debt` y `DebtPayment` estén importados en el router de recurrentes.

---

## Cambios en frontend

### Formulario de nuevo/editar recurrente (`Recurrentes.jsx`)

Agregar selector opcional `debt_id`:
- Select con label "Vincular a deuda (opcional)"
- Opciones: todas las deudas activas del usuario de tipo `"owe"` (yo debo) — no tiene sentido vincular pagos a deudas tipo `"owed"` (me deben)
- Opción por defecto: "— Sin vínculo —"

### RecurringCard (si existe) o lista de recurrentes

Si el recurrente tiene `debt_id`, mostrar indicador: "Abona a: [nombre de la deuda]"

### Página de deudas (`Deudas.jsx`)

En la `DebtCard`, si la deuda tiene recurrentes vinculados, mostrar:
- "Pago automático: [nombre del recurrente]"
- Esto requiere que `DebtOut` incluya los recurrentes vinculados, o hacer una llamada separada

**Alternativa más simple**: no mostrar el vínculo en DebtCard, solo en el recurrente. Menos API calls, implementación más limpia.

### Traducciones (es/en/pt)

```json
"link_debt": "Vincular a deuda (opcional)",
"no_debt_link": "— Sin vínculo —",
"auto_payment_label": "Abona a"
```

---

## Archivos a modificar

- `backend/alembic/versions/007_recurring_debt_link.py` (nuevo)
- `backend/app/models/recurring.py`
- `backend/app/schemas/recurring.py`
- `backend/app/routers/recurring.py` (lógica principal)
- `frontend/src/pages/Recurrentes.jsx`
- `frontend/src/i18n/locales/es.json`, `en.json`, `pt.json`

## Criterios de aceptación

- [ ] Al crear/editar un recurrente se puede vincular a una deuda activa
- [ ] Al pagar el recurrente vinculado, se crea automáticamente un DebtPayment
- [ ] `remaining_amount` de la deuda se descuenta correctamente
- [ ] Si la deuda llega a 0, se marca como `paid`
- [ ] Si se elimina la deuda, el recurrente sigue existiendo (debt_id → NULL)
- [ ] Solo se puede vincular a deudas tipo `"owe"` del propio usuario
- [ ] Recurrentes sin vínculo siguen funcionando igual

## Notas

- Correr migración 007 en Neon después del deploy
- Revisar con code-reviewer antes de hacer push (este router no ha sido auditado)
- Si `payment_amount > data.amount` no puede pasar (está validado por `min()`), pero documentarlo
