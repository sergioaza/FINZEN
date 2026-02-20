from datetime import date, datetime
from sqlalchemy import Integer, String, Float, Date, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class WishlistFrequency(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    biweekly = "biweekly"
    monthly = "monthly"


class WishlistStatus(str, enum.Enum):
    active = "active"
    achieved = "achieved"


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    target_amount: Mapped[float] = mapped_column(Float, nullable=False)
    quota_amount: Mapped[float] = mapped_column(Float, default=0.0)
    frequency: Mapped[WishlistFrequency] = mapped_column(Enum(WishlistFrequency), default=WishlistFrequency.monthly)
    description: Mapped[str] = mapped_column(String, default="")
    color: Mapped[str] = mapped_column(String, default="#6366f1")
    status: Mapped[WishlistStatus] = mapped_column(Enum(WishlistStatus), default=WishlistStatus.active)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="savings_goals")
    contributions = relationship("GoalContribution", back_populates="goal", cascade="all, delete-orphan")


class GoalContribution(Base):
    __tablename__ = "goal_contributions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    goal_id: Mapped[int] = mapped_column(Integer, ForeignKey("savings_goals.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str] = mapped_column(String, default="")
    is_quota_payment: Mapped[bool] = mapped_column(Boolean, default=True)

    goal = relationship("SavingsGoal", back_populates="contributions")
