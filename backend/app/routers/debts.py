from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models.account import Account, AccountType
from app.models.debt import Debt, DebtPayment, DebtStatus
from app.models.user import User
from app.schemas.debt import DebtCreate, DebtUpdate, DebtPaymentCreate, DebtOut, DebtPaymentOut

router = APIRouter(prefix="/debts", tags=["debts"])


@router.get("", response_model=list[DebtOut])
def list_debts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Debt).filter(Debt.user_id == current_user.id).order_by(Debt.date.desc()).all()


@router.post("", response_model=DebtOut, status_code=201)
def create_debt(data: DebtCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    debt = Debt(
        **data.model_dump(),
        user_id=current_user.id,
        remaining_amount=data.original_amount,
    )
    db.add(debt)
    db.commit()
    db.refresh(debt)
    return debt


@router.put("/{debt_id}", response_model=DebtOut)
def update_debt(
    debt_id: int,
    data: DebtUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.user_id == current_user.id).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(debt, field, value)
    db.commit()
    db.refresh(debt)
    return debt


@router.delete("/{debt_id}", status_code=204)
def delete_debt(debt_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.user_id == current_user.id).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada")
    db.delete(debt)
    db.commit()


@router.post("/{debt_id}/payments", response_model=DebtPaymentOut, status_code=201)
def add_payment(
    debt_id: int,
    data: DebtPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.user_id == current_user.id).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada")
    if data.amount > debt.remaining_amount:
        raise HTTPException(status_code=400, detail="El abono supera el saldo pendiente")

    # Actualizar saldo de cuenta según tipo de deuda
    account = db.query(Account).filter(Account.id == data.account_id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    if debt.type.value == "owe":
        # Yo debo → el abono es un GASTO que sale de mi cuenta
        if account.type == AccountType.debit:
            if account.balance < data.amount:
                raise HTTPException(status_code=400, detail="Saldo insuficiente en la cuenta seleccionada")
            account.balance -= data.amount
        else:  # crédito → usar tarjeta para pagar sube la deuda de la tarjeta
            account.balance += data.amount
    else:
        # Me deben → recibo el abono, es un INGRESO a mi cuenta
        if account.type == AccountType.debit:
            account.balance += data.amount
        else:  # crédito → ingreso reduce deuda de la tarjeta
            account.balance -= data.amount

    debt.remaining_amount -= data.amount
    if debt.remaining_amount <= 0:
        debt.remaining_amount = 0
        debt.status = DebtStatus.paid
    payment = DebtPayment(debt_id=debt_id, **data.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment
