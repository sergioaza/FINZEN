from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.deps import get_db, get_current_user
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("/month/{year}/{month}", response_model=list[BudgetOut])
def get_budgets_month(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id, Budget.year == year, Budget.month == month)
        .all()
    )
    result = []
    for b in budgets:
        from datetime import date
        start = date(year, month, 1)
        import calendar
        end = date(year, month, calendar.monthrange(year, month)[1])
        spent = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.category_id == b.category_id,
            Transaction.type == TransactionType.expense,
            Transaction.date >= start,
            Transaction.date <= end,
        ).scalar() or 0.0
        out = BudgetOut.model_validate(b)
        out.spent = spent
        result.append(out)
    return result


@router.post("", response_model=BudgetOut, status_code=201)
def create_budget(data: BudgetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == data.category_id,
        Budget.month == data.month,
        Budget.year == data.year,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un presupuesto para esta categoría y mes")
    b = Budget(**data.model_dump(), user_id=current_user.id)
    db.add(b)
    db.commit()
    db.refresh(b)
    return BudgetOut.model_validate(b)


@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: int,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    b.limit_amount = data.limit_amount
    db.commit()
    db.refresh(b)
    return BudgetOut.model_validate(b)


@router.delete("/{budget_id}", status_code=204)
def delete_budget(budget_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    db.delete(b)
    db.commit()
