"""Unit tests for Pydantic CV document models."""

import json

import pytest
from pydantic import ValidationError

from backend.models.cv_document import CVDocument, HeaderSection, SummarySection


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _minimal_header_section() -> dict:
    return {
        "id": "h-1",
        "type": "header",
        "data": {
            "name": "Jane Doe",
            "title": "Engineer",
            "email": "jane@example.com",
            "phone": "+1234567890",
            "location": "NYC",
            "linkedin": "",
            "website": "",
        },
    }


def _minimal_summary_section() -> dict:
    return {"id": "s-1", "type": "summary", "content": "A brief summary."}


def _full_document_dict() -> dict:
    return {
        "sections": [
            _minimal_header_section(),
            _minimal_summary_section(),
        ],
        "theme": "modern",
        "accentColor": "#2563eb",
        "fontSize": 14,
    }


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestValidFullDocument:
    def test_parses_without_error(self):
        doc = CVDocument.model_validate(_full_document_dict())
        assert doc.theme == "modern"
        assert doc.accent_color == "#2563eb"
        assert doc.font_size == 14
        assert len(doc.sections) == 2

    def test_section_types_discriminated(self):
        doc = CVDocument.model_validate(_full_document_dict())
        assert doc.sections[0].type == "header"
        assert doc.sections[1].type == "summary"


class TestMissingRequiredFields:
    def test_section_missing_id_raises(self):
        data = _full_document_dict()
        del data["sections"][0]["id"]
        with pytest.raises(ValidationError) as exc_info:
            CVDocument.model_validate(data)
        assert "id" in str(exc_info.value)

    def test_section_missing_type_raises(self):
        data = _full_document_dict()
        del data["sections"][0]["type"]
        with pytest.raises(ValidationError):
            CVDocument.model_validate(data)


class TestInvalidThemeId:
    def test_unknown_theme_rejected(self):
        data = _full_document_dict()
        data["theme"] = "nonexistent-theme"
        with pytest.raises(ValidationError) as exc_info:
            CVDocument.model_validate(data)
        assert "theme" in str(exc_info.value)

    def test_all_valid_themes_accepted(self):
        for theme in ("modern", "classic", "minimal", "executive"):
            data = _full_document_dict()
            data["theme"] = theme
            doc = CVDocument.model_validate(data)
            assert doc.theme == theme


class TestWrongFontSizeType:
    def test_string_font_size_rejected(self):
        data = _full_document_dict()
        data["fontSize"] = "large"
        with pytest.raises(ValidationError) as exc_info:
            CVDocument.model_validate(data)
        assert "fontSize" in str(exc_info.value) or "font_size" in str(exc_info.value)

    def test_float_font_size_coerced_or_rejected(self):
        data = _full_document_dict()
        data["fontSize"] = 14.5
        # Pydantic v2 coerces float to int if lossless, otherwise rejects
        try:
            doc = CVDocument.model_validate(data)
            assert doc.font_size == 14
        except ValidationError:
            pass  # Also acceptable


class TestEmptySectionsArray:
    def test_empty_sections_valid(self):
        data = _full_document_dict()
        data["sections"] = []
        doc = CVDocument.model_validate(data)
        assert doc.sections == []


class TestRoundTrip:
    def test_serialize_deserialize(self):
        original = CVDocument.model_validate(_full_document_dict())
        json_str = original.model_dump_json(by_alias=True)
        restored = CVDocument.model_validate_json(json_str)

        assert restored.theme == original.theme
        assert restored.accent_color == original.accent_color
        assert restored.font_size == original.font_size
        assert len(restored.sections) == len(original.sections)
        assert restored.sections[0].id == original.sections[0].id
        assert restored.sections[1].content == original.sections[1].content

    def test_dict_round_trip(self):
        original = CVDocument.model_validate(_full_document_dict())
        data = original.model_dump(by_alias=True)
        json_bytes = json.dumps(data).encode()
        restored = CVDocument.model_validate_json(json_bytes)
        assert restored == original