import json
import anthropic
from findings import FINDINGS

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


def _build_system_prompt(review_type: str) -> str:
    findings = FINDINGS[review_type]
    elements_desc = "\n".join(
        f"- {key} ({v['label']}): {v['description']} "
        f"[rating effect: {v['rating']:+.2%}, revenue effect: {v['revenue']:+.2%}, direction: {v['direction']}]"
        for key, v in findings.items()
    )

    return f"""You are an expert analyzer of hotel management responses to online reviews, grounded in peer-reviewed causal research (Karaman, Chakraborty & Banerjee 2025).

The research studied 5.4 million hotel reviews and identified 10 response elements with measured causal effects on future ratings and revenue. Your job is to:
1. Detect which elements are present in the manager's draft response.
2. Generate specific, evidence-based suggestions to improve the response.

RESPONSE ELEMENTS FOR A {review_type.upper()} REVIEW:
{elements_desc}

IMPORTANT RULES:
- response_tailoring and style_matching are continuous scores 0.0–1.0 (not boolean).
  - response_tailoring: 0 = completely generic, 1 = addresses every specific topic from the review.
  - style_matching: 0 = own words entirely, 1 = closely echoes the guest's phrasing/tone.
- All other elements are boolean (true/false).
- For negative reviews only: problem_acceptance, taking_responsibility, regret, action are applicable.
- For positive reviews: problem_acceptance, taking_responsibility, regret, action are NOT applicable — omit them.
- Generate suggestions ONLY for elements where action is warranted (direction = bad, mixed, or a good element that is absent but would help).
- Each suggestion must cite the specific numeric effect from the research.
- Keep suggestions concise and actionable (2–3 sentences max).
- The "overall" field should be 1–2 sentences summarizing the response's strengths and main improvement opportunity.

Return ONLY valid JSON matching this exact schema (no markdown, no explanation outside JSON):
{{
  "detected_elements": {{
    "problem_acceptance": <bool or null if not applicable>,
    "taking_responsibility": <bool or null if not applicable>,
    "regret": <bool or null if not applicable>,
    "action": <bool or null if not applicable>,
    "response_tailoring": <float 0.0–1.0>,
    "style_matching": <float 0.0–1.0>,
    "thanks": <bool>,
    "loyalty": <bool>,
    "revisit_request": <bool>,
    "apology": <bool>
  }},
  "suggestions": [
    {{
      "element": "<element_key>",
      "impact": "positive" | "negative" | "opportunity",
      "message": "<actionable suggestion citing the research finding>"
    }}
  ],
  "overall": "<1–2 sentence overall assessment>"
}}"""


def analyze(review: str, response: str, review_type: str) -> dict:
    system = _build_system_prompt(review_type)
    user_message = (
        f"Review ({review_type}, {('1–3 stars' if review_type == 'negative' else '4–5 stars')}):\n"
        f"{review}\n\n"
        f"Manager's draft response:\n{response}"
    )

    client = _get_client()
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    result = json.loads(raw)

    # Attach display labels and direction from findings for the frontend
    findings = FINDINGS[review_type]
    for element_key, detected in result["detected_elements"].items():
        if detected is None:
            continue
        if element_key in findings:
            f = findings[element_key]
            result["detected_elements_meta"] = result.get("detected_elements_meta", {})
            result["detected_elements_meta"][element_key] = {
                "label": f["label"],
                "direction": f["direction"],
                "rating": f["rating"],
                "revenue": f["revenue"],
            }

    return result
