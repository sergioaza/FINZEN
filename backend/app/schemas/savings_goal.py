from pydantic import BaseModel
from datetime import date as DateType, datetime
from typing import Optional
from app.models.savings_goal import WishlistFrequency, WishlistStatus


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    quota_amount: float = 0.0
    frequency: WishlistFrequency = WishlistFrequency.monthly
    description: str = ""
    color: str = "#6366f1"


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    quota_amount: Optional[float] = None
    frequency: Optional[WishlistFrequency] = None
    description: Optional[str] = None
    color: Optional[str] = None
    status: Optional[WishlistStatus] = None


class ContributionCreate(BaseModel):
    amount: float
    date: DateType
    notes: str = ""
    is_quota_payment: bool = True


class ContributionOut(BaseModel):
    id: int
    goal_id: int
    amount: float
    date: DateType
    notes: str
    is_quota_payment: bool

    model_config = {"from_attributes": True}


class GoalOut(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: float
    quota_amount: float
    frequency: WishlistFrequency
    description: str
    color: str
    status: WishlistStatus
    created_at: datetime
    contributions: list[ContributionOut] = []

    # campos calculados
    current_amount: float = 0.0
    remaining_amount: float = 0.0
    estimated_date: Optional[DateType] = None
    estimated_months: Optional[float] = None

    model_config = {"from_attributes": True}
