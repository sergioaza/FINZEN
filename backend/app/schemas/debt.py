from pydantic import BaseModel
from datetime import date, datetime
from app.models.debt import DebtType, DebtStatus


class DebtCreate(BaseModel):
    counterpart_name: str
    original_amount: float
    type: DebtType
    date: date
    description: str = ""


class DebtUpdate(BaseModel):
    counterpart_name: str | None = None
    description: str | None = None
    status: DebtStatus | None = None


class DebtPaymentCreate(BaseModel):
    amount: float
    date: date
    notes: str = ""
    account_id: int


class DebtPaymentOut(BaseModel):
    id: int
    debt_id: int
    amount: float
    date: date
    notes: str

    model_config = {"from_attributes": True}


class DebtOut(BaseModel):
    id: int
    user_id: int
    counterpart_name: str
    original_amount: float
    remaining_amount: float
    type: DebtType
    date: date
    description: str
    status: DebtStatus
    created_at: datetime
    payments: list[DebtPaymentOut] = []

    model_config = {"from_attributes": True}
