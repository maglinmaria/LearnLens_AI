"""
LearnLens AI – Validation Module
Handles Pydantic request/response schemas and input validation.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ── Enumerations ───────────────────────────────────────────────────────────────

class DiagramType(str, Enum):
    AUTO = "auto"
    FLOWCHART = "flowchart"
    MINDMAP = "mindmap"
    TIMELINE = "timeline"
    CYCLE = "cycle"
    HIERARCHY = "hierarchy"
    COMPARISON = "comparison"
    ANATOMY = "anatomy"
    CIRCUIT = "circuit"
    GRAPH = "graph"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


# ── Request Models ─────────────────────────────────────────────────────────────

class DiagramRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    diagram_type: DiagramType = DiagramType.AUTO
    use_cache: bool = True

    @field_validator("question")
    @classmethod
    def strip_question(cls, v: str) -> str:
        return v.strip()


class ExplainRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)

    @field_validator("question")
    @classmethod
    def strip_question(cls, v: str) -> str:
        return v.strip()


class LensIQRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    svg_content: Optional[str] = Field(None, max_length=100_000)
    explanation: Optional[str] = Field(None, max_length=10_000)


class LensCheckRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    svg_content: Optional[str] = Field(None, max_length=100_000)
    explanation: Optional[str] = Field(None, max_length=10_000)


class QuizRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    explanation: Optional[str] = Field(None, max_length=10_000)
    num_questions: int = Field(default=5, ge=1, le=20)


# ── Response Models ────────────────────────────────────────────────────────────

class DiagramResponse(BaseModel):
    svg: str
    diagram_type: str
    question: str
    cached: bool = False


class ExplainResponse(BaseModel):
    explanation: str
    question: str


class LensIQResponse(BaseModel):
    deep_dive: str
    question: str


class VerificationScore(BaseModel):
    accuracy_score: int = Field(ge=0, le=100)
    completeness_score: int = Field(ge=0, le=100)
    clarity_score: int = Field(ge=0, le=100)
    overall_verdict: str
    strengths: list[str] = []
    issues: list[str] = []
    suggestions: list[str] = []
    verified_facts: list[str] = []
    summary: str


class LensCheckResponse(BaseModel):
    question: str
    verification: VerificationScore


class QuizOption(BaseModel):
    id: int
    question: str
    options: list[str]
    correct_answer: str
    explanation: str
    difficulty: str = "medium"


class QuizResponse(BaseModel):
    question: str
    quiz: list[QuizOption]
    num_questions: int


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    model: str
    gemini_configured: bool


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


# ── DFA Models ─────────────────────────────────────────────────────────────────

class DFAGenerateRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)

    @field_validator("question")
    @classmethod
    def strip_question(cls, v: str) -> str:
        return v.strip()


class DFADefinition(BaseModel):
    """Structured DFA returned by AI, validated by backend."""
    states: list[str]
    alphabet: list[str]
    start_state: str
    accepting_states: list[str]
    transitions: dict[str, dict[str, str]]
    explanation: str = ""


class DFAGenerateResponse(BaseModel):
    dfa: DFADefinition
    question: str


class DFAStructuralError(BaseModel):
    code: str
    message: str


class DFATestResult(BaseModel):
    input_string: str
    expected: bool
    actual: Optional[bool]
    passed: bool
    trace: list[str]
    note: str = ""


class DFAValidateRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    dfa: DFADefinition
    # Optional override of sample tests; if omitted, the built-in suite is used
    sample_tests: Optional[list[dict]] = None


class DFAValidateResponse(BaseModel):
    structural_errors: list[DFAStructuralError]
    test_results: list[DFATestResult]
    is_structurally_valid: bool
    caveat: str


class DFASimulateRequest(BaseModel):
    dfa: DFADefinition
    input_string: str = Field(..., max_length=1000)
    step: int = Field(default=0, ge=0)


class DFASimulateResponse(BaseModel):
    current_state: str
    step: int
    trace: list[str]
    input_string: str
    finished: bool
    accepted: Optional[bool]
    error: Optional[str]


class DFAExtractRequest(BaseModel):
    """Used when extracting a question from an uploaded image."""
    pass  # Image passed as multipart form
