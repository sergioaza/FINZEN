from datetime import date as DateType, datetime, timezone
from sqlalchemy import Integer, String, Float, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class DebtType(str, enum.Enum):
    owe = "owe"    # yo debo a alguien
    owed = "owed"  # alguien me debe a mí


class DebtStatus(str, enum.Enum):
    active = "active"
    paid = "paid"


class Debt(Base):
    __tablename__ = "debts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    counterpart_name: Mapped[str] = mapped_column(String, nullable=False)
    original_amount: Mapped[float] = mapped_column(Float, nullable=False)
    remaining_amount: Mapped[float] = mapped_column(Float, nullable=False)
    type: Mapped[DebtType] = mapped_column(Enum(DebtType), nullable=False)
    date: Mapped[DateType] = mapped_column(Date, nullable=False)
    description: Mapped[str] = mapped_column(String, default="")
    status: Mapped[DebtStatus] = mapped_column(Enum(DebtStatus), default=DebtStatus.active)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="debts")
    payments = relationship("DebtPayment", back_populates="debt", cascade="all, delete-orphan")


class DebtPayment(Base):
    __tablename__ = "debt_payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    debt_id: Mapped[int] = mapped_column(Integer, ForeignKey("debts.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[DateType] = mapped_column(Date, nullable=False)
    notes: Mapped[str] = mapped_column(String, default="")

    debt = relationship("Debt", back_populates="payments")
