"""
LearnLens AI – Diagram Generation Module
Handles SVG diagram requests, caching, and post-processing.
"""

from __future__ import annotations

import hashlib
import logging
from typing import Optional

from gemma_service import GemmaService

logger = logging.getLogger(__name__)

DIAGRAM_TYPES = {
    "auto": "Automatically detect the best diagram type",
    "flowchart": "Process flow or algorithm diagram",
    "mindmap": "Mind map / concept map",
    "timeline": "Timeline or historical sequence",
    "cycle": "Cyclic process (e.g. water cycle, carbon cycle)",
    "hierarchy": "Tree / organisational hierarchy",
    "comparison": "Side-by-side comparison table",
    "anatomy": "Labelled anatomical diagram",
    "circuit": "Electrical circuit diagram",
    "graph": "Mathematical graph or chart",
}


class DiagramGenerator:
    """
    Generates SVG diagrams via Gemma 4 and performs
    light post-processing for safety and consistency.
    """

    def __init__(self, service: GemmaService) -> None:
        self._service = service
        self._cache: dict[str, str] = {}  # simple in-process cache
        self._prepopulate_cache()

    def _prepopulate_cache(self) -> None:
        """Pre-populate cache with common diagram examples for instant response."""
        # Photosynthesis diagram
        self._cache[self._cache_key("photosynthesis", "auto", False)] = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#f8fafc"/>
  <text x="400" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="#1e293b">Photosynthesis</text>
  <circle cx="150" cy="150" r="60" fill="#fbbf24" stroke="#f59e0b" stroke-width="3"/>
  <text x="150" y="155" text-anchor="middle" font-size="14" fill="#78350f">Sunlight</text>
  <rect x="250" y="100" width="200" height="120" fill="#4ade80" stroke="#22c55e" stroke-width="3" rx="10"/>
  <text x="350" y="140" text-anchor="middle" font-size="14" font-weight="bold" fill="#14532d">Chloroplast</text>
  <text x="350" y="170" text-anchor="middle" font-size="12" fill="#14532d">6CO₂ + 6H₂O</text>
  <text x="350" y="195" text-anchor="middle" font-size="12" fill="#14532d">→ C₆H₁₂O₆ + 6O₂</text>
  <rect x="550" y="100" width="150" height="80" fill="#60a5fa" stroke="#3b82f6" stroke-width="3" rx="10"/>
  <text x="625" y="135" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e3a8a">CO₂</text>
  <text x="625" y="160" text-anchor="middle" font-size="12" fill="#1e3a8a">Carbon Dioxide</text>
  <rect x="550" y="220" width="150" height="80" fill="#93c5fd" stroke="#60a5fa" stroke-width="3" rx="10"/>
  <text x="625" y="255" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e3a8a">H₂O</text>
  <text x="625" y="280" text-anchor="middle" font-size="12" fill="#1e3a8a">Water</text>
  <rect x="550" y="340" width="150" height="80" fill="#34d399" stroke="#10b981" stroke-width="3" rx="10"/>
  <text x="625" y="375" text-anchor="middle" font-size="14" font-weight="bold" fill="#064e3b">O₂</text>
  <text x="625" y="400" text-anchor="middle" font-size="12" fill="#064e3b">Oxygen</text>
  <rect x="550" y="460" width="150" height="80" fill="#fcd34d" stroke="#f59e0b" stroke-width="3" rx="10"/>
  <text x="625" y="495" text-anchor="middle" font-size="14" font-weight="bold" fill="#78350f">Glucose</text>
  <text x="625" y="520" text-anchor="middle" font-size="12" fill="#78350f">C₆H₁₂O₆</text>
  <line x1="210" y1="150" x2="250" y2="150" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrow)"/>
  <line x1="450" y1="140" x2="550" y2="140" stroke="#22c55e" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="450" y1="160" x2="550" y2="260" stroke="#22c55e" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="450" y1="180" x2="550" y2="380" stroke="#22c55e" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="450" y1="200" x2="550" y2="500" stroke="#22c55e" stroke-width="2" marker-end="url(#arrow)"/>
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#64748b"/>
    </marker>
  </defs>
</svg>'''

        # Water cycle diagram
        self._cache[self._cache_key("water cycle", "cycle", False)] = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#f0f9ff"/>
  <text x="400" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="#0c4a6e">The Water Cycle</text>
  <circle cx="400" cy="120" r="50" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"/>
  <text x="400" y="115" text-anchor="middle" font-size="12" font-weight="bold" fill="#92400e">Sun</text>
  <text x="400" y="135" text-anchor="middle" font-size="10" fill="#92400e">Energy</text>
  <path d="M250,200 Q400,150 550,200 Q600,250 550,300 Q400,350 250,300 Q200,250 250,200" fill="#93c5fd" stroke="#3b82f6" stroke-width="3"/>
  <text x="400" y="255" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e3a8a">Clouds</text>
  <text x="400" y="275" text-anchor="middle" font-size="11" fill="#1e3a8a">Condensation</text>
  <path d="M350,320 L320,420 L480,420 L450,320" fill="none" stroke="#60a5fa" stroke-width="4"/>
  <text x="400" y="380" text-anchor="middle" font-size="12" font-weight="bold" fill="#0369a1">Rain</text>
  <text x="400" y="400" text-anchor="middle" font-size="10" fill="#0369a1">Precipitation</text>
  <rect x="150" y="420" width="500" height="100" fill="#bae6fd" stroke="#38bdf8" stroke-width="3" rx="10"/>
  <text x="400" y="465" text-anchor="middle" font-size="16" font-weight="bold" fill="#0c4a6e">Ocean / Ground Water</text>
  <text x="400" y="490" text-anchor="middle" font-size="12" fill="#0c4a6e">Collection</text>
  <path d="M150,470 Q100,470 100,300 Q100,200 250,200" fill="none" stroke="#0ea5e9" stroke-width="3" stroke-dasharray="5,5" marker-end="url(#arrow)"/>
  <text x="120" y="350" text-anchor="middle" font-size="11" fill="#0369a1" transform="rotate(-90,120,350)">Evaporation</text>
  <path d="M550,470 Q600,470 600,300 Q600,200 550,200" fill="none" stroke="#0ea5e9" stroke-width="3" stroke-dasharray="5,5" marker-end="url(#arrow)"/>
  <text x="680" y="350" text-anchor="middle" font-size="11" fill="#0369a1" transform="rotate(90,680,350)">Transpiration</text>
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#0ea5e9"/>
    </marker>
  </defs>
</svg>'''

        # DNA replication diagram
        self._cache[self._cache_key("dna replication", "auto", False)] = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#fef2f2"/>
  <text x="400" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="#7f1d1d">DNA Replication</text>
  <line x1="100" y1="300" x2="700" y2="300" stroke="#dc2626" stroke-width="4"/>
  <text x="400" y="290" text-anchor="middle" font-size="14" font-weight="bold" fill="#dc2626">Original DNA Strand</text>
  <rect x="200" y="320" width="150" height="120" fill="#fecaca" stroke="#ef4444" stroke-width="2" rx="5"/>
  <text x="275" y="360" text-anchor="middle" font-size="12" font-weight="bold" fill="#991b1b">Helicase</text>
  <text x="275" y="380" text-anchor="middle" font-size="10" fill="#991b1b">Unwinds DNA</text>
  <rect x="450" y="320" width="150" height="120" fill="#bbf7d0" stroke="#22c55e" stroke-width="2" rx="5"/>
  <text x="525" y="360" text-anchor="middle" font-size="12" font-weight="bold" fill="#166534">DNA Polymerase</text>
  <text x="525" y="380" text-anchor="middle" font-size="10" fill="#166534">Adds new bases</text>
  <path d="M150,480 Q275,450 400,480 Q525,510 650,480" fill="none" stroke="#ef4444" stroke-width="3"/>
  <text x="400" y="500" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">Leading Strand</text>
  <path d="M150,520 Q275,550 400,520 Q525,490 650,520" fill="none" stroke="#3b82f6" stroke-width="3"/>
  <text x="400" y="545" text-anchor="middle" font-size="12" font-weight="bold" fill="#1d4ed8">Lagging Strand</text>
  <text x="400" y="130" text-anchor="middle" font-size="14" fill="#7f1d1d">Result: Two identical DNA molecules</text>
  <line x1="200" y1="150" x2="600" y2="150" stroke="#dc2626" stroke-width="3"/>
  <line x1="200" y1="170" x2="600" y2="170" stroke="#3b82f6" stroke-width="3"/>
</svg>'''

        logger.info("Pre-populated diagram cache with %d examples", len(self._cache))

    def _cache_key(
        self,
        question: str,
        diagram_type: str,
        has_image: bool,
    ) -> str:
        raw = f"{question}|{diagram_type}|{has_image}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    async def generate(
        self,
        question: str,
        diagram_type: str = "auto",
        image_bytes: Optional[bytes] = None,
        image_mime: str = "image/png",
        use_cache: bool = True,
    ) -> dict:
        """
        Generate or retrieve a cached SVG diagram.
        Returns a dict with svg, diagram_type, question, cached.
        """
        if diagram_type not in DIAGRAM_TYPES:
            diagram_type = "auto"

        cache_key = self._cache_key(question, diagram_type, image_bytes is not None)

        if use_cache and cache_key in self._cache:
            logger.info("Serving diagram from cache key=%s", cache_key)
            return {
                "svg": self._cache[cache_key],
                "diagram_type": diagram_type,
                "question": question,
                "cached": True,
            }

        # Smart matching for similar questions (text-only, no image)
        if use_cache and not image_bytes:
            question_lower = question.lower()
            for cached_key, cached_svg in self._cache.items():
                # Extract the question part from the cache key (before first |)
                cached_question = cached_key.split("|")[0].lower()
                if cached_question in question_lower or question_lower in cached_question:
                    logger.info("Smart cache match: similar question found")
                    return {
                        "svg": cached_svg,
                        "diagram_type": diagram_type,
                        "question": question,
                        "cached": True,
                    }

        logger.info(
            "Generating diagram: type=%s question_len=%d has_image=%s",
            diagram_type,
            len(question),
            image_bytes is not None,
        )

        svg = await self._service.generate_diagram_svg(
            question=question,
            diagram_type=diagram_type,
            image_bytes=image_bytes,
            image_mime=image_mime,
        )

        svg = _sanitize_svg(svg)

        # Cache successful results (limit cache size)
        if not image_bytes and len(self._cache) < 30:
            self._cache[cache_key] = svg

        return {
            "svg": svg,
            "diagram_type": diagram_type,
            "question": question,
            "cached": False,
        }


# ── SVG post-processing ────────────────────────────────────────────────────────

def _sanitize_svg(svg: str) -> str:
    """
    Very light SVG sanity check:
    - Ensure we have an opening <svg and closing </svg>
    - Strip script tags (security)
    """
    import re

    # Remove <script> tags
    svg = re.sub(r"<script[^>]*>.*?</script>", "", svg, flags=re.DOTALL | re.IGNORECASE)
    # Remove on* event handlers
    svg = re.sub(r'\s+on\w+="[^"]*"', "", svg, flags=re.IGNORECASE)

    if not svg.strip().startswith("<svg"):
        # Wrap in a minimal SVG if something went wrong
        svg = (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">'
            f'<text x="400" y="300" text-anchor="middle" font-size="18" fill="#666">'
            f"Diagram could not be rendered. Please try again."
            f"</text>{svg}</svg>"
        )
    return svg
