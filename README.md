# Review Response Coach

A research-backed AI tool that helps hotel managers write better guest responses. Based on a causal study of 5.4M reviews across 4,910 properties over 12 years, this app shows which response elements actually move ratings and revenue—and helps you apply them in real-time.

## Features

### **Generate** — AI-Powered Response Writing
Paste a guest review and get an AI-generated management response that:
- Deliberately includes elements proven to improve ratings and revenue
- Avoids elements that consistently hurt performance
- Explains exactly why each element was chosen
- Shows causal estimates backing each decision

### **Practice** — Interactive Coaching
Write your own response and get it rewritten with AI improvements. See:
- Your original response vs. the AI-optimized rewrite
- Which elements were detected in your version
- A detailed breakdown of each edit with causal reasoning behind it
- Real-time streaming for immediate feedback

### **Findings** — Research Dashboard
Explore the research underpinning the tool:
- Effect of each response element on future ratings
- Revenue impact for each element
- Per-element precision/recall across test datasets
- Interactive charts: click any bar series to highlight it

## Technology Stack

**Frontend:**
- React + Vite
- Tailwind CSS (custom design system: ink, cream, amber)
- Recharts for interactive data visualization
- Server-Sent Events (SSE) for real-time streaming

**Backend:**
- FastAPI (Python)
- Claude Sonnet for generating and critiquing responses
- Claude Haiku for evaluation workflows
- AsyncAnthropic client for streaming responses

**Deployment:**
- Vercel (frontend + serverless Python backend)
- GitHub for version control

## Local Development

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Anthropic API key (set in `backend/.env`)

### Setup

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to backend/.env
```

### Running Locally

**Terminal 1 — Backend server (on port 8000):**
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend dev server (on port 5174):**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

## API Endpoints

### Streaming Endpoints (Real-time response)

**POST `/api/generate/stream`**
- Input: `{ review: string, review_type: "negative" | "positive" }`
- Output: Server-Sent Events with:
  - `event: token` — individual response text chunks
  - `event: done` — final metadata (elements_used, elements_avoided, rationale)

**POST `/api/practice/stream`**
- Input: `{ review: string, response: string, review_type: "negative" | "positive" }`
- Output: Server-Sent Events with:
  - `event: token` — streamed rewritten response
  - `event: done` — metadata (detected_elements, changes with causal estimates, overall summary)

### Non-Streaming Endpoints (Fallback)

**POST `/api/generate`**
- Same input/output as `/api/generate/stream`, but returns full JSON

**POST `/api/practice`**
- Same input/output as `/api/practice/stream`, but returns full JSON

### Supporting Endpoints

**GET `/api/samples?review_type=negative|positive`**
- Returns: `{ samples: [{ id, text, type, topic }] }`

**POST `/api/samples/generate`**
- Input: `{ review_type: "negative" | "positive" }`
- Returns: `{ id, text, type, topic }` (single AI-generated review)

**GET `/api/dashboard`**
- Returns: Research data for the Findings tab
  - `headline`: Key statistics
  - `charts`: Effect data for ratings and revenue

## Prompt Evaluation

The `eval/run_eval.py` script runs an objective quality assessment of the AI prompts:

```bash
cd /path/to/project
python eval/run_eval.py
```

**What it does:**
1. **Phase 1** — Haiku generates 20 diverse hotel reviews (10 negative, 10 positive) with expected elements
2. **Phase 2** — Runs actual `generate_response()` and `practice_critique()` on each review
3. **Phase 3** — Haiku judges each response on:
   - Element coverage (0–10): did it include expected elements?
   - Avoidance quality (0–10): did it avoid harmful elements?
   - Naturalness (0–10): does it read like a real hotel reply?
4. **Phase 4** — Prints a markdown report with per-element recall, judge score distributions, and sample critiques

**Output:**
- `eval/results.json` — full results with all scores and critiques
- Console report with summary statistics

Run this periodically to validate that prompt changes maintain or improve quality.

## Response Elements Reference

The tool works with 10 core response elements:

1. **Problem Acceptance** — Acknowledging the guest's concern directly
2. **Taking Responsibility** — Hotel owning the issue without blame-shifting
3. **Regret** — Expression of disappointment or apology
4. **Action** — Specific steps being taken to resolve or prevent recurrence
5. **Response Tailoring** — Addressing specific topics from the review
6. **Style Matching** — Tone and language matching the guest's review
7. **Thanks** — Gratitude for feedback or business
8. **Loyalty** — Appeal to return or continue the relationship
9. **Revisit Request** — Explicit invitation to book again
10. **Apology** — Direct apology (distinct from regret)

Each element has a measured causal effect on ratings and revenue. The AI deliberately includes high-impact elements and avoids harmful ones.

## Architecture

### Frontend Flow

1. User enters review + type (negative/positive)
2. Frontend streams to `/api/generate/stream` (or `/api/practice/stream`)
3. ReadableStream reader parses SSE events
4. Token chunks update `streamingText` state (visible immediately)
5. When `done` event arrives, parse metadata and update result state
6. Elements, rationale, and changes display

### Backend Flow

1. Request → FastAPI route
2. Route calls `coach.stream_generate()` or `coach.stream_practice()`
3. Async generator yields SSE lines as they arrive
4. Prompt is structured to output visible text first, then `---JSON---` delimiter, then metadata JSON
5. Generator accumulates text until delimiter, yields token chunks before it
6. After delimiter, parses remaining text as JSON, yields `done` event with parsed metadata

### Prompt Structure

Both `stream_generate()` and `stream_practice()` use prompts that output:

```
[visible response text]

---JSON---
{metadata_json_here}
```

This allows:
- Streaming the response text token-by-token (visible immediately)
- Accumulating metadata JSON server-side (sent once in `done` event)
- Frontend gets responsive text + structured data

## Deployment

### Vercel

The app is deployed on Vercel with:
- Frontend: React + Vite (automatic build on push)
- Backend: Python ASGI on serverless functions

**Deploy:**
1. Push to GitHub
2. Vercel automatically builds and deploys on main branch
3. Set `ANTHROPIC_API_KEY` as an environment variable in Vercel project settings

**Files:**
- `vercel.json` — build and runtime configuration
- `api/index.py` — serverless entry point (mirrors `backend/main.py`)

### Local Testing Before Deploy

```bash
# Test SSE streaming manually
curl -N -X POST http://localhost:8000/api/generate/stream \
  -H 'Content-Type: application/json' \
  -d '{"review":"AC was broken the whole stay","review_type":"negative"}'

# Expected output:
# event: token
# data: "Excellent"
# 
# event: token
# data: "..."
# ...
# event: done
# data: {"elements_used":["problem_acceptance",...],...}
```

## Project Structure

```
review-project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx      # Research findings & charts
│   │   │   ├── Generate.jsx       # AI response generation
│   │   │   ├── Practice.jsx       # Interactive coaching
│   │   │   └── ElementPill.jsx    # Element display component
│   │   ├── lib/
│   │   │   └── elements.js        # Element metadata & labels
│   │   ├── App.jsx               # Main app layout & navigation
│   │   └── main.css              # Tailwind styles
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── coach.py                   # Core coaching logic + streaming generators
│   ├── findings.py                # Research data (elements, causal estimates)
│   ├── main.py                    # FastAPI app + routes
│   ├── requirements.txt
│   └── .env                       # API keys (git-ignored)
│
├── api/
│   └── index.py                   # Vercel serverless entry point
│
├── eval/
│   ├── run_eval.py               # Prompt evaluation workflow
│   ├── dataset.json              # Generated test reviews (git-ignored)
│   └── results.json              # Evaluation results (git-ignored)
│
├── vercel.json
└── README.md (this file)
```

## Contributing

### Making Changes

1. Create a feature branch
2. Make changes locally
3. Test in all three tabs (Findings, Generate, Practice)
4. Run eval workflow to ensure prompts still quality
5. Commit with clear messages
6. Push and create a PR

### Prompt Tuning

If you modify `_GENERATE_INSTRUCTIONS` or `_PRACTICE_INSTRUCTIONS` in `backend/coach.py`:

1. Run `python eval/run_eval.py` to score the new prompts
2. Check the report — target ≥7/10 average across all dimensions
3. If scores drop, review the critiques and iterate
4. Once satisfied, commit both the prompt change and updated `eval/results.json`

## Performance Notes

- **SSE Streaming:** Responses appear token-by-token (typically 200–500ms to first token, then ~50ms between chunks)
- **Eval Workflow:** Full evaluation (~20 reviews × 3 calls per review) takes ~5–10 minutes
- **Graph Interactivity:** Click any bar series to highlight it; click elsewhere to reset

## Known Limitations

- Streaming only works in browsers with `ReadableStream` support (modern Chrome, Firefox, Safari, Edge)
- Vercel's serverless cold starts (~1–2s) may add latency on first request of the day
- Eval workflow uses random samples and causal estimates; individual results may vary

## Annotation Prompt Versioning (v1 → v2)

Separately from the app, this project includes an annotation pipeline that uses Claude Haiku to label hotel management responses to negative reviews across three quality attributes — **accept** (acknowledges something went wrong), **regret** (genuine sorrow for the cause), and **responsibility** (active ownership / commitment to act). Each attribute has its own `annotate_<attr>.py` script with an attribute-specific system prompt and labeled few-shot examples.

The prompts went through two iterations. The full self-contained scripts for each version live in two folders, **`annotation_v1/`** and **`annotation_v2/`** (each with the three `annotate_*.py` files plus a `results/` subfolder of prediction CSVs). These folders are shared out-of-band, not committed to this repo. Full write-ups: [`reports/ANNOTATION_FINDINGS_REPORT_v1.md`](reports/ANNOTATION_FINDINGS_REPORT_v1.md) and [`reports/ANNOTATION_FINDINGS_REPORT_v2.md`](reports/ANNOTATION_FINDINGS_REPORT_v2.md).

### What changed in v2, and why

v1 prompts used two anchor few-shot examples (one clear positive, one clear boilerplate negative) with relatively narrow rules. Evaluating v1 against the full 1,239-row training set exposed a large generalization gap — the model rejected many valid responses it hadn't been explicitly taught to recognize. v2 addressed this with three changes:

- **Shared — third few-shot example.** Added an IHG "Manager on Duty" template response (positive on all three attributes) that sits between the clear-positive and clear-negative anchors. v1's two examples left this middle ground ambiguous.
- **ACCEPT — broadened acknowledgment rules.** v2 explicitly counts "apologize for any inconvenience" / "sorry for any inconvenience" (generic phrasing still counts because of the *for* construction), "sorry you were not satisfied with [specific element]", and "apologize for the shortcomings/shortfalls". The negative boundary "apologize *that* your stay did not meet expectations" = 0 is documented as the canonical contrast.
- **REGRET — the FOR vs THAT distinction.** v2 makes "apologize **FOR** [cause]" = 1 (owns the cause, even if generic) vs. "apologize **THAT** your stay did not meet expectations" = 0 (comments on the outcome) the explicit centerpiece, and counts "very sorry you were not satisfied with [element]".
- **RESPONSIBILITY — recognize soft commitments (largest change).** v1 anchored on "please email me directly". v2 adds named-contact escalation ("please do not hesitate to ask the Manager on Duty"), "take the necessary actions…", "work diligently to rectify…", "enables us to target problem areas" + apology, "we welcome any opportunity to improve" + apology, and "I have taken note of your concerns"; and marks passive "all of our reviews are evaluated by management" = 0.

### Impact

**Test set (≈295–302 rows), F1:**

| Attribute | v1 F1 | v2 F1 | Δ |
|---|---|---|---|
| Accept | 0.814 | 0.844 | +0.030 |
| Regret | 0.722 | 0.777 | +0.055 |
| Responsibility | 0.782 | 0.775 | −0.007 |
| **Average** | **0.773** | **0.799** | **+0.026** |

**Training set (≈1,119–1,153 rows), F1:**

| Attribute | v1 F1 | v2 F1 | Δ | Recall v1 → v2 |
|---|---|---|---|---|
| Accept | 0.782 | 0.840 | +0.058 | 0.734 → 0.881 |
| Regret | 0.701 | 0.785 | +0.084 | 0.636 → 0.812 |
| Responsibility | 0.632 | 0.768 | +0.136 | 0.526 → 0.788 |
| **Average** | **0.705** | **0.798** | **+0.093** | |

The key signal is the **cross-split gap** (test F1 minus training F1), which measures over-calibration to the test set. It closed from **−0.068** average in v1 (responsibility alone was −0.150) to **−0.001** in v2 — test and training performance became statistically indistinguishable, evidence that v2's broader definitions generalize rather than just fitting the test distribution. Responsibility is flat on the *test* set (its specific cases were already the v1 iteration target) but improved most on the unseen training set.

> Note on results CSVs: `annotation_v2/results/` holds the v2 test-set (`results_<attr>.csv`) and training-set (`results_<attr>_train_v2.csv`) predictions. `annotation_v1/results/` holds `results_training.csv` (v1 predictions for all three attributes) — the v1 per-attribute *test* CSVs were overwritten by the v2 runs, so the v1 test numbers above come from the report.

## License

Internal research tool. Contact for licensing or usage outside Anthropic.

## Support

For bugs or feature requests, open an issue on GitHub or contact the team.
