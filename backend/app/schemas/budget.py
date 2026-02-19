from pydantic import BaseModel
from app.schemas.category import CategoryOut


class BudgetCreate(BaseModel):
    category_id: int
    month: int
    year: int
    limit_amount: float


class BudgetUpdate(BaseModel):
    limit_amount: float


class BudgetOut(BaseModel):
    id: int
    user_id: int
    category_id: int
    month: int
    year: int
    limit_amount: float
    spent: float = 0.0
    category: CategoryOut | None = None

    model_config = {"from_attributes": True}
