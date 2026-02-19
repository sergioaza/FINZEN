from pydantic import BaseModel
from datetime import datetime
from app.models.account import AccountType, AccountSubtype


class AccountCreate(BaseModel):
    name: str
    type: AccountType
    account_subtype: AccountSubtype
    balance: float = 0.0
    color: str = "#3B82F6"


class AccountUpdate(BaseModel):
    name: str | None = None
    balance: float | None = None
    color: str | None = None


class AccountOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: AccountType
    account_subtype: AccountSubtype
    balance: float
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}
