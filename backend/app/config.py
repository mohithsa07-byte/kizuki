import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")


settings = Settings()
