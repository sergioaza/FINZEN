from pydantic import BaseModel
from app.models.category import CategoryType


class CategoryCreate(BaseModel):
    name: str
    type: CategoryType
    color: str = "#6B7280"
    icon: str = "tag"


class CategoryUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    icon: str | None = None


class CategoryOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: CategoryType
    color: str
    icon: str
    is_default: bool

    model_config = {"from_attributes": True}
