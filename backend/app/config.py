from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://finzen:finzen_pass@db:5432/finzen_db"
    secret_key: str = "super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    resend_api_key: str = ""
    frontend_url: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
