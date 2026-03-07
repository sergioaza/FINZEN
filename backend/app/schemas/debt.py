from pydantic import BaseModel
from datetime import date as DateType, datetime
from app.models.debt import DebtType, DebtStatus


class DebtCreate(BaseModel):
    counterpart_name: str
    original_amount: float
    type: DebtType
    date: DateType
    description: str = ""
    account_id: int | None = None  # solo para type="owed" cuando ya se prestó el dinero
    interest_rate: float | None = None
    estimated_end_date: DateType | None = None


class DebtUpdate(BaseModel):
    counterpart_name: str | None = None
    description: str | None = None
    interest_rate: float | None = None
    estimated_end_date: DateType | None = None


class DebtPaymentCreate(BaseModel):
    amount: float
    date: DateType
    notes: str = ""
    account_id: int


class DebtPaymentOut(BaseModel):
    id: int
    debt_id: int
    amount: float
    date: DateType
    notes: str

    model_config = {"from_attributes": True}


class DebtOut(BaseModel):
    id: int
    user_id: int
    counterpart_name: str
    original_amount: float
    remaining_amount: float
    projected_balance: float
    type: DebtType
    date: DateType
    description: str
    status: DebtStatus
    account_id: int | None
    interest_rate: float | None
    estimated_end_date: DateType | None
    created_at: datetime
    payments: list[DebtPaymentOut] = []

    model_config = {"from_attributes": True}
