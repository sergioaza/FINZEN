from datetime import datetime
from sqlalchemy import Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class AccountType(str, enum.Enum):
    debit = "debit"
    credit = "credit"


class AccountSubtype(str, enum.Enum):
    cash = "cash"
    savings = "savings"
    checking = "checking"
    digital = "digital"
    credit_card = "credit_card"


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[AccountType] = mapped_column(Enum(AccountType), nullable=False)
    account_subtype: Mapped[AccountSubtype] = mapped_column(Enum(AccountSubtype), nullable=False)
    balance: Mapped[float] = mapped_column(Float, default=0.0)
    credit_limit: Mapped[float | None] = mapped_column(Float, nullable=True)
    color: Mapped[str] = mapped_column(String, default="#3B82F6")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")
    recurring_expenses = relationship("RecurringExpense", back_populates="account")
