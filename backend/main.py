"""
LearnLens AI – FastAPI Application
Main entry point for the backend API.
"""

from __future__ import annotations

import base64
import logging
import sys
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_settings
from diagram_generator import DIAGRAM_TYPES, DiagramGenerator
from gemma_service import GemmaService, get_gemma_service
from dfa_engine import (
    DFAData,
    DFA_001_SAMPLE_TESTS,
    validate_dfa,
    run_sample_tests,
    simulator_step,
)
from validation import (
    DiagramRequest,
    DiagramResponse,
    ErrorResponse,
    ExplainRequest,
    ExplainResponse,
    HealthResponse,
    LensCheckRequest,
    LensCheckResponse,
    LensIQRequest,
    LensIQResponse,
    QuizRequest,
    QuizResponse,
    VerificationScore,
    QuizOption,
    DFAGenerateResponse,
    DFADefinition,
    DFAValidateRequest,
    DFAValidateResponse,
    DFAStructuralError,
    DFATestResult,
    DFASimulateRequest,
    DFASimulateResponse,
)

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# ── App state ─────────────────────────────────────────────────────────────────
_gemma: Optional[GemmaService] = None
_diagram_gen: Optional[DiagramGenerator] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise services on startup."""
    global _gemma, _diagram_gen
    settings = get_settings()
    logger.info("Starting %s v%s", settings.app_name, settings.app_version)
    logger.info("Config: %s", settings.safe_repr())

    try:
        _gemma = get_gemma_service()
        _diagram_gen = DiagramGenerator(_gemma)
        logger.info("All services initialised successfully.")
    except ValueError as exc:
        logger.error("Service initialisation failed: %s", exc)
        # App still starts so health endpoint returns useful error
        _gemma = None
        _diagram_gen = None

    yield

    logger.info("Shutting down LearnLens AI backend.")


# ── FastAPI app ────────────────────────────────────────────────────────────────
settings = get_settings()

app = FastAPI(
    title="LearnLens AI API",
    description="Backend API for the LearnLens AI educational platform.",
    version=settings.app_version,
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Dependency helpers ─────────────────────────────────────────────────────────

def _require_gemma() -> GemmaService:
    if _gemma is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not available. Check that GEMINI_API_KEY is set correctly.",
        )
    return _gemma


def _require_diagram_gen() -> DiagramGenerator:
    if _diagram_gen is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Diagram service is not available. Check that GEMINI_API_KEY is set correctly.",
        )
    return _diagram_gen


async def _read_upload(file: Optional[UploadFile]) -> tuple[Optional[bytes], str]:
    """Read an optional uploaded file and return (bytes, mime_type)."""
    if file is None or file.filename == "":
        return None, "image/png"
    content = await file.read()
    mime = file.content_type or "image/png"
    return content, mime


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Returns the service health and configuration status."""
    cfg = get_settings()
    return HealthResponse(
        status="ok" if _gemma is not None else "degraded",
        app_name=cfg.app_name,
        version=cfg.app_version,
        model=cfg.gemma_model,
        gemini_configured=bool(cfg.gemini_api_key),
    )


@app.get("/diagram-types", tags=["Diagrams"])
async def list_diagram_types():
    """Returns all supported diagram types."""
    return {"diagram_types": DIAGRAM_TYPES}


@app.post("/generate-diagram", response_model=DiagramResponse, tags=["Diagrams"])
async def generate_diagram(
    question: str = Form(...),
    diagram_type: str = Form("auto"),
    use_cache: bool = Form(True),
    image: Optional[UploadFile] = File(None),
):
    """
    Generate an SVG diagram for the given question.
    Optionally accepts an uploaded image for context.
    """
    gen = _require_diagram_gen()
    image_bytes, image_mime = await _read_upload(image)

    try:
        result = await gen.generate(
            question=question,
            diagram_type=diagram_type,
            image_bytes=image_bytes,
            image_mime=image_mime,
            use_cache=use_cache,
        )
    except Exception as exc:
        logger.exception("Error generating diagram: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    return DiagramResponse(**result)


@app.post("/explain", response_model=ExplainResponse, tags=["Explain"])
async def explain_material(
    question: str = Form(...),
    image: Optional[UploadFile] = File(None),
):
    """
    Explain study material. Accepts an optional image of study material.
    """
    svc = _require_gemma()
    image_bytes, image_mime = await _read_upload(image)

    try:
        explanation = await svc.explain_material(
            question=question,
            image_bytes=image_bytes,
            image_mime=image_mime,
        )
    except Exception as exc:
        logger.exception("Error explaining material: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    return ExplainResponse(explanation=explanation, question=question)


@app.post("/lens-iq", response_model=LensIQResponse, tags=["LensIQ"])
async def lens_iq(req: LensIQRequest):
    """
    LensIQ: Deep interactive learning dive into a topic.
    """
    svc = _require_gemma()

    try:
        deep_dive = await svc.lens_iq(
            question=req.question,
            svg_content=req.svg_content,
            explanation=req.explanation,
        )
    except Exception as exc:
        logger.exception("Error in LensIQ: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    return LensIQResponse(deep_dive=deep_dive, question=req.question)


@app.post("/lens-check", response_model=LensCheckResponse, tags=["LensCheck"])
async def lens_check(req: LensCheckRequest):
    """
    LensCheck: Verify academic accuracy of diagram and explanation.
    """
    svc = _require_gemma()

    try:
        result = await svc.lens_check(
            question=req.question,
            svg_content=req.svg_content,
            explanation=req.explanation,
        )
    except Exception as exc:
        logger.exception("Error in LensCheck: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    # Provide safe defaults if parsing failed
    verification_data = {
        "accuracy_score": result.get("accuracy_score", 0),
        "completeness_score": result.get("completeness_score", 0),
        "clarity_score": result.get("clarity_score", 0),
        "overall_verdict": result.get("overall_verdict", "Unknown"),
        "strengths": result.get("strengths", []),
        "issues": result.get("issues", []),
        "suggestions": result.get("suggestions", []),
        "verified_facts": result.get("verified_facts", []),
        "summary": result.get("summary", "Verification could not be completed."),
    }

    return LensCheckResponse(
        question=req.question,
        verification=VerificationScore(**verification_data),
    )


@app.post("/quiz", response_model=QuizResponse, tags=["Quiz"])
async def generate_quiz(req: QuizRequest):
    """
    Generate a multiple-choice quiz for the current learning session.
    """
    svc = _require_gemma()

    try:
        questions = await svc.generate_quiz(
            question=req.question,
            explanation=req.explanation,
            num_questions=req.num_questions,
        )
    except Exception as exc:
        logger.exception("Error generating quiz: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    quiz_items = []
    for i, q in enumerate(questions):
        quiz_items.append(
            QuizOption(
                id=q.get("id", i + 1),
                question=q.get("question", ""),
                options=q.get("options", []),
                correct_answer=q.get("correct_answer", "A"),
                explanation=q.get("explanation", ""),
                difficulty=q.get("difficulty", "medium"),
            )
        )

    return QuizResponse(
        question=req.question,
        quiz=quiz_items,
        num_questions=len(quiz_items),
    )


# ── DFA Routes ─────────────────────────────────────────────────────────────────

@app.post("/dfa/generate", response_model=DFAGenerateResponse, tags=["DFA"])
async def dfa_generate(
    question: str = Form(...),
    image: Optional[UploadFile] = File(None),
):
    """
    Generate a structured DFA from a natural-language question.
    Uses the AI model to produce states, alphabet, transitions, etc.
    Returns structured JSON – never a fake/hardcoded result.
    """
    svc = _require_gemma()
    image_bytes, image_mime = await _read_upload(image)

    try:
        raw = await svc.generate_dfa(
            question=question,
            image_bytes=image_bytes,
            image_mime=image_mime,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"AI response could not be parsed as a valid DFA: {exc}",
        )
    except Exception as exc:
        logger.exception("Error generating DFA: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    try:
        dfa_def = DFADefinition(**raw)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"DFA structure validation failed: {exc}",
        )

    return DFAGenerateResponse(dfa=dfa_def, question=question)


@app.post("/dfa/validate", response_model=DFAValidateResponse, tags=["DFA"])
async def dfa_validate(req: DFAValidateRequest):
    """
    Deterministically validate a DFA and run sample tests.
    No AI involved – pure algorithmic checks.
    """
    dfa = DFAData.from_dict(req.dfa.model_dump())

    # Run structural checks
    errors = validate_dfa(dfa)
    is_valid = len(errors) == 0

    # Choose test suite
    tests = req.sample_tests if req.sample_tests else DFA_001_SAMPLE_TESTS
    test_results = run_sample_tests(dfa, tests)

    return DFAValidateResponse(
        structural_errors=[
            DFAStructuralError(code=e.code, message=e.message) for e in errors
        ],
        test_results=[
            DFATestResult(
                input_string=r.input_string,
                expected=r.expected,
                actual=r.actual,
                passed=r.passed,
                trace=r.trace,
                note=r.note,
            )
            for r in test_results
        ],
        is_structurally_valid=is_valid,
        caveat=(
            "Sample tests do not prove formal language equivalence. "
            "They only verify the DFA's behaviour on specific strings."
        ),
    )


@app.post("/dfa/simulate", response_model=DFASimulateResponse, tags=["DFA"])
async def dfa_simulate(req: DFASimulateRequest):
    """
    Step-by-step DFA simulation.
    Returns the DFA state after processing `step` symbols from input_string.
    """
    dfa = DFAData.from_dict(req.dfa.model_dump())
    result = simulator_step(dfa, req.input_string, req.step)

    return DFASimulateResponse(
        current_state=result.current_state,
        step=result.step,
        trace=result.trace,
        input_string=result.input_string,
        finished=result.finished,
        accepted=result.accepted,
        error=result.error,
    )


@app.post("/dfa/extract-question", tags=["DFA"])
async def dfa_extract_question(
    image: UploadFile = File(...),
):
    """
    Extract a DFA question from an uploaded image using the AI model's
    vision capability. Returns the extracted question for student confirmation.
    If image understanding is unavailable or fails, returns a clear error.
    """
    svc = _require_gemma()
    content = await image.read()
    mime = image.content_type or "image/png"

    if not content:
        raise HTTPException(status_code=400, detail="Empty image file uploaded.")

    try:
        question = await svc.extract_question_from_image(
            image_bytes=content,
            image_mime=mime,
        )
        return {"question": question.strip()}
    except Exception as exc:
        logger.exception("Error extracting question from image: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=(
                f"Image question extraction failed: {exc}. "
                "The configured model may not support image input, "
                "or the image could not be read. Please type your question manually."
            ),
        )


# ── Global error handler ──────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True,
        log_level="info",
    )
