import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.deps import get_db, get_current_user, oauth2_scheme
from app.limiter import limiter
from app.models.revoked_token import RevokedToken
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ResetPasswordRequest,
    Token,
    UserCreate,
    UserOut,
    OnboardingUpdate,
    VerifyEmailRequest,
    UserPreferencesUpdate,
)
from app.utils.audit import log_action
from app.utils.auth import decode_token, hash_password, verify_password, create_token
from app.utils.email import send_reset_email, send_verification_email
from app.utils.seed import seed_categories

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(request: Request, data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    email_enabled = bool(settings.resend_api_key)
    verify_token = secrets.token_urlsafe(32) if email_enabled else None
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        email_verified=not email_enabled,
        email_verify_token=verify_token,
        locale=data.locale,
        country=data.country,
        currency=data.currency,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    seed_categories(db, user.id)

    if email_enabled:
        try:
            send_verification_email(user.email, verify_token)
        except Exception:
            pass

    ip = request.client.host if request.client else None
    log_action(db, "register", user_id=user.id, ip=ip)
    return RegisterResponse(
        message="Cuenta creada. Revisa tu email para verificar tu cuenta.",
        email=user.email,
    )


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    password = data.get("password")
    ip = request.client.host if request.client else None

    user = db.query(User).filter(User.email == email).first()
    if not user:
        log_action(db, "login_failed", ip=ip, details=f"email:{email}")
        raise HTTPException(status_code=401, detail="No existe una cuenta con ese correo")
    if not verify_password(password, user.password_hash):
        log_action(db, "login_failed", user_id=user.id, ip=ip)
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
    if not user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Debes verificar tu email antes de iniciar sesión",
        )

    token = create_token(user.id)
    log_action(db, "login_success", user_id=user.id, ip=ip)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = decode_token(token)
    if payload and payload.get("jti"):
        jti = payload["jti"]
        expires_at = datetime.utcfromtimestamp(payload["exp"])
        db.add(RevokedToken(jti=jti, expires_at=expires_at, revoked_at=datetime.utcnow()))
        db.commit()

    ip = request.client.host if request.client else None
    log_action(db, "logout", user_id=current_user.id, ip=ip)
    return {"message": "Sesión cerrada correctamente"}


@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(request: Request, data: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email_verify_token == data.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    user.email_verified = True
    user.email_verify_token = None
    db.commit()

    ip = request.client.host if request.client else None
    log_action(db, "email_verified", user_id=user.id, ip=ip)
    return {"message": "Email verificado correctamente"}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
@limiter.limit("3/hour")
def resend_verification(
    request: Request, data: ResendVerificationRequest, db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == data.email).first()
    if user and not user.email_verified:
        verify_token = secrets.token_urlsafe(32)
        user.email_verify_token = verify_token
        db.commit()
        try:
            send_verification_email(user.email, verify_token)
        except Exception:
            pass
        ip = request.client.host if request.client else None
        log_action(db, "resend_verification", user_id=user.id, ip=ip)

    return {"message": "Si el email existe y no está verificado, recibirás un correo"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/hour")
def forgot_password(
    request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == data.email).first()
    if user:
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        try:
            send_reset_email(user.email, reset_token)
        except Exception:
            pass
        ip = request.client.host if request.client else None
        log_action(db, "forgot_password_requested", user_id=user.id, ip=ip)

    return {"message": "Si el email existe, recibirás un correo con instrucciones"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(request: Request, data: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=400, detail="La contraseña debe tener al menos 6 caracteres"
        )

    user = db.query(User).filter(User.reset_token == data.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="El enlace ha expirado")

    user.password_hash = hash_password(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    ip = request.client.host if request.client else None
    log_action(db, "password_reset", user_id=user.id, ip=ip)
    return {"message": "Contraseña actualizada correctamente"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me/preferences", response_model=UserOut)
def update_preferences(
    data: UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me/onboarding", response_model=UserOut)
def complete_onboarding(
    data: OnboardingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.onboarding_done = data.onboarding_done
    db.commit()
    db.refresh(current_user)
    return current_user
