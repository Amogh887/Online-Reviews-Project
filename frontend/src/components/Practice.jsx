import { useEffect, useMemo, useRef, useState } from "react";
import ElementPill from "./ElementPill";
import { labelFor } from "../lib/elements";

const CHANGE_BADGES = {
  added:        { label: "Added",        cls: "bg-[#5b8a5a]/15 text-[#3f6b3e] border-[#5b8a5a]/40" },
  removed:      { label: "Removed",      cls: "bg-[#b94a3d]/15 text-[#8a3225] border-[#b94a3d]/40" },
  strengthened: { label: "Strengthened", cls: "bg-amber-accent/15 text-amber-deep border-amber-accent/40" },
  softened:     { label: "Softened",     cls: "bg-cream-200 text-ink-600 border-ink-400/30" },
};

function ChangeCard({ change }) {
  const badge = CHANGE_BADGES[change.action] ?? {
    label: change.action,
    cls: "bg-cream-200 text-ink-600 border-ink-400/30",
  };
  return (
    <div className="card !p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border ${badge.cls}`}>
          {badge.label}
        </span>
        <span className="text-sm font-semibold text-ink">{labelFor(change.element)}</span>
      </div>
      <p className="text-sm text-ink-600 leading-relaxed">{change.reason}</p>
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
  const [streamingText, setStreamingText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [elementTab, setElementTab] = useState("original");
  const [practiceCount, setPracticeCount] = useState(() =>
    parseInt(sessionStorage.getItem("practiceCount") || "0")
  );

  const resultsRef = useRef(null);
  const hasScrolledRef = useRef(false);

  // Scroll to the rewrite the first time it starts streaming, so the user sees
  // feedback is being generated rather than waiting blindly.
  useEffect(() => {
    if (streamingText && !hasScrolledRef.current && resultsRef.current) {
      hasScrolledRef.current = true;
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [streamingText]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/samples");
        const data = await res.json();
        const grouped = { negative: [], positive: [] };
        for (const s of data.samples) grouped[s.type]?.push(s);
        setSamples(grouped);
        setCurrentSample(grouped[reviewType][0] ?? null);
      } catch (err) {
        setError("Failed to load samples: " + err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const MAX_PRACTICES = 3;

  const submit = async (e) => {
    e.preventDefault();
    if (!currentSample || !response.trim() || practiceCount >= MAX_PRACTICES) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStreamingText("");
    setElementTab("original");
    hasScrolledRef.current = false;
    try {
      const res = await fetch("/api/practice/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review: currentSample.text,
          response,
          review_type: reviewType,
        }),
      });
      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        for (const line of lines) {
          const [eventLine, ...dataLines] = line.trim().split("\n");
          if (eventLine === "event: token") {
            const dataLine = dataLines.find((l) => l.startsWith("data: "));
            if (dataLine) {
              const text = JSON.parse(dataLine.slice(6));
              setStreamingText((prev) => prev + text);
            }
          } else if (eventLine === "event: done") {
            const dataLine = dataLines.find((l) => l.startsWith("data: "));
            if (dataLine) {
              const metadata = JSON.parse(dataLine.slice(6));
              setResult(metadata);
              setPracticeCount((prev) => {
                const next = prev + 1;
                sessionStorage.setItem("practiceCount", String(next));
                return next;
              });
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const elements = result?.detected_elements ?? {};
  const meta = result?.detected_elements_meta ?? {};
  const changes = result?.changes ?? [];

  const revisedElements = useMemo(() => {
    if (!result) return {};
    const revised = { ...elements };
    for (const change of changes) {
      if (change.action === "added") revised[change.element] = true;
      else if (change.action === "removed") revised[change.element] = false;
      else if (change.action === "strengthened") revised[change.element] = true;
      else if (change.action === "softened") revised[change.element] = 0.3;
    }
    return revised;
  }, [result, elements, changes]);

  return (
    <>
      {/* HERO - dark */}
      <section className="bg-ink text-white">
        <div className="max-w-[1200px] mx-auto px-6 py-24 sm:py-28">
          <div className="max-w-3xl animate-fadeUp">
            <h1 className="headline-serif text-5xl sm:text-6xl text-white mt-5">
              Write a reply. Get it <em>rewritten by the research</em>.
            </h1>
            <p className="text-ink-400 text-lg mt-6 leading-relaxed max-w-2xl">
              A sample guest review is shown below. Draft your response, and the AI rewrites it with
              research-backed improvements, explaining every change with the causal estimate behind it.
            </p>
          </div>
        </div>
      </section>

      {/* SAMPLE + FORM - cream */}
      <section className="bg-cream">
        <div className="max-w-[1200px] mx-auto px-6 py-20">
          {/* Review type */}
          <div className="mb-8 animate-fadeUp">
            <div className="inline-flex rounded-lg border border-ink-400/30 overflow-hidden mt-0 ml-0 sm:ml-0 align-middle">
              <button
                type="button"
                onClick={() => setReviewType("negative")}
                className={`px-5 py-2 text-sm font-medium transition-colors ${
                  reviewType === "negative"
                    ? "bg-ink text-white"
                    : "bg-cream-200 text-ink-600 hover:bg-cream-300"
                }`}
              >
                Negative (1–3★)
              </button>
              <button
                type="button"
                onClick={() => setReviewType("positive")}
                className={`px-5 py-2 text-sm font-medium transition-colors ${
                  reviewType === "positive"
                    ? "bg-ink text-white"
                    : "bg-cream-200 text-ink-600 hover:bg-cream-300"
                }`}
              >
                Positive (4–5★)
              </button>
            </div>
          </div>

          {/* Sample card */}
          <div className="card mb-8 animate-fadeUp">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-cream-200 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3a3a35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={pickCuratedRandom} disabled={sampleLoading}
                  className="text-xs px-3 py-1.5 rounded-md border border-ink-400/30 text-ink-600 hover:bg-cream-200 transition-colors disabled:opacity-50">
                  ↻ Another sample
                </button>
                <button type="button" onClick={generateFreshSample} disabled={sampleLoading}
                  className="text-xs px-3 py-1.5 rounded-md border border-amber-accent text-amber-deep hover:bg-amber-accent/10 transition-colors disabled:opacity-50">
                  {sampleLoading ? "Generating…" : "✨ Generate fresh"}
                </button>
              </div>
            </div>
            <p className="text-base text-ink leading-relaxed whitespace-pre-wrap font-serif italic min-h-[3rem]">
              {currentSample?.text ? `“${currentSample.text}”` : "Loading…"}
            </p>
          </div>

          {/* Response form */}
          <form onSubmit={submit} className="space-y-5 animate-fadeUp">
            <div>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={6}
                placeholder="Write the response you would send…"
                className="w-full rounded-lg bg-white border border-ink-400/30 px-4 py-3 text-sm text-ink-600 placeholder-ink-400 focus:outline-none focus:border-amber-accent transition-colors resize-none shadow-card"
                required
              />
            </div>

            {practiceCount >= MAX_PRACTICES ? (
              <p className="text-sm text-ink-600 italic">
                Session limit reached. You can use the practice coach up to {MAX_PRACTICES} times per session.
              </p>
            ) : (
              <button type="submit" disabled={loading || !currentSample || !response.trim()} className="btn-primary">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Analyzing…
                  </>
                ) : (
                  <>Get coaching feedback <span aria-hidden>→</span> ({MAX_PRACTICES - practiceCount} left)</>
                )}
              </button>
            )}

            {error && (
              <div className="rounded-lg border border-red-400/40 bg-red-50 p-4 text-sm text-red-800">
                <strong>Error:</strong> {error}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* RESULTS - dark */}
      {(result || streamingText) && (
        <section ref={resultsRef} className="bg-ink text-white scroll-mt-16">
          <div className="max-w-[1200px] mx-auto px-6 py-24">
            <div className="max-w-2xl mb-12 animate-fadeUp">
              <h2 className="headline-serif text-4xl sm:text-5xl text-white mt-4">
                What changed, and <em>why</em>.
              </h2>
              {result?.overall && (
                <p className="text-ink-400 text-base mt-6 leading-relaxed border-l-2 border-amber-accent pl-5">
                  {result.overall}
                </p>
              )}
            </div>

            {/* Side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger mb-12">
              <div className="card-dark">
                <p className="text-sm text-ink-400 leading-relaxed whitespace-pre-wrap">{response}</p>
              </div>
              <div className="card-dark !border-amber-accent/40">
                <p className="text-base text-white leading-relaxed whitespace-pre-wrap font-serif">
                  {streamingText || (result?.rewritten_response ?? "")}
                </p>
              </div>
            </div>

            {/* Element pills - tabbed */}
            <div className="mb-12 animate-fadeUp">
              <div className="flex border-b border-ink-700 mb-5">
                <button
                  onClick={() => setElementTab("original")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    elementTab === "original"
                      ? "text-white border-amber-accent"
                      : "text-ink-400 border-transparent hover:text-white"
                  }`}
                >
                  Elements in your original response
                </button>
                <button
                  onClick={() => setElementTab("revised")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    elementTab === "revised"
                      ? "text-white border-amber-accent"
                      : "text-ink-400 border-transparent hover:text-white"
                  }`}
                >
                  Elements in the revised response
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(elementTab === "original" ? elements : revisedElements).map(([key, value]) => (
                  <ElementPill
                    key={key}
                    elementKey={key}
                    value={value}
                    meta={meta[key]}
                    reviewType={reviewType}
                    onDark
                  />
                ))}
              </div>
            </div>

            {/* Changes */}
            {changes.length > 0 && (
              <div className="animate-fadeUp">
                <h3 className="font-serif text-2xl font-bold text-white mb-5">
                  {changes.length} edits, with reasoning
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
                  {changes.map((c, i) => (
                    <ChangeCard key={i} change={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
