import { useState } from "react";

const ELEMENT_LABELS = {
  problem_acceptance: "Problem Acceptance",
  taking_responsibility: "Taking Responsibility",
  regret: "Regret",
  action: "Action Promises",
  response_tailoring: "Response Tailoring",
  style_matching: "Style Matching",
  thanks: "Thanks",
  loyalty: "Loyalty Mention",
  revisit_request: "Revisit Request",
  apology: "Apology",
};

// Which elements are only for negative reviews
const NEG_ONLY = new Set(["problem_acceptance", "taking_responsibility", "regret", "action"]);

function ElementPill({ elementKey, value, meta, reviewType }) {
  if (reviewType === "positive" && NEG_ONLY.has(elementKey)) return null;
  if (value === null) return null;

  const label = ELEMENT_LABELS[elementKey] || elementKey;
  const direction = meta?.direction ?? "neutral";

  // For continuous values (tailoring, style_matching): show as a score
  const isContinuous = typeof value === "number" && !Number.isInteger(value) || (typeof value === "number" && elementKey !== "thanks");
  const isPresent = typeof value === "boolean" ? value : value > 0.3;

  let colorClass = "bg-gray-800 text-gray-400 border-gray-700";
  if (isPresent || (typeof value === "number" && value > 0.3)) {
    if (direction === "good") colorClass = "bg-green-900/50 text-green-300 border-green-700";
    else if (direction === "bad") colorClass = "bg-red-900/50 text-red-300 border-red-700";
    else if (direction === "mixed") colorClass = "bg-yellow-900/50 text-yellow-300 border-yellow-700";
    else colorClass = "bg-gray-800 text-gray-400 border-gray-700";
  }

  const displayValue =
    typeof value === "boolean"
      ? value ? "✓ Present" : "✗ Absent"
      : `${Math.round(value * 100)}%`;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {label}
      <span className="opacity-70">{displayValue}</span>
    </span>
  );
}

function SuggestionCard({ suggestion }) {
  const impactStyles = {
    positive: {
      border: "border-green-700",
      bg: "bg-green-900/30",
      badge: "bg-green-900/50 text-green-300",
      icon: "✓",
    },
    negative: {
      border: "border-red-700",
      bg: "bg-red-900/30",
      badge: "bg-red-900/50 text-red-300",
      icon: "⚠",
    },
    opportunity: {
      border: "border-blue-700",
      bg: "bg-blue-900/30",
      badge: "bg-blue-900/50 text-blue-300",
      icon: "→",
    },
  };

  const style = impactStyles[suggestion.impact] ?? impactStyles.opportunity;
  const label = ELEMENT_LABELS[suggestion.element] || suggestion.element;

  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${style.badge}`}>
          {style.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-100">{label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
              {suggestion.impact === "positive" ? "strength" : suggestion.impact === "negative" ? "risk" : "opportunity"}
            </span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{suggestion.message}</p>
        </div>
      </div>
    </div>
  );
}

export default function Analyzer() {
  const [review, setReview] = useState("");
  const [response, setResponse] = useState("");
  const [reviewType, setReviewType] = useState("negative");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!review.trim() || !response.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review, response, review_type: reviewType }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const elements = result?.detected_elements ?? {};
  const meta = result?.detected_elements_meta ?? {};
  const suggestions = result?.suggestions ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Response Analyzer</h2>
        <p className="text-gray-400 text-sm mt-1">
          Paste a guest review and your draft response. We'll identify which response elements are present and give evidence-based suggestions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Review type toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Review type
          </label>
          <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setReviewType("negative")}
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                reviewType === "negative"
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Negative (1–3★)
            </button>
            <button
              type="button"
              onClick={() => setReviewType("positive")}
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                reviewType === "positive"
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Positive (4–5★)
            </button>
          </div>
        </div>

        {/* Two-column layout for inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Guest review
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={8}
              placeholder="Paste the guest's review here…"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Your draft response
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={8}
              placeholder="Paste your draft response here…"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !review.trim() || !response.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing…
            </>
          ) : (
            "Analyze response"
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 pt-2">
          {/* Overall assessment */}
          <div className="rounded-xl border border-blue-800 bg-blue-950/40 p-5">
            <h3 className="text-sm font-semibold text-blue-300 mb-1">Overall assessment</h3>
            <p className="text-sm text-blue-200 leading-relaxed">{result.overall}</p>
          </div>

          {/* Element pills */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Detected elements</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(elements).map(([key, value]) => (
                <ElementPill
                  key={key}
                  elementKey={key}
                  value={value}
                  meta={meta[key]}
                  reviewType={reviewType}
                />
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Helpful element present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Harmful element present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> Mixed effect
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /> Absent / neutral
              </span>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Suggestions ({suggestions.length})
              </h3>
              <div className="space-y-3">
                {suggestions.map((s, i) => (
                  <SuggestionCard key={i} suggestion={s} />
                ))}
              </div>
            </div>
          )}

          {suggestions.length === 0 && (
            <div className="rounded-lg border border-green-800 bg-green-900/30 p-4 text-sm text-green-300">
              <strong>No major issues found.</strong> Your response appears well-crafted based on the research findings.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
