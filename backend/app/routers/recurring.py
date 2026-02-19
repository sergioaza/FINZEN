from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models.account import Account
from app.models.recurring import RecurringExpense, RecurringPayment, Frequency
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.schemas.recurring import RecurringCreate, RecurringUpdate, RecurringOut

router = APIRouter(prefix="/recurring", tags=["recurring"])


def _next_date(current: date, frequency: Frequency) -> date:
    if frequency == Frequency.daily:
        return current + timedelta(days=1)
    elif frequency == Frequency.weekly:
        return current + timedelta(weeks=1)
    elif frequency == Frequency.biweekly:
        return current + timedelta(weeks=2)
    elif frequency == Frequency.monthly:
        return current + relativedelta(months=1)
    elif frequency == Frequency.yearly:
        return current + relativedelta(years=1)
    return current


@router.get("", response_model=list[RecurringOut])
def list_recurring(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(RecurringExpense).filter(RecurringExpense.user_id == current_user.id).all()


@router.post("", response_model=RecurringOut, status_code=201)
def create_recurring(data: RecurringCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = RecurringExpense(**data.model_dump(), user_id=current_user.id)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.put("/{recurring_id}", response_model=RecurringOut)
def update_recurring(
    recurring_id: int,
    data: RecurringUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(RecurringExpense).filter(RecurringExpense.id == recurring_id, RecurringExpense.user_id == current_user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recurrente no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(r, field, value)
    db.commit()
    db.refresh(r)
    return r


@router.delete("/{recurring_id}", status_code=204)
def delete_recurring(recurring_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(RecurringExpense).filter(RecurringExpense.id == recurring_id, RecurringExpense.user_id == current_user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recurrente no encontrado")
    db.delete(r)
    db.commit()


@router.post("/{recurring_id}/pay", status_code=201)
def pay_recurring(recurring_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(RecurringExpense).filter(RecurringExpense.id == recurring_id, RecurringExpense.user_id == current_user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recurrente no encontrado")
    account = db.query(Account).filter(Account.id == r.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    today = date.today()
    payment = RecurringPayment(recurring_expense_id=r.id, paid_date=today, amount=r.amount)
    tx = Transaction(
        user_id=current_user.id,
        account_id=r.account_id,
        category_id=r.category_id,
        type=TransactionType.expense,
        amount=r.amount,
        date=today,
        description=f"Pago recurrente: {r.name}",
    )
    from app.routers.transactions import _apply_balance
    _apply_balance(account, TransactionType.expense, r.amount)
    r.next_date = _next_date(r.next_date, r.frequency)
    db.add(payment)
    db.add(tx)
    db.commit()
    return {"message": "Pago registrado", "next_date": r.next_date}
