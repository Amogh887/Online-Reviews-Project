import { useEffect, useState } from "react";
import ElementPill from "./ElementPill";
import { labelFor } from "../lib/elements";

const CHANGE_BADGES = {
  added:        { label: "Added",        cls: "bg-green-900/50 text-green-300" },
  removed:      { label: "Removed",      cls: "bg-red-900/50 text-red-300" },
  strengthened: { label: "Strengthened", cls: "bg-blue-900/50 text-blue-300" },
  softened:     { label: "Softened",     cls: "bg-yellow-900/50 text-yellow-300" },
};

function ChangeCard({ change }) {
  const badge = CHANGE_BADGES[change.action] ?? {
    label: change.action,
    cls: "bg-gray-800 text-gray-300",
  };
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
          {badge.label}
        </span>
        <span className="text-sm font-semibold text-gray-100">{labelFor(change.element)}</span>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">{change.reason}</p>
    </div>
  );
}

export default function Practice() {
  const [reviewType, setReviewType] = useState("negative");
  const [samples, setSamples] = useState({ negative: [], positive: [] });
  const [currentSample, setCurrentSample] = useState(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetch curated samples once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/samples");
        const data = await res.json();
        const grouped = { negative: [], positive: [] };
        for (const s of data.samples) grouped[s.type]?.push(s);
        setSamples(grouped);
        // Pick first sample of current type
        setCurrentSample(grouped[reviewType][0] ?? null);
      } catch (err) {
        setError("Failed to load samples: " + err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When review type toggles, switch the sample to one of that type
  useEffect(() => {
    if (!samples[reviewType]?.length) return;
    setCurrentSample(samples[reviewType][0]);
    setResult(null);
    setResponse("");
  }, [reviewType, samples]);

  const pickCuratedRandom = () => {
    const list = samples[reviewType] ?? [];
    if (!list.length) return;
    const others = list.filter((s) => s.id !== currentSample?.id);
    const pool = others.length ? others : list;
    setCurrentSample(pool[Math.floor(Math.random() * pool.length)]);
    setResult(null);
    setResponse("");
  };

  const generateFreshSample = async () => {
    setSampleLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/samples/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_type: reviewType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Server error ${res.status}`);
      }
      setCurrentSample(await res.json());
      setResult(null);
      setResponse("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSampleLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!currentSample || !response.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review: currentSample.text,
          response,
          review_type: reviewType,
        }),
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

  const elements = result?.detected_elements ?? {};
  const meta = result?.detected_elements_meta ?? {};
  const changes = result?.changes ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Practice Mode</h2>
        <p className="text-gray-400 text-sm mt-1">
          A sample guest review is shown. Write your response, then the AI rewrites it with research-backed improvements and shows you what changed.
        </p>
      </div>

      {/* Review type toggle */}
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

      {/* Sample review card */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-300">Sample guest review</h3>
            {currentSample?.topic && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                {currentSample.topic}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={pickCuratedRandom}
              disabled={sampleLoading}
              className="text-xs px-3 py-1 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              ↻ Another sample
            </button>
            <button
              type="button"
              onClick={generateFreshSample}
              disabled={sampleLoading}
              className="text-xs px-3 py-1 rounded-md border border-blue-700 text-blue-300 hover:bg-blue-950/50 transition-colors disabled:opacity-50"
            >
              {sampleLoading ? "Generating…" : "✨ Generate fresh"}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap min-h-[3rem]">
          {currentSample?.text ?? "Loading…"}
        </p>
      </div>

      {/* Response form */}
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Your draft response
          </label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={6}
            placeholder="Write the response you would send…"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !currentSample || !response.trim()}
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
            "Get coaching feedback"
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
          {/* Overall */}
          <div className="rounded-xl border border-blue-800 bg-blue-950/40 p-5">
            <h3 className="text-sm font-semibold text-blue-300 mb-1">Overall</h3>
            <p className="text-sm text-blue-200 leading-relaxed">{result.overall}</p>
          </div>

          {/* Side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Your response</h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{response}</p>
            </div>
            <div className="rounded-xl border border-green-800 bg-green-950/30 p-5">
              <h3 className="text-sm font-semibold text-green-300 mb-2">Suggested rewrite</h3>
              <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap">
                {result.rewritten_response}
              </p>
            </div>
          </div>

          {/* Element pills */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Elements detected in your response
            </h3>
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
          </div>

          {/* Changes */}
          {changes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                What changed and why ({changes.length})
              </h3>
              <div className="space-y-3">
                {changes.map((c, i) => (
                  <ChangeCard key={i} change={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
