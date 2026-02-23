from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models.account import Account, AccountType
from app.models.debt import Debt, DebtPayment, DebtStatus
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.schemas.debt import DebtCreate, DebtUpdate, DebtPaymentCreate, DebtOut, DebtPaymentOut

router = APIRouter(prefix="/debts", tags=["debts"])


def _create_transaction(db: Session, user_id: int, account_id: int, tx_type: TransactionType,
                        amount: float, tx_date: date, description: str):
    """Crea un registro de transacción para trazabilidad. No modifica saldos (ya fue hecho en el router)."""
    tx = Transaction(
        user_id=user_id,
        account_id=account_id,
        category_id=None,
        type=tx_type,
        amount=amount,
        date=tx_date,
        description=description,
    )
    db.add(tx)


@router.get("", response_model=list[DebtOut])
def list_debts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Debt).filter(Debt.user_id == current_user.id).order_by(Debt.date.desc()).all()


@router.post("", response_model=DebtOut, status_code=201)
def create_debt(data: DebtCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.original_amount <= 0:
        raise HTTPException(status_code=400, detail="El monto de la deuda debe ser mayor a 0")

    # Si es "me deben" y se indicó cuenta, descontar el monto (ya presté el dinero)
    if data.type.value == "owed" and data.account_id is not None:
        account = db.query(Account).filter(Account.id == data.account_id, Account.user_id == current_user.id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Cuenta no encontrada")
        if account.type == AccountType.debit:
            if account.balance < data.original_amount:
                raise HTTPException(status_code=400, detail="Saldo insuficiente en la cuenta seleccionada")
            account.balance -= data.original_amount
        else:  # crédito → prestar con tarjeta sube la deuda de la tarjeta
            if account.credit_limit is not None and account.balance + data.original_amount > account.credit_limit:
                raise HTTPException(status_code=400, detail="El monto supera el cupo disponible de la tarjeta")
            account.balance += data.original_amount

        # Registrar la transacción de salida (préstamo otorgado)
        _create_transaction(
            db, current_user.id, data.account_id,
            TransactionType.expense, data.original_amount, data.date,
            f"Préstamo a {data.counterpart_name}",
        )

    debt = Debt(
        user_id=current_user.id,
        remaining_amount=data.original_amount,
        counterpart_name=data.counterpart_name,
        original_amount=data.original_amount,
        type=data.type,
        date=data.date,
        description=data.description,
        account_id=data.account_id if data.type.value == "owed" else None,
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

    # Si presté dinero y queda saldo pendiente, devolver el restante a la cuenta de origen
    if debt.type.value == "owed" and debt.remaining_amount > 0 and debt.account_id is not None:
        account = db.query(Account).filter(Account.id == debt.account_id, Account.user_id == current_user.id).first()
        if account:
            if account.type == AccountType.debit:
                account.balance += debt.remaining_amount
            else:  # crédito → reversar baja la deuda de la tarjeta
                account.balance -= debt.remaining_amount

            # Registrar la transacción de reversión
            _create_transaction(
                db, current_user.id, debt.account_id,
                TransactionType.income, debt.remaining_amount, date.today(),
                f"Cancelación de préstamo a {debt.counterpart_name}",
            )

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
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto del abono debe ser mayor a 0")
    if data.amount > debt.remaining_amount:
        raise HTTPException(status_code=400, detail="El abono supera el saldo pendiente")

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
            if account.credit_limit is not None and account.balance + data.amount > account.credit_limit:
                raise HTTPException(status_code=400, detail="El monto supera el cupo disponible de la tarjeta")
            account.balance += data.amount

        _create_transaction(
            db, current_user.id, data.account_id,
            TransactionType.expense, data.amount, data.date,
            f"Abono a deuda con {debt.counterpart_name}",
        )
    else:
        # Me deben → recibo el abono, es un INGRESO a mi cuenta
        if account.type == AccountType.debit:
            account.balance += data.amount
        else:  # crédito → ingreso reduce deuda de la tarjeta
            account.balance -= data.amount

        _create_transaction(
            db, current_user.id, data.account_id,
            TransactionType.income, data.amount, data.date,
            f"Abono recibido de {debt.counterpart_name}",
        )

    debt.remaining_amount -= data.amount
    if debt.remaining_amount <= 0:
        debt.remaining_amount = 0
        debt.status = DebtStatus.paid

    payment = DebtPayment(debt_id=debt_id, **{k: v for k, v in data.model_dump().items() if k != "account_id"})
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment
