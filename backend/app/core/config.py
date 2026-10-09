import os
from typing import List
try:
    from pydantic_settings import BaseSettings
except ImportError:
    class BaseSettings:
        pass

class Settings(BaseSettings):
    PROJECT_NAME: str = "CARE/ROUTE"
    API_V1_STR: str = "/api/v1"
    API_ENV: str = os.getenv("API_ENV", "development")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "care_route_default_secure_secret_key_change_me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://careroute_user:careroute_password@localhost:5432/careroute_db"
    )
    TEST_DATABASE_URL: str = os.getenv(
        "TEST_DATABASE_URL", 
        "postgresql+asyncpg://careroute_user:careroute_password@localhost:5432/careroute_test_db"
    )
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]
    
    RESOURCE_STALE_AFTER_MINUTES: int = int(os.getenv("RESOURCE_STALE_AFTER_MINUTES", "10"))
    ALLOW_DEMO_SEED: bool = os.getenv("ALLOW_DEMO_SEED", "true").lower() in ("true", "1")
    DEMO_SEED_RANDOM_SEED: int = int(os.getenv("DEMO_SEED_RANDOM_SEED", "42"))
    
    # Matching Engine Prototype Weights (Explainable rule weights)
    WEIGHT_DISTANCE: float = 0.35
    WEIGHT_CAPABILITY_SURPLUS: float = 0.25
    WEIGHT_SPECIALIST: float = 0.20
    WEIGHT_RESOURCE_FRESHNESS: float = 0.20

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
