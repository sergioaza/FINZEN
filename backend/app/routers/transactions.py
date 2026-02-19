from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models.account import Account, AccountType
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut, TransferCreate

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _apply_balance(account: Account, tx_type: TransactionType, amount: float, reverse: bool = False):
    """Update account balance based on transaction type and account type."""
    multiplier = -1 if reverse else 1
    if account.type == AccountType.debit:
        if tx_type == TransactionType.expense:
            account.balance -= amount * multiplier
        else:
            account.balance += amount * multiplier
    else:  # credit
        if tx_type == TransactionType.expense:
            account.balance += amount * multiplier  # debt increases
        else:
            account.balance -= amount * multiplier  # debt decreases


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    category_id: int | None = None,
    type: TransactionType | None = None,
    account_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if from_date:
        q = q.filter(Transaction.date >= from_date)
    if to_date:
        q = q.filter(Transaction.date <= to_date)
    if category_id:
        q = q.filter(Transaction.category_id == category_id)
    if type:
        q = q.filter(Transaction.type == type)
    if account_id:
        q = q.filter(Transaction.account_id == account_id)
    return q.order_by(Transaction.date.desc(), Transaction.created_at.desc()).all()


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == data.account_id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    tx = Transaction(**data.model_dump(), user_id=current_user.id)
    _apply_balance(account, data.type, data.amount)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.put("/{tx_id}", response_model=TransactionOut)
def update_transaction(
    tx_id: int,
    data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")

    # Reverse old balance on old account
    old_account = db.query(Account).filter(Account.id == tx.account_id).first()
    if old_account:
        _apply_balance(old_account, tx.type, tx.amount, reverse=True)

    # Apply updated fields to transaction
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(tx, field, value)

    # Apply new balance on new account (may be different from old)
    new_account = db.query(Account).filter(Account.id == tx.account_id).first()
    if new_account:
        _apply_balance(new_account, tx.type, tx.amount)

    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(tx_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    account = db.query(Account).filter(Account.id == tx.account_id).first()
    if account:
        _apply_balance(account, tx.type, tx.amount, reverse=True)
    db.delete(tx)
    db.commit()


@router.post("/transfer", response_model=list[TransactionOut], status_code=201)
def create_transfer(
    data: TransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from_account = db.query(Account).filter(Account.id == data.from_account_id, Account.user_id == current_user.id).first()
    to_account = db.query(Account).filter(Account.id == data.to_account_id, Account.user_id == current_user.id).first()
    if not from_account or not to_account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    tx_out = Transaction(
        user_id=current_user.id,
        account_id=data.from_account_id,
        type=TransactionType.expense,
        amount=data.amount,
        date=data.date,
        description=data.description or f"Transferencia a {to_account.name}",
    )
    tx_in = Transaction(
        user_id=current_user.id,
        account_id=data.to_account_id,
        type=TransactionType.income,
        amount=data.amount,
        date=data.date,
        description=data.description or f"Transferencia desde {from_account.name}",
    )
    db.add(tx_out)
    db.add(tx_in)
    db.flush()

    tx_out.transfer_pair_id = tx_in.id
    tx_in.transfer_pair_id = tx_out.id

    _apply_balance(from_account, TransactionType.expense, data.amount)
    _apply_balance(to_account, TransactionType.income, data.amount)

    db.commit()
    db.refresh(tx_out)
    db.refresh(tx_in)
    return [tx_out, tx_in]
