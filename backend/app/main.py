from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.database import SessionLocal
from app.limiter import limiter
from app.models.revoked_token import RevokedToken
from app.routers import auth, accounts, categories, transactions, budgets, recurring, debts, dashboard, savings_goals


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        db.query(RevokedToken).filter(RevokedToken.expires_at < datetime.utcnow()).delete()
        db.commit()
    except Exception:
        pass
    finally:
        db.close()
    yield


app = FastAPI(title="FinZen API", version="1.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(categories.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(recurring.router)
app.include_router(debts.router)
app.include_router(savings_goals.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "FinZen API", "docs": "/docs"}


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok"}
