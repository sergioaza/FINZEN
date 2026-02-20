import math
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models.savings_goal import SavingsGoal, GoalContribution, WishlistStatus
from app.models.user import User
from app.schemas.savings_goal import GoalCreate, GoalUpdate, ContributionCreate, GoalOut, ContributionOut

router = APIRouter(prefix="/goals", tags=["goals"])

DAYS_PER_PERIOD = {
    "daily": 1,
    "weekly": 7,
    "biweekly": 14,
    "monthly": 30,
}


def _compute_summary(goal: SavingsGoal) -> dict:
    current = sum(c.amount for c in goal.contributions)
    remaining = max(goal.target_amount - current, 0)
    estimated_date = None
    estimated_months = None
    if goal.quota_amount > 0 and remaining > 0:
        periods = math.ceil(remaining / goal.quota_amount)
        days = periods * DAYS_PER_PERIOD.get(goal.frequency.value if hasattr(goal.frequency, "value") else goal.frequency, 30)
        estimated_date = date.today() + timedelta(days=days)
        estimated_months = round(days / 30, 1)
    return {
        "current_amount": current,
        "remaining_amount": remaining,
        "estimated_date": estimated_date,
        "estimated_months": estimated_months,
    }


def _enrich(goal: SavingsGoal) -> GoalOut:
    data = GoalOut.model_validate(goal)
    summary = _compute_summary(goal)
    data.current_amount = summary["current_amount"]
    data.remaining_amount = summary["remaining_amount"]
    data.estimated_date = summary["estimated_date"]
    data.estimated_months = summary["estimated_months"]
    return data


@router.get("", response_model=list[GoalOut])
def list_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goals = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == current_user.id)
        .order_by(SavingsGoal.created_at.desc())
        .all()
    )
    return [_enrich(g) for g in goals]


@router.post("", response_model=GoalOut, status_code=201)
def create_goal(
    data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = SavingsGoal(**data.model_dump(), user_id=current_user.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _enrich(goal)


@router.put("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: int,
    data: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return _enrich(goal)


@router.delete("/{goal_id}", status_code=204)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    db.delete(goal)
    db.commit()


@router.post("/{goal_id}/contributions", response_model=GoalOut, status_code=201)
def add_contribution(
    goal_id: int,
    data: ContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    contribution = GoalContribution(goal_id=goal_id, **data.model_dump())
    db.add(contribution)
    db.commit()
    db.refresh(goal)
    return _enrich(goal)


@router.post("/{goal_id}/achieve", response_model=GoalOut)
def mark_achieved(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    goal.status = WishlistStatus.achieved
    db.commit()
    db.refresh(goal)
    return _enrich(goal)
