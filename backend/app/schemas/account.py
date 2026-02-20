from pydantic import BaseModel
from datetime import datetime
from app.models.account import AccountType, AccountSubtype


class AccountCreate(BaseModel):
    name: str
    type: AccountType
    account_subtype: AccountSubtype
    balance: float = 0.0
    color: str = "#3B82F6"
    credit_limit: float | None = None


class AccountUpdate(BaseModel):
    name: str | None = None
    balance: float | None = None
    color: str | None = None
    credit_limit: float | None = None


class AccountOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: AccountType
    account_subtype: AccountSubtype
    balance: float
    credit_limit: float | None
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}
