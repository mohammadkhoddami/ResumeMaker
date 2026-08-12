"""Integration tests for the FastAPI application endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import app
from backend.models.cv_document import (
    CertificationItem,
    CertificationsSection,
    CustomSection,
    CVDocument,
    EducationItem,
    EducationSection,
    ExperienceItem,
    ExperienceSection,
    HeaderData,
    HeaderSection,
    LanguageItem,
    LanguagesSection,
    ProjectItem,
    ProjectsSection,
    SkillGroup,
    SkillsSection,
    SummarySection,
)
from backend.services.pdf_generator import render_html


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def minimal_document_payload() -> dict:
    return {
        "sections": [
            {
                "id": "h-1",
                "type": "header",
                "data": {
                    "name": "Test User",
                    "title": "Developer",
                    "email": "test@example.com",
                    "phone": "",
                    "location": "",
                    "linkedin": "",
                    "website": "",
                },
            }
        ],
        "theme": "modern",
        "accentColor": "#2563eb",
        "fontSize": 14,
    }


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------


class TestHealthEndpoint:
    @pytest.mark.asyncio
    async def test_returns_200(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# /api/export/pdf
# ---------------------------------------------------------------------------


class TestExportPdf:
    @pytest.mark.asyncio
    async def test_valid_document_returns_pdf(
        self, client: AsyncClient, minimal_document_payload: dict
    ):
        fake_pdf = b"%PDF-1.4 fake content"

        with patch(
            "backend.main.generate_pdf", new_callable=AsyncMock, return_value=fake_pdf
        ):
            response = await client.post(
                "/api/export/pdf", json=minimal_document_payload
            )

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert response.content == fake_pdf

    @pytest.mark.asyncio
    async def test_malformed_body_returns_422(self, client: AsyncClient):
        bad_payload = {"sections": "not-a-list", "theme": 123}
        response = await client.post("/api/export/pdf", json=bad_payload)

        assert response.status_code == 422
        body = response.json()
        assert "errors" in body
        assert len(body["errors"]) > 0
        # Each error should have field, message, type keys
        for err in body["errors"]:
            assert "field" in err
            assert "message" in err
            assert "type" in err

    @pytest.mark.asyncio
    async def test_missing_body_returns_422(self, client: AsyncClient):
        response = await client.post(
            "/api/export/pdf",
            content=b"",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# CORS preflight
# ---------------------------------------------------------------------------


class TestCorsPreflight:
    @pytest.mark.asyncio
    async def test_options_returns_allow_origin(self, client: AsyncClient):
        response = await client.options(
            "/api/export/pdf",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        assert response.status_code == 200
        assert (
            response.headers["access-control-allow-origin"] == "http://localhost:5173"
        )

    @pytest.mark.asyncio
    async def test_disallowed_origin_not_reflected(self, client: AsyncClient):
        response = await client.options(
            "/api/export/pdf",
            headers={
                "Origin": "http://evil.com",
                "Access-Control-Request-Method": "POST",
            },
        )
        # FastAPI CORSMiddleware should not reflect disallowed origins
        allow_origin = response.headers.get("access-control-allow-origin", "")
        assert allow_origin != "http://evil.com"


# ---------------------------------------------------------------------------
# PDF Visual Regression
# ---------------------------------------------------------------------------


class TestPdfVisualRegression:
    """Verify the HTML rendering pipeline produces correct CSS and structure."""

    @pytest.fixture
    def full_document(self) -> CVDocument:
        return CVDocument(
            sections=[
                HeaderSection(
                    id="h-1",
                    data=HeaderData(
                        name="Test User",
                        title="Senior Software Engineer",
                        email="test@example.com",
                        phone="+98-21-12345678",
                        location="Tehran, Iran",
                        linkedin="linkedin.com/in/testuser",
                        website="testuser.dev",
                    ),
                ),
                SummarySection(
                    id="s-1",
                    content="Experienced engineer with 8 years in backend development.",
                ),
                ExperienceSection(
                    id="e-1",
                    items=[
                        ExperienceItem(
                            id="exp-1",
                            company="Tech Corp",
                            role="Senior Developer",
                            period="2020 - Present",
                            location="Tehran",
                            bullets=[
                                "Led a team of 5 engineers",
                                "Designed and shipped REST APIs",
                            ],
                        ),
                        ExperienceItem(
                            id="exp-2",
                            company="Startup Inc",
                            role="Junior Developer",
                            period="2018 - 2020",
                            location="Tehran",
                            bullets=["Fixed critical production bugs"],
                        ),
                    ],
                ),
                EducationSection(
                    id="edu-1",
                    items=[
                        EducationItem(
                            id="ed-1",
                            institution="Sharif University",
                            degree="BSc Computer Science",
                            period="2014 - 2018",
                            gpa="3.8",
                        ),
                    ],
                ),
                SkillsSection(
                    id="sk-1",
                    groups=[
                        SkillGroup(
                            id="sg-1",
                            label="Frontend",
                            items="React, TypeScript, Tailwind",
                        ),
                        SkillGroup(
                            id="sg-2",
                            label="Backend",
                            items="Python, FastAPI, PostgreSQL",
                        ),
                    ],
                ),
                ProjectsSection(
                    id="p-1",
                    items=[
                        ProjectItem(
                            id="pr-1",
                            name="OpenCV Toolkit",
                            link="https://github.com/testuser/opencv-toolkit",
                            description="Image processing library",
                            tech=["Python", "Docker", "CI/CD"],
                        ),
                    ],
                ),
                CertificationsSection(
                    id="c-1",
                    items=[
                        CertificationItem(
                            id="cert-1",
                            name="AWS Solutions Architect",
                            issuer="Amazon",
                            date="2023",
                        ),
                    ],
                ),
                LanguagesSection(
                    id="l-1",
                    items=[
                        LanguageItem(id="lang-1", name="English", level="Fluent"),
                        LanguageItem(id="lang-2", name="Persian", level="Native"),
                    ],
                ),
                CustomSection(
                    id="cu-1",
                    content="Open-source contributor and tech speaker.",
                ),
            ],
            theme="modern",
            accent_color="#2563eb",
            font_size=14,
        )

    def test_render_html_contains_required_css_properties(
        self, full_document: CVDocument
    ):
        html = render_html(full_document)

        # hex_to_rgba tinted background (not raw accent as solid bg)
        # #2563eb -> rgba(37, 99, 235, 0.1)
        assert "rgba(37, 99, 235, 0.1)" in html
        # Ensure the header background is NOT the raw solid accent color
        assert "background: #2563eb;" not in html

        # Print color fidelity
        assert "print-color-adjust: exact" in html

        # Page setup
        assert "size: A4" in html
        assert "margin: 0" in html

        # Flex column layout on the preview container
        assert "display: flex" in html
        assert "flex-direction: column" in html

        # Section break control
        assert "break-inside: avoid" in html
        assert "page-break-inside: avoid" in html

    def test_render_html_all_themes(self, full_document: CVDocument):
        theme_expected_classes: dict[str, list[str]] = {
            "modern": [".cv-header-banner", ".section-title"],
            "classic": [".cv-header-centered", ".section-title"],
            "minimal": [".cv-header-compact", ".section-title"],
            "executive": [
                ".cv-header-sidebar",
                ".section-title-bar",
                ".section-title-wrapper",
            ],
        }

        for theme_id, expected_classes in theme_expected_classes.items():
            doc = full_document.model_copy(update={"theme": theme_id})
            html = render_html(doc)

            for cls in expected_classes:
                assert cls in html, (
                    f"Theme '{theme_id}' missing expected CSS class '{cls}'"
                )

    def test_modern_theme_uses_hex_to_rgba_for_header_background(
        self, full_document: CVDocument
    ):
        html = render_html(full_document)

        # The modern theme header must use the rgba tint, not raw hex
        assert "rgba(37, 99, 235, 0.1)" in html
        # The border-top still uses the solid accent color
        assert "border-top: 6px solid #2563eb" in html