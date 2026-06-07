from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

    FRONTEND_URL: str = "http://localhost:5173"

    GEMINI_API_KEY: str = ""   # kept for reference
    GROQ_API_KEY:   str = ""   # used for ARIA chatbot

    class Config:
        env_file = ".env"

settings = Settings()