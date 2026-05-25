#!/usr/bin/env python3
"""
Prompt evaluation workflow for Review Response Coach.

Uses Haiku to generate test datasets and judge output quality,
ensures the API prompts (running on Sonnet) are objectively good.

Usage: python eval/run_eval.py
"""

import json
import sys
import os
from pathlib import Path

import anthropic

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from coach import generate_response, practice_critique
from findings import FINDINGS

client = anthropic.Anthropic()
haiku = anthropic.Anthropic(model="claude-haiku-4-5")

# ============================================================================
# Phase 1: Generate test dataset with Haiku
# ============================================================================

def generate_eval_dataset() -> list[dict]:
    """Generate 20 diverse hotel reviews with expected element annotations."""
    print("\n=== Phase 1: Generating eval dataset with Haiku ===")

    prompt = """Generate 20 realistic hotel guest reviews for evaluation (10 negative 1-3 stars, 10 positive 4-5 stars).

For each review, also specify which response elements SHOULD ideally be present in a well-crafted management reply.
Elements are: problem_acceptance, taking_responsibility, regret, action, response_tailoring, style_matching, thanks, loyalty, revisit_request, apology.

Return ONLY valid JSON with no markdown:
[
  {
    "review": "<guest review text>",
    "type": "negative" | "positive",
    "topic": "<topic label>",
    "expected_elements": ["element1", "element2", ...]
  },
  ...
]

Vary topics: noise, cleanliness, staff, location, billing, food, check-in, parking, wifi, etc.
Make reviews 2-4 sentences, authentic-sounding."""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    dataset = json.loads(raw)
    print(f"✓ Generated {len(dataset)} test reviews")
    return dataset


# ============================================================================
# Phase 2: Run the actual prompts (Sonnet) against the dataset
# ============================================================================

def run_prompts_on_dataset(dataset: list[dict]) -> list[dict]:
    """Run generate_response and practice_critique on each dataset item."""
    print("\n=== Phase 2: Running prompts on test dataset ===")

    results = []
    for i, item in enumerate(dataset):
        try:
            review_type = item["type"]
            review_text = item["review"]

            # Run generate_response
            gen_result = generate_response(review_text, review_type)

            # For practice_critique, use a weak draft response and see if the rewrite improves it
            weak_response = "Thank you for your feedback. We appreciate your business."
            practice_result = practice_critique(review_text, weak_response, review_type)

            results.append({
                "review": review_text,
                "type": review_type,
                "topic": item["topic"],
                "expected_elements": item["expected_elements"],
                "generated_response": gen_result["response"],
                "generated_elements": gen_result.get("elements_used", []),
                "rewritten_response": practice_result.get("rewritten_response", ""),
                "detected_elements": practice_result.get("detected_elements", {}),
            })

            print(f"  [{i+1}/{len(dataset)}] {item['topic']:<12} ({review_type:<8}) ✓")
        except Exception as e:
            print(f"  [{i+1}/{len(dataset)}] {item['topic']:<12} ({item['type']:<8}) ✗ {str(e)[:40]}")
            continue

    print(f"✓ Completed {len(results)}/{len(dataset)} evaluations")
    return results


# ============================================================================
# Phase 3: Judge with Haiku
# ============================================================================

def judge_responses(results: list[dict]) -> list[dict]:
    """Use Haiku as a judge to score element coverage, avoidance, and naturalness."""
    print("\n=== Phase 3: Judging responses with Haiku ===")

    judged = []
    for i, item in enumerate(results):
        try:
            prompt = f"""You are evaluating a hotel management response for research quality.

Guest review ({item['type']} stars):
{item['review']}

Generated response:
{item['generated_response']}

Expected elements that should ideally be present: {', '.join(item['expected_elements'])}
Actual elements in the response: {', '.join(item['generated_elements'])}

Score these 0-10:
1. Element coverage (0=none of expected elements, 10=all present naturally)
2. Avoidance quality (0=includes harmful elements, 10=smartly avoids bad ones)
3. Naturalness (0=sounds robotic, 10=reads as authentic guest-facing reply)
4. One sentence: key improvement opportunity

Return ONLY valid JSON (no markdown):
{{
  "coverage": <int 0-10>,
  "avoidance": <int 0-10>,
  "naturalness": <int 0-10>,
  "critique": "<one sentence>"
}}"""

            message = haiku.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )

            raw = message.content[0].text.strip()
            if raw.startswith("```"):
                lines = raw.split("\n")
                raw = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

            scores = json.loads(raw)
            item["scores"] = scores
            judged.append(item)

            avg_score = (scores["coverage"] + scores["avoidance"] + scores["naturalness"]) / 3
            print(f"  [{i+1}/{len(results)}] {item['topic']:<12} avg={avg_score:.1f}/10")
        except Exception as e:
            print(f"  [{i+1}/{len(results)}] {item['topic']:<12} ✗ {str(e)[:40]}")
            continue

    print(f"✓ Judged {len(judged)}/{len(results)} responses")
    return judged


# ============================================================================
# Phase 4: Report
# ============================================================================

def print_report(judged: list[dict]):
    """Print a markdown summary table and analysis."""
    print("\n=== Phase 4: Evaluation Report ===\n")

    if not judged:
        print("No evaluations completed.")
        return

    # Calculate per-element statistics
    element_coverage = {}
    for item in judged:
        for elem in item["expected_elements"]:
            if elem not in element_coverage:
                element_coverage[elem] = {"expected": 0, "detected": 0}
            element_coverage[elem]["expected"] += 1
            if elem in item["generated_elements"]:
                element_coverage[elem]["detected"] += 1

    # Print element precision/recall
    print("## Element Coverage (per-element recall)")
    print("| Element | Recall | Notes |")
    print("|---------|--------|-------|")
    for elem, stats in sorted(element_coverage.items(), key=lambda x: x[1]["detected"] / max(1, x[1]["expected"])):
        recall = stats["detected"] / max(1, stats["expected"])
        recall_pct = f"{recall*100:.0f}%"
        print(f"| {elem:<30} | {recall_pct:>6} | {stats['detected']}/{stats['expected']} |")

    # Print judge scores
    print("\n## Judge Scores (0-10)")
    print("| Dimension | Mean | Range |")
    print("|-----------|------|-------|")

    for dimension in ["coverage", "avoidance", "naturalness"]:
        scores = [item["scores"][dimension] for item in judged if "scores" in item]
        if scores:
            mean = sum(scores) / len(scores)
            min_s = min(scores)
            max_s = max(scores)
            print(f"| {dimension.capitalize():<18} | {mean:>4.1f} | {min_s}-{max_s} |")

    # Overall summary
    all_scores = []
    for item in judged:
        if "scores" in item:
            scores = [item["scores"][d] for d in ["coverage", "avoidance", "naturalness"]]
            all_scores.extend(scores)

    if all_scores:
        overall_mean = sum(all_scores) / len(all_scores)
        print(f"\n**Overall average: {overall_mean:.1f}/10**")
        if overall_mean >= 7:
            print("✓ Prompts are performing well. Minor tweaks may help edge scores above 8.")
        elif overall_mean >= 5:
            print("⚠ Prompts have room for improvement. Review critiques below for patterns.")
        else:
            print("✗ Prompts need significant revision. Review critiques for systemic issues.")

    # Print a sample of critiques
    print("\n## Sample Critiques")
    for item in judged[:5]:
        if "scores" in item:
            print(f"\n**{item['topic']} ({item['type']}):**")
            print(f"  Critique: {item['scores']['critique']}")


# ============================================================================
# Main
# ============================================================================

def main():
    """Run the full eval workflow."""
    print("=" * 70)
    print("REVIEW RESPONSE COACH — Prompt Evaluation Workflow")
    print("=" * 70)

    # Phase 1: Generate dataset
    dataset = generate_eval_dataset()

    # Phase 2: Run prompts
    results = run_prompts_on_dataset(dataset)

    if not results:
        print("\n✗ No results to evaluate. Exiting.")
        return

    # Save raw results
    results_path = Path(__file__).parent / "results.json"
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n✓ Raw results saved to {results_path}")

    # Phase 3: Judge
    judged = judge_responses(results)

    # Phase 4: Report
    print_report(judged)

    print("\n" + "=" * 70)
    print("Evaluation complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
