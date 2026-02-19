from datetime import date, datetime
from sqlalchemy import Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class Frequency(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    biweekly = "biweekly"
    monthly = "monthly"
    yearly = "yearly"


class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    account_id: Mapped[int] = mapped_column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categories.id"), nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    frequency: Mapped[Frequency] = mapped_column(Enum(Frequency), nullable=False)
    day_of_charge: Mapped[int] = mapped_column(Integer, nullable=False)
    next_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recurring_expenses")
    account = relationship("Account", back_populates="recurring_expenses")
    category = relationship("Category", back_populates="recurring_expenses")
    payments = relationship("RecurringPayment", back_populates="recurring_expense", cascade="all, delete-orphan")


class RecurringPayment(Base):
    __tablename__ = "recurring_payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recurring_expense_id: Mapped[int] = mapped_column(Integer, ForeignKey("recurring_expenses.id"), nullable=False)
    paid_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)

    recurring_expense = relationship("RecurringExpense", back_populates="payments")
