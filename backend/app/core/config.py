from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application Settings configured via environment variables.
    """
    PROJECT_NAME: str = "Class Attendance System"
    MONGODB_URL: str = "mongodb://localhost:27017" # Default for local dev
    DATABASE_NAME: str = "attendance_db"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE" # In production, read from .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week

    class Config:
        env_file = ".env"

settings = Settings()
