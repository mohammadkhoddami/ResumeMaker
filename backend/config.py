from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]
    STATIC_DIR: Path = Path(__file__).resolve().parent / "static"
    FONTS_DIR: Path = Path(__file__).resolve().parent / "static" / "fonts"
    TEMPLATES_DIR: Path = Path(__file__).resolve().parent / "templates"
    PLAYWRIGHT_BROWSER: str = "chromium"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()