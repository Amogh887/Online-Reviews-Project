import json
import random

import anthropic

from findings import FINDINGS, SAMPLE_REVIEWS

MODEL = "claude-sonnet-4-6"

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


def _findings_block() -> str:
    """The big shared block embedded in every coaching call — cached.

    Includes all 10 elements (both review types) with descriptions and the
    causal estimates from Table 12 of Karaman, Chakraborty & Banerjee (2025).
    """
    sections = []
    for review_type in ("negative", "positive"):
        lines = [f"\n## Elements for {review_type.upper()} reviews:"]
        for key, v in FINDINGS[review_type].items():
            lines.append(
                f"- {key} ({v['label']}): {v['description']} "
                f"[rating effect: {v['rating']:+.2%}, "
                f"revenue effect: {v['revenue']:+.2%}, "
                f"direction: {v['direction']}]"
            )
        sections.append("\n".join(lines))

    intro = (
        "You are a hotel-response coach grounded in peer-reviewed causal research "
        "(Karaman, Chakraborty & Banerjee 2025 — 5.4M reviews across 4,910 hotels, "
        "12 years). The research identifies 10 response elements with measured "
        "causal effects on future ratings and revenue.\n\n"
        "KEY RULES:\n"
        "- For NEGATIVE reviews, all 10 elements apply.\n"
        "- For POSITIVE reviews, problem_acceptance / taking_responsibility / "
        "regret / action are NOT applicable.\n"
        "- response_tailoring and style_matching are continuous scores 0.0–1.0.\n"
        "  - response_tailoring: 0 = generic, 1 = addresses every specific topic.\n"
        "  - style_matching: 0 = own words entirely, 1 = closely echoes guest phrasing.\n"
        "- All other elements are boolean."
    )

    return intro + "\n" + "\n".join(sections)


_SHARED_FINDINGS_BLOCK = _findings_block()


def _system_blocks(mode_instructions: str) -> list[dict]:
    """Build system prompt with cacheable findings block + mode-specific suffix."""
    return [
        {
            "type": "text",
            "text": _SHARED_FINDINGS_BLOCK,
            "cache_control": {"type": "ephemeral"},
        },
        {"type": "text", "text": mode_instructions},
    ]


def _parse_json_response(message) -> dict:
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
    return json.loads(raw)


def _attach_meta(elements: dict, review_type: str) -> dict:
    """Map element keys to their label/direction/effects for the frontend."""
    findings = FINDINGS[review_type]
    meta = {}
    for key in elements:
        if key in findings:
            f = findings[key]
            meta[key] = {
                "label": f["label"],
                "direction": f["direction"],
                "rating": f["rating"],
                "revenue": f["revenue"],
            }
    return meta


# ---------------------------------------------------------------------------
# Generate mode: AI writes a model response
# ---------------------------------------------------------------------------

_GENERATE_INSTRUCTIONS = """## TASK: Generate a model management response.

You are given a guest review. Write the ideal management response that:
- Deliberately INCLUDES elements with direction=good for this review type.
- Deliberately AVOIDS elements with direction=bad.
- Treats direction=mixed elements with care (use them sparingly, only when natural).
- For negative reviews: lead with problem_acceptance, use high response_tailoring, skip action promises and regret.
- For positive reviews: use high response_tailoring with the guest's own topics, but keep style_matching moderate (don't parrot their words).
- Keep the response professional and concise (3–5 sentences typical, never more than 7).
- Do not promise future actions on a negative review.

Return ONLY valid JSON (no markdown):
{
  "response": "<the generated response text>",
  "elements_used": ["<element_key>", ...],
  "elements_avoided": ["<element_key>", ...],
  "rationale": "<1–2 sentences explaining the strategic choices>"
}"""


def generate_response(review: str, review_type: str) -> dict:
    user_msg = (
        f"Guest review ({review_type}, "
        f"{'1–3 stars' if review_type == 'negative' else '4–5 stars'}):\n"
        f"{review}\n\n"
        f"Write the ideal management response."
    )

    message = _get_client().messages.create(
        model=MODEL,
        max_tokens=1024,
        system=_system_blocks(_GENERATE_INSTRUCTIONS),
        messages=[{"role": "user", "content": user_msg}],
    )

    result = _parse_json_response(message)

    used_meta = _attach_meta({k: True for k in result.get("elements_used", [])}, review_type)
    avoided_meta = _attach_meta({k: True for k in result.get("elements_avoided", [])}, review_type)
    result["elements_used_meta"] = used_meta
    result["elements_avoided_meta"] = avoided_meta
    result["usage"] = _usage_summary(message)
    return result


# ---------------------------------------------------------------------------
# Practice mode: critique + rewrite the user's response
# ---------------------------------------------------------------------------

_PRACTICE_INSTRUCTIONS = """## TASK: Critique and rewrite a manager's draft response.

You are given a guest review and a manager's draft response. Do three things:
1. Detect which response elements are present in the draft (same schema as analysis).
2. Produce an IMPROVED rewritten version that the manager can use as-is.
3. List the concrete changes you made, each citing the relevant causal estimate.

Rewrite rules:
- Keep the manager's authentic voice; don't make it sound like a different person.
- Remove elements with direction=bad (especially `action` promises for negative reviews).
- Add high-impact good elements that are missing (especially problem_acceptance + response_tailoring for negative).
- Keep the rewrite the same approximate length as the original.

Return ONLY valid JSON (no markdown):
{
  "detected_elements": {
    "problem_acceptance": <bool or null>,
    "taking_responsibility": <bool or null>,
    "regret": <bool or null>,
    "action": <bool or null>,
    "response_tailoring": <float 0.0–1.0>,
    "style_matching": <float 0.0–1.0>,
    "thanks": <bool>,
    "loyalty": <bool>,
    "revisit_request": <bool>,
    "apology": <bool>
  },
  "rewritten_response": "<the improved response text>",
  "changes": [
    {"element": "<element_key>", "action": "added"|"removed"|"strengthened"|"softened",
     "reason": "<1 sentence citing the numeric effect from the research>"}
  ],
  "overall": "<1–2 sentence summary of the main improvements>"
}"""


def practice_critique(review: str, response: str, review_type: str) -> dict:
    user_msg = (
        f"Guest review ({review_type}, "
        f"{'1–3 stars' if review_type == 'negative' else '4–5 stars'}):\n"
        f"{review}\n\n"
        f"Manager's draft response:\n{response}\n\n"
        f"Analyze and rewrite."
    )

    message = _get_client().messages.create(
        model=MODEL,
        max_tokens=1500,
        system=_system_blocks(_PRACTICE_INSTRUCTIONS),
        messages=[{"role": "user", "content": user_msg}],
    )

    result = _parse_json_response(message)
    result["detected_elements_meta"] = _attach_meta(
        result.get("detected_elements", {}), review_type
    )
    result["usage"] = _usage_summary(message)
    return result


# ---------------------------------------------------------------------------
# Sample reviews
# ---------------------------------------------------------------------------

def list_samples(review_type: str | None = None) -> list[dict]:
    if review_type:
        return [s for s in SAMPLE_REVIEWS if s["type"] == review_type]
    return list(SAMPLE_REVIEWS)


_SAMPLE_GEN_SYSTEM = (
    "You generate realistic, varied guest reviews for a hotel for a coaching tool. "
    "Output a single review of 3–5 sentences that sounds authentic — natural, "
    "specific, and not too polished. Vary the topic each time."
)


def generate_sample_review(review_type: str) -> dict:
    star_range = "1–3 stars" if review_type == "negative" else "4–5 stars"
    user_msg = (
        f"Write one realistic {review_type} hotel guest review ({star_range}). "
        f"Pick a fresh topic. Return ONLY valid JSON: "
        f'{{"text": "<the review>", "topic": "<short topic label>"}}'
    )

    message = _get_client().messages.create(
        model=MODEL,
        max_tokens=400,
        system=_SAMPLE_GEN_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )

    result = _parse_json_response(message)
    result["type"] = review_type
    result["id"] = f"gen-{random.randint(1000, 9999)}"
    return result


# ---------------------------------------------------------------------------

def _usage_summary(message) -> dict:
    u = message.usage
    return {
        "input_tokens": getattr(u, "input_tokens", 0),
        "output_tokens": getattr(u, "output_tokens", 0),
        "cache_creation_input_tokens": getattr(u, "cache_creation_input_tokens", 0) or 0,
        "cache_read_input_tokens": getattr(u, "cache_read_input_tokens", 0) or 0,
    }
