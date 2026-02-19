from pydantic import BaseModel
from datetime import date as DateType, datetime
from app.models.transaction import TransactionType


class TransactionCreate(BaseModel):
    account_id: int
    category_id: int | None = None
    type: TransactionType
    amount: float
    date: DateType
    description: str = ""


class TransactionUpdate(BaseModel):
    account_id: int | None = None
    category_id: int | None = None
    type: TransactionType | None = None
    amount: float | None = None
    date: DateType | None = None
    description: str | None = None


class TransferCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float
    date: DateType
    description: str = ""


class TransactionOut(BaseModel):
    id: int
    user_id: int
    account_id: int
    category_id: int | None
    type: TransactionType
    amount: float
    date: DateType
    description: str
    transfer_pair_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
