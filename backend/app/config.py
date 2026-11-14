import os
from dotenv import load_dotenv

load_dotenv()

# Matches only this project's own Vercel preview URLs, for example
# https://kizuki-zu3p-abc123-mohithsa07-byte.vercel.app
DEFAULT_ORIGIN_REGEX = r"^https://kizuki-zu3p(-[a-z0-9-]+)?-mohithsa07-byte\.vercel\.app$"


def _origins() -> list[str]:
    raw = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    return [item.strip().rstrip("/") for item in raw.split(",") if item.strip()]


class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    frontend_origins: list[str] = _origins()
    frontend_origin_regex: str = os.getenv("FRONTEND_ORIGIN_REGEX", DEFAULT_ORIGIN_REGEX)
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")


settings = Settings()