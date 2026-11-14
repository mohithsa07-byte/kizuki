import os
from dotenv import load_dotenv

load_dotenv()


def _origins() -> list[str]:
    raw = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    return [item.strip().rstrip("/") for item in raw.split(",") if item.strip()]


class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    frontend_origins: list[str] = _origins()
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")


settings = Settings()
