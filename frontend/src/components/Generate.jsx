import { useState } from "react";
import ElementPill from "./ElementPill";

export default function Generate() {
  const [review, setReview] = useState("");
  const [reviewType, setReviewType] = useState("negative");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!review.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review, review_type: reviewType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Server error ${res.status}`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = async () => {
    if (!result?.response) return;
    await navigator.clipboard.writeText(result.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const usedMeta = result?.elements_used_meta ?? {};
  const avoidedMeta = result?.elements_avoided_meta ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Generate a Model Response</h2>
        <p className="text-gray-400 text-sm mt-1">
          Paste a guest review. The AI writes the ideal management response — deliberately using elements the research shows help, and avoiding the ones that hurt.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Review type</label>
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

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Guest review</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={6}
            placeholder="Paste the guest's review here…"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !review.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating…
            </>
          ) : (
            "Generate model response"
          )}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="space-y-6 pt-2">
          {/* Generated response */}
          <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300">Generated response</h3>
              <button
                onClick={copyResponse}
                className="text-xs px-3 py-1 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap">
              {result.response}
            </p>
          </div>

          {/* Rationale */}
          {result.rationale && (
            <div className="rounded-xl border border-blue-800 bg-blue-950/40 p-5">
              <h3 className="text-sm font-semibold text-blue-300 mb-1">Why this works</h3>
              <p className="text-sm text-blue-200 leading-relaxed">{result.rationale}</p>
            </div>
          )}

          {/* Elements used */}
          {result.elements_used?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Elements deliberately used
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.elements_used.map((key) => (
                  <ElementPill
                    key={key}
                    elementKey={key}
                    value={true}
                    meta={usedMeta[key]}
                    reviewType={reviewType}
                    intent="used"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Elements avoided */}
          {result.elements_avoided?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Elements deliberately avoided
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.elements_avoided.map((key) => (
                  <ElementPill
                    key={key}
                    elementKey={key}
                    value={true}
                    meta={avoidedMeta[key]}
                    reviewType={reviewType}
                    intent="avoided"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
