from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    locale: str = "es"
    country: str | None = None
    currency: str = "COP"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    onboarding_done: bool
    email_verified: bool
    locale: str
    country: str | None
    currency: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPreferencesUpdate(BaseModel):
    locale: str | None = None
    country: str | None = None
    currency: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class OnboardingUpdate(BaseModel):
    onboarding_done: bool


class RegisterResponse(BaseModel):
    message: str
    email: str


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
