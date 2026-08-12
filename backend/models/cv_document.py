from __future__ import annotations

from typing import Annotated, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

# ---------------------------------------------------------------------------
# Literal type aliases
# ---------------------------------------------------------------------------

ThemeId = Literal["modern", "classic", "minimal", "executive"]
HeaderLayout = Literal["banner", "centered", "sidebar-accent", "compact"]
SectionTitleStyle = Literal["underlined", "boxed", "side-bar", "uppercase-plain"]
ItemCardStyle = Literal["bordered", "flat", "dotted-separator", "shadowed"]

# ---------------------------------------------------------------------------
# Base model with camelCase alias support
# ---------------------------------------------------------------------------


class _Base(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


# ---------------------------------------------------------------------------
# Section data models
# ---------------------------------------------------------------------------


class HeaderData(_Base):
    name: str = ""
    title: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    website: str = ""


class HeaderSection(_Base):
    id: str
    type: Literal["header"] = "header"
    data: HeaderData = Field(default_factory=HeaderData)


class SummarySection(_Base):
    id: str
    type: Literal["summary"] = "summary"
    content: str = ""


class ExperienceItem(_Base):
    id: str
    company: str = ""
    role: str = ""
    period: str = ""
    location: str = ""
    bullets: list[str] = Field(default_factory=lambda: [""])


class ExperienceSection(_Base):
    id: str
    type: Literal["experience"] = "experience"
    items: list[ExperienceItem] = Field(default_factory=list)


class EducationItem(_Base):
    id: str
    institution: str = ""
    degree: str = ""
    period: str = ""
    gpa: str = ""


class EducationSection(_Base):
    id: str
    type: Literal["education"] = "education"
    items: list[EducationItem] = Field(default_factory=list)


class SkillGroup(_Base):
    id: str
    label: str = ""
    items: str = ""


class SkillsSection(_Base):
    id: str
    type: Literal["skills"] = "skills"
    groups: list[SkillGroup] = Field(default_factory=list)


class ProjectItem(_Base):
    id: str
    name: str = ""
    link: str = ""
    description: str = ""
    tech: list[str] = Field(default_factory=list)


class ProjectsSection(_Base):
    id: str
    type: Literal["projects"] = "projects"
    items: list[ProjectItem] = Field(default_factory=list)


class CertificationItem(_Base):
    id: str
    name: str = ""
    issuer: str = ""
    date: str = ""


class CertificationsSection(_Base):
    id: str
    type: Literal["certifications"] = "certifications"
    items: list[CertificationItem] = Field(default_factory=list)


class LanguageItem(_Base):
    id: str
    name: str = ""
    level: str = ""


class LanguagesSection(_Base):
    id: str
    type: Literal["languages"] = "languages"
    items: list[LanguageItem] = Field(default_factory=list)


class CustomSection(_Base):
    id: str
    type: Literal["custom"] = "custom"
    content: str = ""


# ---------------------------------------------------------------------------
# Discriminated union
# ---------------------------------------------------------------------------

CVSection = Annotated[
    Union[
        HeaderSection,
        SummarySection,
        ExperienceSection,
        EducationSection,
        SkillsSection,
        ProjectsSection,
        CertificationsSection,
        LanguagesSection,
        CustomSection,
    ],
    Field(discriminator="type"),
]

# ---------------------------------------------------------------------------
# Theme configuration
# ---------------------------------------------------------------------------


class ThemeSpacing(_Base):
    section_gap: int = 24
    item_gap: int = 12


class ThemeColors(_Base):
    primary: str = "#2563eb"
    secondary: str = "#64748b"
    background: str = "#ffffff"
    text: str = "#1e293b"


class ThemeConfig(_Base):
    id: ThemeId
    name: str
    font_family: str
    heading_font: str
    spacing: ThemeSpacing
    colors: ThemeColors
    header_background: Optional[str] = None
    header_layout: HeaderLayout
    section_title_style: SectionTitleStyle
    item_card_style: ItemCardStyle


# ---------------------------------------------------------------------------
# Top-level document
# ---------------------------------------------------------------------------


class CVDocument(_Base):
    sections: list[CVSection] = Field(default_factory=list)
    theme: ThemeId = "modern"
    accent_color: str = "#2563eb"
    font_size: int = 14


# ---------------------------------------------------------------------------
# Theme registry – mirrors THEMES from src/utils/defaults.ts
# ---------------------------------------------------------------------------

ThemeConfigRegistry: dict[ThemeId, ThemeConfig] = {
    "modern": ThemeConfig(
        id="modern",
        name="مدرن",
        font_family="Inter, sans-serif",
        heading_font="Inter, sans-serif",
        spacing=ThemeSpacing(section_gap=24, item_gap=12),
        colors=ThemeColors(
            primary="#2563eb",
            secondary="#64748b",
            background="#ffffff",
            text="#1e293b",
        ),
        header_background=None,
        header_layout="banner",
        section_title_style="underlined",
        item_card_style="bordered",
    ),
    "classic": ThemeConfig(
        id="classic",
        name="کلاسیک",
        font_family="Georgia, serif",
        heading_font="Georgia, serif",
        spacing=ThemeSpacing(section_gap=28, item_gap=14),
        colors=ThemeColors(
            primary="#1f2937",
            secondary="#6b7280",
            background="#ffffff",
            text="#111827",
        ),
        header_background=None,
        header_layout="centered",
        section_title_style="boxed",
        item_card_style="flat",
    ),
    "minimal": ThemeConfig(
        id="minimal",
        name="مینیمال",
        font_family="Helvetica, Arial, sans-serif",
        heading_font="Helvetica, Arial, sans-serif",
        spacing=ThemeSpacing(section_gap=20, item_gap=10),
        colors=ThemeColors(
            primary="#18181b",
            secondary="#71717a",
            background="#ffffff",
            text="#27272a",
        ),
        header_background=None,
        header_layout="compact",
        section_title_style="uppercase-plain",
        item_card_style="dotted-separator",
    ),
    "executive": ThemeConfig(
        id="executive",
        name="اجرایی",
        font_family="Merriweather, serif",
        heading_font="Merriweather, serif",
        spacing=ThemeSpacing(section_gap=32, item_gap=16),
        colors=ThemeColors(
            primary="#1e3a5f",
            secondary="#4a5568",
            background="#fefefe",
            text="#1a202c",
        ),
        header_background=None,
        header_layout="sidebar-accent",
        section_title_style="side-bar",
        item_card_style="shadowed",
    ),
}