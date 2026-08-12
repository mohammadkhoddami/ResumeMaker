"""Centralised logging configuration for the CV export backend."""

from __future__ import annotations

import logging
import logging.handlers
import sys

from config import settings


def setup_logging() -> None:
    """Configure the root logger with console and rotating-file handlers.

    Call **once**, as early as possible (before any code that emits log
    messages).  Safe to call multiple times – existing handlers are cleared
    first to avoid duplicates (useful in test runners).
    """
    settings.LOG_DIR.mkdir(parents=True, exist_ok=True)

    fmt = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    datefmt = "%Y-%m-%d %H:%M:%S"
    formatter = logging.Formatter(fmt, datefmt=datefmt)

    # ── Console (stdout) ───────────────────────────────────────────
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(settings.LOG_LEVEL)
    console.setFormatter(formatter)

    # ── Rotating file  (5 MB per file, keep 5 backups) ────────────
    file_handler = logging.handlers.RotatingFileHandler(
        filename=settings.LOG_DIR / "app.log",
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(settings.LOG_LEVEL)
    file_handler.setFormatter(formatter)

    # ── Root logger ────────────────────────────────────────────────
    root = logging.getLogger()
    root.setLevel(settings.LOG_LEVEL)
    root.handlers.clear()
    root.addHandler(console)
    root.addHandler(file_handler)

    # ── Quieten noisy third-party loggers ──────────────────────────
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("playwright").setLevel(logging.WARNING)