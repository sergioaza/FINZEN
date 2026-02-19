from datetime import date, timedelta
import calendar
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models.account import Account, AccountType
from app.models.recurring import RecurringExpense
from app.models.transaction import Transaction, TransactionType
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()

    total_assets = sum(a.balance for a in accounts if a.type == AccountType.debit)
    total_debt = sum(a.balance for a in accounts if a.type == AccountType.credit)
    net_balance = total_assets - total_debt

    today = date.today()
    start_month = today.replace(day=1)
    end_month = today.replace(day=calendar.monthrange(today.year, today.month)[1])

    income_month = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.income,
        Transaction.date >= start_month,
        Transaction.date <= end_month,
    ).scalar() or 0.0

    expense_month = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.expense,
        Transaction.date >= start_month,
        Transaction.date <= end_month,
    ).scalar() or 0.0

    upcoming_limit = today + timedelta(days=7)
    upcoming = (
        db.query(RecurringExpense)
        .filter(
            RecurringExpense.user_id == current_user.id,
            RecurringExpense.is_active == True,
            RecurringExpense.next_date >= today,
            RecurringExpense.next_date <= upcoming_limit,
        )
        .order_by(RecurringExpense.next_date)
        .all()
    )

    recent_transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_assets": total_assets,
        "total_debt": total_debt,
        "net_balance": net_balance,
        "income_month": income_month,
        "expense_month": expense_month,
        "accounts": [
            {
                "id": a.id,
                "name": a.name,
                "type": a.type,
                "account_subtype": a.account_subtype,
                "balance": a.balance,
                "color": a.color,
            }
            for a in accounts
        ],
        "upcoming_recurring": [
            {
                "id": r.id,
                "name": r.name,
                "amount": r.amount,
                "next_date": r.next_date,
                "frequency": r.frequency,
            }
            for r in upcoming
        ],
        "recent_transactions": [
            {
                "id": t.id,
                "type": t.type,
                "amount": t.amount,
                "date": t.date,
                "description": t.description,
                "account_id": t.account_id,
                "category_id": t.category_id,
            }
            for t in recent_transactions
        ],
    }
