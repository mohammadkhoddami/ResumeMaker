import logging
from pathlib import Path

from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]
    STATIC_DIR: Path = Path(__file__).resolve().parent / "static"
    FONTS_DIR: Path = Path(__file__).resolve().parent / "static" / "fonts"
    TEMPLATES_DIR: Path = Path(__file__).resolve().parent / "templates"
    PLAYWRIGHT_BROWSER: str = "chromium"
    LOG_LEVEL: str = "INFO"
    LOG_DIR: Path = Path(__file__).resolve().parent / "logs"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

REQUIRED_FONTS = [
    "Vazirmatn-Regular.woff2",
    "Vazirmatn-Bold.woff2",
]


def validate_fonts() -> None:
    """Ensure required font files exist in FONTS_DIR.

    Logs a warning for every missing file and raises SystemExit(1)
    so that Docker builds fail fast instead of silently falling back
    to system fonts at render time.
    """
    missing = [
        name for name in REQUIRED_FONTS
        if not (settings.FONTS_DIR / name).is_file()
    ]
    if missing:
        for name in missing:
            logger.warning(
                "Required font file missing: %s", settings.FONTS_DIR / name
            )
        raise SystemExit(1)


def check_fonts() -> None:
    """Non-fatal font check for runtime startup.

    Logs a warning for every missing font but does NOT exit,
    allowing the server to start with system-font fallback.
    """
    missing = [
        name for name in REQUIRED_FONTS
        if not (settings.FONTS_DIR / name).is_file()
    ]
    if missing:
        for name in missing:
            logger.warning(
                "Font file missing (will fall back to system fonts): %s",
                settings.FONTS_DIR / name,
            )