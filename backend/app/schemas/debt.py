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


class DebtUpdate(BaseModel):
    counterpart_name: str | None = None
    description: str | None = None
    # status eliminado: solo se actualiza a "paid" automáticamente en add_payment


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
    type: DebtType
    date: DateType
    description: str
    status: DebtStatus
    account_id: int | None
    created_at: datetime
    payments: list[DebtPaymentOut] = []

    model_config = {"from_attributes": True}
