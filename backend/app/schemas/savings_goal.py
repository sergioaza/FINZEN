from pydantic import BaseModel
from datetime import date as DateType, datetime
from app.models.savings_goal import GoalStatus


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    target_date: DateType | None = None
    description: str = ""
    color: str = "#6366f1"


class GoalUpdate(BaseModel):
    name: str | None = None
    target_amount: float | None = None
    target_date: DateType | None = None
    description: str | None = None
    color: str | None = None
    status: GoalStatus | None = None


class ContributionCreate(BaseModel):
    amount: float
    date: DateType
    notes: str = ""


class ContributionOut(BaseModel):
    id: int
    goal_id: int
    amount: float
    date: DateType
    notes: str

    model_config = {"from_attributes": True}


class GoalOut(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: float
    current_amount: float
    target_date: DateType | None
    description: str
    color: str
    status: GoalStatus
    created_at: datetime
    contributions: list[ContributionOut] = []

    model_config = {"from_attributes": True}
