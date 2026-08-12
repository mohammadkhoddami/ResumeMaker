from __future__ import annotations

import logging
import re
from typing import Optional

from jinja2 import Environment, FileSystemLoader, TemplateNotFound
from playwright.async_api import (
    Browser,
    Playwright,
    TimeoutError as PlaywrightTimeoutError,
    async_playwright,
)

from config import settings
from models.cv_document import CVDocument, ThemeConfigRegistry

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------


class PDFGenerationError(Exception):
    """Raised when Playwright fails to produce the PDF."""


class TemplateRenderError(Exception):
    """Raised when Jinja2 template rendering fails."""


# ---------------------------------------------------------------------------
# Browser lifecycle – module-level singleton
# ---------------------------------------------------------------------------

_browser: Optional[Browser] = None
_playwright: Optional[Playwright] = None


async def init_browser() -> None:
    """Launch the headless browser once at application startup."""
    global _browser, _playwright
    if _browser is not None:
        return

    _playwright = await async_playwright().start()
    launcher = getattr(_playwright, settings.PLAYWRIGHT_BROWSER)
    _browser = await launcher.launch(headless=True)
    logger.info(
        "Playwright %s browser started", settings.PLAYWRIGHT_BROWSER
    )


async def close_browser() -> None:
    """Gracefully shut down the browser and Playwright context."""
    global _browser, _playwright
    if _browser is not None:
        await _browser.close()
        _browser = None
    if _playwright is not None:
        await _playwright.stop()
        _playwright = None
    logger.info("Playwright browser closed")


def _get_browser() -> Browser:
    """Return the active browser or raise if not initialised."""
    if _browser is None:
        raise PDFGenerationError(
            "Browser not initialised. Call init_browser() at app startup."
        )
    return _browser


# ---------------------------------------------------------------------------
# Jinja2 environment (lazy singleton)
# ---------------------------------------------------------------------------

_jinja_env: Optional[Environment] = None


def _hex_to_rgba(hex_color: str, alpha: float = 1.0) -> str:
    """Convert a hex color string to a CSS rgba() string.

    Supports 3-digit (#abc) and 6-digit (#aabbcc) hex, with or
    without a leading '#'.
    """
    hex_color = hex_color.lstrip("#")
    if len(hex_color) == 3:
        hex_color = "".join(c * 2 for c in hex_color)
    if len(hex_color) != 6 or not re.fullmatch(r"[0-9a-fA-F]{6}", hex_color):
        raise ValueError(f"Invalid hex color: {hex_color!r}")
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    return f"rgba({r}, {g}, {b}, {alpha})"


def _get_jinja_env() -> Environment:
    global _jinja_env
    if _jinja_env is None:
        _jinja_env = Environment(
            loader=FileSystemLoader(str(settings.TEMPLATES_DIR)),
            autoescape=False,
        )
        _jinja_env.filters["hex_to_rgba"] = _hex_to_rgba
    return _jinja_env


# ---------------------------------------------------------------------------
# Template rendering
# ---------------------------------------------------------------------------


def render_html(document: CVDocument) -> str:
    """Render the CV document into a full HTML string using Jinja2."""
    theme_config = ThemeConfigRegistry.get(document.theme)
    if theme_config is None:
        raise TemplateRenderError(
            f"Unknown theme id: {document.theme!r}. "
            f"Available themes: {list(ThemeConfigRegistry.keys())}"
        )

    env = _get_jinja_env()

    try:
        template = env.get_template("base.html")
    except TemplateNotFound as exc:
        raise TemplateRenderError(
            f"Base template not found in {settings.TEMPLATES_DIR}: {exc}"
        ) from exc

    try:
        html = template.render(
            document=document,
            theme_config=theme_config,
            accent_color=document.accent_color,
        )
    except TemplateNotFound as exc:
        raise TemplateRenderError(
            f"Referenced template not found during render: {exc}"
        ) from exc

    return html


# ---------------------------------------------------------------------------
# PDF generation
# ---------------------------------------------------------------------------

# A4 at 96 dpi → 210 mm ≈ 794 px, 297 mm ≈ 1123 px
_VIEWPORT_WIDTH = 794
_VIEWPORT_HEIGHT = 1123
_PAGE_TIMEOUT_MS = 30_000


async def generate_pdf(
    document: CVDocument, *, debug_screenshot: bool = False
) -> bytes:
    """Generate a PDF from a validated CVDocument and return raw bytes."""
    html = render_html(document)
    browser = _get_browser()

    try:
        context = await browser.new_context(
            base_url=f"http://localhost:{settings.PORT}/",
            viewport={
                "width": _VIEWPORT_WIDTH,
                "height": _VIEWPORT_HEIGHT,
            },
        )
        page = await context.new_page()
    except Exception as exc:
        raise PDFGenerationError(
            f"Failed to open a new browser page: {exc}"
        ) from exc

    try:
        page.set_default_timeout(_PAGE_TIMEOUT_MS)

        await page.set_content(
            html,
            wait_until="load",
        )

        # Wait for all web-fonts to finish loading before capturing
        await page.evaluate("document.fonts.ready")

        # Detect silent font-load failures (404s, network errors)
        failed_fonts: list[str] = await page.evaluate(
            """() => {
                const failed = [];
                for (const font of document.fonts) {
                    if (font.status === 'error' || font.status === 'unloaded') {
                        failed.push(font.family);
                    }
                }
                return failed;
            }"""
        )
        if failed_fonts:
            raise PDFGenerationError(
                "Font loading failed for: " + ", ".join(sorted(set(failed_fonts)))
            )

        # Activate @media print rules before layout
        await page.emulate_media("print")

        if debug_screenshot:
            screenshot_bytes = await page.screenshot(full_page=True)
            logger.info(
                "Debug screenshot captured (%d bytes)", len(screenshot_bytes)
            )

        pdf_bytes = await page.pdf(
            format="A4",
            print_background=True,
            prefer_css_page_size=True,
            margin={
                "top": "0",
                "right": "0",
                "bottom": "0",
                "left": "0",
            },
        )
    except PlaywrightTimeoutError as exc:
        raise PDFGenerationError(
            "Playwright timed out while rendering the PDF. "
            "The template or fonts may be taking too long to load."
        ) from exc
    except Exception as exc:
        raise PDFGenerationError(
            f"PDF generation failed: {exc}"
        ) from exc
    finally:
        await page.close()
        await context.close()

    return pdf_bytes