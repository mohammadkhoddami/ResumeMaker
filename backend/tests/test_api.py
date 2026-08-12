"""Integration tests for the FastAPI application endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import app


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