"""Development entry-point.

Usage:
    python run.py
"""

import uvicorn

from logging_config import setup_logging

if __name__ == "__main__":
    setup_logging()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )