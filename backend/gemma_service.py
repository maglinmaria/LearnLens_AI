"""
LearnLens AI – Gemma 4 Service
Thin wrapper around the Google Gen AI Python SDK.
Only this module is allowed to instantiate the Gemini client.
"""

from __future__ import annotations

import asyncio
import base64
import logging
from typing import Optional

from google import genai
from google.genai import types as genai_types
from google.genai import errors as genai_errors

from config import get_settings

logger = logging.getLogger(__name__)


class GemmaService:
    """Manages a single shared Gemini/Gemma client instance."""

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.gemini_api_key:
            raise ValueError(
                "GEMINI_API_KEY is not set. "
                "Copy .env.example → .env and add your key."
            )
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._model = settings.gemma_model
        self._dfa_cache: dict[str, dict] = {}  # Cache for common DFA questions
        self._prepopulate_dfa_cache()
        logger.info("GemmaService initialised with model=%s", self._model)

    def _prepopulate_dfa_cache(self) -> None:
        """Pre-populate cache with common DFA examples for instant response."""
        self._dfa_cache["construct a dfa that accepts binary strings containing 001"] = {
            "states": ["q0", "q1", "q2", "q3"],
            "alphabet": ["0", "1"],
            "start_state": "q0",
            "accepting_states": ["q3"],
            "transitions": {
                "q0": {"0": "q1", "1": "q0"},
                "q1": {"0": "q2", "1": "q0"},
                "q2": {"0": "q3", "1": "q0"},
                "q3": {"0": "q3", "1": "q3"}
            },
            "explanation": "This DFA tracks the pattern '001'. States q0, q1, q2 represent partial matches (0, 00), and q3 is the accepting state where '001' has been found. Once in q3, all inputs keep it in q3."
        }
        self._dfa_cache["design a dfa that accepts binary strings ending in 1"] = {
            "states": ["q0", "q1"],
            "alphabet": ["0", "1"],
            "start_state": "q0",
            "accepting_states": ["q1"],
            "transitions": {
                "q0": {"0": "q0", "1": "q1"},
                "q1": {"0": "q0", "1": "q1"}
            },
            "explanation": "State q0 is for strings ending in 0 (or empty), state q1 is for strings ending in 1. q1 is accepting. The DFA transitions between these based on the last symbol."
        }
        self._dfa_cache["build a dfa over {0,1} that accepts strings with an even number of 0s"] = {
            "states": ["q0", "q1"],
            "alphabet": ["0", "1"],
            "start_state": "q0",
            "accepting_states": ["q0"],
            "transitions": {
                "q0": {"0": "q1", "1": "q0"},
                "q1": {"0": "q0", "1": "q1"}
            },
            "explanation": "State q0 tracks even number of 0s (including zero), q1 tracks odd number of 0s. Reading 0 toggles between states, reading 1 stays in the same state. q0 is accepting."
        }

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _build_parts(
        self,
        prompt: str,
        image_bytes: Optional[bytes] = None,
        image_mime: str = "image/png",
    ) -> list:
        parts: list = [genai_types.Part.from_text(text=prompt)]
        if image_bytes:
            parts.insert(
                0,
                genai_types.Part.from_bytes(data=image_bytes, mime_type=image_mime),
            )
        return parts

    # ── Retry constants ───────────────────────────────────────────────────────
    _MAX_RETRIES = 2
    _RETRY_DELAYS = [1, 2]  # seconds between attempts (reduced for faster response)
    _API_TIMEOUT = 60  # seconds - fail fast if API is slow

    async def _generate(
        self,
        prompt: str,
        image_bytes: Optional[bytes] = None,
        image_mime: str = "image/png",
        temperature: float = 0.7,
        max_output_tokens: int = 4096,
    ) -> str:
        """Low-level call to Gemma with automatic retry on transient 500 errors.

        gemma-4-26b-a4b-it is a thinking model that burns tokens on internal
        reasoning before emitting output.  max_output_tokens must be large
        enough to cover both thinking tokens and the final answer.
        Retries up to _MAX_RETRIES times on ServerError (500 INTERNAL).
        """
        parts = self._build_parts(prompt, image_bytes, image_mime)
        config = genai_types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )

        last_exc: Exception | None = None
        for attempt in range(self._MAX_RETRIES):
            try:
                response = await asyncio.wait_for(
                    self._client.aio.models.generate_content(
                        model=self._model,
                        contents=parts,
                        config=config,
                    ),
                    timeout=self._API_TIMEOUT
                )
                # For thinking models response.text can be None when only thought
                # parts were generated (token limit hit during thinking phase).
                # Fall back to concatenating non-thought parts explicitly.
                if response.text is not None:
                    return response.text
                text_parts: list[str] = []
                for candidate in (response.candidates or []):
                    for part in (candidate.content.parts or []):
                        if not getattr(part, "thought", False) and part.text:
                            text_parts.append(part.text)
                result = "".join(text_parts).strip()
                if result:
                    return result
                logger.warning(
                    "Model returned no text on attempt %d. finish_reason=%s",
                    attempt + 1,
                    response.candidates[0].finish_reason if response.candidates else "unknown",
                )
                return ""

            except genai_errors.ServerError as exc:
                last_exc = exc
                if attempt < self._MAX_RETRIES - 1:
                    delay = self._RETRY_DELAYS[attempt]
                    logger.warning(
                        "Gemini API ServerError on attempt %d/%d — retrying in %ds. Error: %s",
                        attempt + 1, self._MAX_RETRIES, delay, exc,
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error("Gemini API failed after %d attempts: %s", self._MAX_RETRIES, exc)
            except asyncio.TimeoutError:
                last_exc = TimeoutError(f"API call timed out after {self._API_TIMEOUT}s")
                if attempt < self._MAX_RETRIES - 1:
                    delay = self._RETRY_DELAYS[attempt]
                    logger.warning(
                        "Gemini API timeout on attempt %d/%d — retrying in %ds",
                        attempt + 1, self._MAX_RETRIES, delay,
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error("Gemini API timed out after %d attempts", self._MAX_RETRIES)
            except genai_errors.ClientError as exc:
                # 4xx errors — no point retrying
                raise

        # All retries exhausted
        raise last_exc  # type: ignore[misc]

    # ── Public API ────────────────────────────────────────────────────────────

    async def generate_diagram_svg(
        self,
        question: str,
        diagram_type: str = "auto",
        image_bytes: Optional[bytes] = None,
        image_mime: str = "image/png",
    ) -> str:
        """
        Ask Gemma to produce a valid SVG diagram for the given question.
        Returns raw SVG markup starting with <svg …>.
        """
        type_hint = "" if diagram_type == "auto" else f" ({diagram_type} diagram)"
        prompt = (
            f"You are an expert educational diagram generator.\n"
            f"Create a detailed, accurate, and visually clear SVG diagram{type_hint} "
            f"that fully explains the following concept or question:\n\n"
            f'"{question}"\n\n'
            "Requirements:\n"
            "- Output ONLY valid SVG markup, starting with <svg and ending with </svg>.\n"
            "- Use a viewBox of '0 0 800 600'.\n"
            "- Include labels, arrows, and annotations where appropriate.\n"
            "- Use a clean colour palette (blues, greens, oranges on white/light background).\n"
            "- Do NOT include any text outside the SVG tags.\n"
            "- Do NOT include markdown fences or explanation text.\n"
        )
        raw = await self._generate(
            prompt, image_bytes, image_mime, temperature=0.4, max_output_tokens=8192
        )
        # Strip any accidental markdown fences
        svg = _extract_svg(raw)
        return svg

    async def explain_material(
        self,
        question: str,
        image_bytes: Optional[bytes] = None,
        image_mime: str = "image/png",
    ) -> str:
        """
        Explain uploaded study material or answer a study question.
        Returns structured markdown text.
        """
        if image_bytes:
            prompt = (
                "You are a knowledgeable academic tutor.\n"
                "The student has uploaded an image of study material and asked:\n\n"
                f'"{question}"\n\n'
                "Provide a clear, thorough, and well-structured explanation in markdown. "
                "Use headings, bullet points, and examples where helpful."
            )
        else:
            prompt = (
                "You are a knowledgeable academic tutor.\n"
                f'The student asks: "{question}"\n\n'
                "Provide a clear, thorough, and well-structured explanation in markdown. "
                "Use headings, bullet points, and examples where helpful."
            )
        return await self._generate(
            prompt, image_bytes, image_mime, temperature=0.6, max_output_tokens=4096
        )

    async def lens_iq(
        self,
        question: str,
        svg_content: Optional[str] = None,
        explanation: Optional[str] = None,
    ) -> str:
        """
        Interactive learning: deep dive into a concept.
        Returns structured markdown.
        """
        context = ""
        if svg_content:
            context += "\n\nA diagram has been generated for this topic."
        if explanation:
            context += f"\n\nExisting explanation summary:\n{explanation[:500]}"

        prompt = (
            "You are an expert academic tutor providing a deep, interactive learning experience.\n"
            f"Topic / Question: \"{question}\"{context}\n\n"
            "Generate a comprehensive LensIQ deep-dive covering:\n"
            "1. **Core Concepts** – fundamental principles\n"
            "2. **How it Works** – step-by-step breakdown\n"
            "3. **Key Relationships** – connections to related concepts\n"
            "4. **Real-World Applications** – practical examples\n"
            "5. **Common Misconceptions** – what students often get wrong\n"
            "6. **Memory Aids** – mnemonics or analogies\n\n"
            "Format your response as rich, readable markdown."
        )
        return await self._generate(
            prompt, temperature=0.7, max_output_tokens=6144
        )

    async def lens_check(
        self,
        question: str,
        svg_content: Optional[str] = None,
        explanation: Optional[str] = None,
    ) -> dict:
        """
        Verify the diagram / explanation against academic standards.
        Returns a structured verification result dict.
        """
        context = ""
        if svg_content:
            context += f"\n\nSVG Diagram (first 1000 chars):\n{svg_content[:1000]}"
        if explanation:
            context += f"\n\nExplanation:\n{explanation[:800]}"

        prompt = (
            "You are an academic accuracy checker.\n"
            f"Topic: \"{question}\"{context}\n\n"
            "Evaluate the educational content and return a JSON object with these exact keys:\n"
            '{\n'
            '  "accuracy_score": <integer 0-100>,\n'
            '  "completeness_score": <integer 0-100>,\n'
            '  "clarity_score": <integer 0-100>,\n'
            '  "overall_verdict": "<Excellent|Good|Needs Improvement|Poor>",\n'
            '  "strengths": ["<strength1>", ...],\n'
            '  "issues": ["<issue1>", ...],\n'
            '  "suggestions": ["<suggestion1>", ...],\n'
            '  "verified_facts": ["<fact1>", ...],\n'
            '  "summary": "<one paragraph summary>"\n'
            '}\n\n'
            "Output ONLY valid JSON. No markdown fences, no extra text."
        )
        raw = await self._generate(
            prompt, temperature=0.3, max_output_tokens=1024
        )
        return _parse_json_safe(raw)

    async def generate_dfa(
        self,
        question: str,
        image_bytes: Optional[bytes] = None,
        image_mime: str = "image/png",
    ) -> dict:
        """
        Ask the model to produce a structured DFA definition as JSON.
        Returns a dict with: states, alphabet, start_state, accepting_states,
        transitions, explanation.
        Raises ValueError if the response cannot be parsed.
        """
        # Check cache for common DFA questions (no image)
        if not image_bytes:
            question_lower = question.lower().strip()
            # Common patterns to cache
            for cached_q, cached_result in self._dfa_cache.items():
                if cached_q in question_lower or question_lower in cached_q:
                    logger.info("DFA cache hit for similar question")
                    return cached_result

        prompt = (
            "You are an expert in Theory of Computation.\n"
            f'The student asks: "{question}"\n\n'
            "Produce a COMPLETE, CORRECT DFA (Deterministic Finite Automaton) "
            "for the described language.\n\n"
            "Return ONLY a valid JSON object with EXACTLY these keys:\n"
            "{\n"
            '  "states": ["q0", "q1", ...],\n'
            '  "alphabet": ["0", "1"],\n'
            '  "start_state": "q0",\n'
            '  "accepting_states": ["q3"],\n'
            '  "transitions": {\n'
            '    "q0": {"0": "q1", "1": "q0"},\n'
            "    ...\n"
            "  },\n"
            '  "explanation": "Step-by-step explanation of the DFA design."\n'
            "}\n\n"
            "Rules:\n"
            "- The DFA must be COMPLETE: every state must have a transition for every alphabet symbol.\n"
            "- All destination states in transitions must exist in the states list.\n"
            "- start_state must be in states.\n"
            "- All accepting_states must be in states.\n"
            "- Output ONLY the JSON object. No markdown fences, no extra text.\n"
        )
        raw = await self._generate(
            prompt, image_bytes, image_mime, temperature=0.2, max_output_tokens=4096
        )
        result = _parse_json_safe(raw)
        if not isinstance(result, dict):
            raise ValueError(
                f"AI returned non-dict JSON. Raw (first 300 chars): {raw[:300]}"
            )
        required = {"states", "alphabet", "start_state", "accepting_states", "transitions"}
        missing = required - set(result.keys())
        if missing:
            raise ValueError(
                f"AI response missing required DFA fields: {missing}. "
                f"Raw (first 300 chars): {raw[:300]}"
            )
        # Cache successful results for text-only questions
        if not image_bytes and len(self._dfa_cache) < 20:  # Limit cache size
            self._dfa_cache[question.lower().strip()] = result
        return result

    async def extract_question_from_image(
        self,
        image_bytes: bytes,
        image_mime: str = "image/png",
    ) -> str:
        """
        Extract a DFA/automata question from an uploaded image.
        Returns the extracted question text for student confirmation.
        """
        prompt = (
            "You are an expert in Theory of Computation.\n"
            "The student has uploaded an image that contains a question or problem "
            "about Deterministic Finite Automata (DFA) or automata theory.\n\n"
            "Extract and return ONLY the question text from the image, exactly as written.\n"
            "If you cannot identify a clear question, return: "
            "'Could not extract a clear question from the image.'\n"
            "Output ONLY the question text. No explanations, no markdown.\n"
        )
        return await self._generate(
            prompt, image_bytes, image_mime, temperature=0.1, max_output_tokens=512
        )

    async def generate_quiz(
        self,
        question: str,
        explanation: Optional[str] = None,
        num_questions: int = 5,
    ) -> list[dict]:
        """
        Generate a quiz based on the current learning session.
        Returns a list of question dicts.
        """
        context = ""
        if explanation:
            context = f"\n\nBased on this explanation:\n{explanation[:800]}"

        prompt = (
            "You are an expert educator creating a quiz.\n"
            f"Topic: \"{question}\"{context}\n\n"
            f"Generate exactly {num_questions} multiple-choice questions.\n"
            "Return a JSON array where each element has:\n"
            '{\n'
            '  "id": <integer>,\n'
            '  "question": "<question text>",\n'
            '  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],\n'
            '  "correct_answer": "<A|B|C|D>",\n'
            '  "explanation": "<why this answer is correct>",\n'
            '  "difficulty": "<easy|medium|hard>"\n'
            '}\n\n'
            "Output ONLY valid JSON array. No markdown fences, no extra text."
        )
        raw = await self._generate(
            prompt, temperature=0.5, max_output_tokens=2048
        )
        result = _parse_json_safe(raw)
        if isinstance(result, list):
            return result
        return []


# ── Module-level helpers ───────────────────────────────────────────────────────

def _extract_svg(text: str) -> str:
    """Pull the SVG block out of a possibly messy response."""
    start = text.find("<svg")
    end = text.rfind("</svg>")
    if start != -1 and end != -1:
        return text[start : end + 6]
    # Return as-is and let the caller handle it
    return text.strip()


def _parse_json_safe(text: str) -> dict | list:
    """Attempt to parse JSON, stripping markdown fences if present."""
    import json, re

    cleaned = text.strip()
    # Remove ```json ... ``` fences
    cleaned = re.sub(r"^```[a-z]*\n?", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\n?```$", "", cleaned, flags=re.MULTILINE)
    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Failed to parse JSON from Gemma response: %s…", cleaned[:200])
        return {}


# ── Singleton ─────────────────────────────────────────────────────────────────

_gemma_service: Optional[GemmaService] = None


def get_gemma_service() -> GemmaService:
    global _gemma_service
    if _gemma_service is None:
        _gemma_service = GemmaService()
    return _gemma_service
