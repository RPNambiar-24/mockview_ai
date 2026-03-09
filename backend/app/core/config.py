from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "MockView AI"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/mockview_db"

    SECRET_KEY: str = "change-this-in-production-use-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    GROQ_API_KEY: str = "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"
    GROQ_MODEL: str = "qwen/qwen3-32b"
    WHISPER_MODEL: str = "whisper-large-v3"

    STORAGE_PATH: str = "storage"

    PINECONE_API_KEY: Optional[str] = None
    PINECONE_INDEX: str = "mockview"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
