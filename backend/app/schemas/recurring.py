from pydantic import BaseModel
from datetime import date, datetime
from app.models.recurring import Frequency


class RecurringCreate(BaseModel):
    account_id: int
    category_id: int | None = None
    name: str
    amount: float
    frequency: Frequency
    day_of_charge: int
    next_date: date


class RecurringUpdate(BaseModel):
    account_id: int | None = None
    category_id: int | None = None
    name: str | None = None
    amount: float | None = None
    frequency: Frequency | None = None
    day_of_charge: int | None = None
    next_date: date | None = None
    is_active: bool | None = None


class RecurringOut(BaseModel):
    id: int
    user_id: int
    account_id: int
    category_id: int | None
    name: str
    amount: float
    frequency: Frequency
    day_of_charge: int
    next_date: date
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
