import { useEffect, useRef, useState } from "react";
import ElementPill from "./ElementPill";
import { SAMPLE_REVIEWS } from "../lib/sampleReviews";

const snippet = (text) => {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= 120) return flat;
  const cut = flat.slice(0, 120);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[.,;:!?]+$/, "") + "…";
};

const MAX_GENERATES = 3;

export default function Generate() {
  const [review, setReview] = useState("");
  const [reviewType, setReviewType] = useState("negative");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generateCount, setGenerateCount] = useState(() =>
    parseInt(sessionStorage.getItem("generateCount") || "0")
  );

  const resultsRef = useRef(null);
  const hasScrolledRef = useRef(false);
  const textareaRef = useRef(null);

  const sampleReviews = SAMPLE_REVIEWS.filter((r) => r.type === reviewType);

  const useSample = (sample) => {
    setReview(sample.text);
    setResult(null);
    setStreamingText("");
    setError(null);
    textareaRef.current?.focus();
  };

  // Scroll to the results the first time content starts streaming in, so the
  // user can see the response is being generated rather than waiting blindly.
  useEffect(() => {
    if (streamingText && !hasScrolledRef.current && resultsRef.current) {
      hasScrolledRef.current = true;
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [streamingText]);

  const submit = async (e) => {
    e.preventDefault();
    if (!review.trim() || generateCount >= MAX_GENERATES) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStreamingText("");
    setCopied(false);
    hasScrolledRef.current = false;
    try {
      const res = await fetch("/api/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review, review_type: reviewType }),
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
              setGenerateCount((prev) => {
                const next = prev + 1;
                sessionStorage.setItem("generateCount", String(next));
                return next;
              });
            }
          } else if (eventLine === "event: error") {
            const dataLine = dataLines.find((l) => l.startsWith("data: "));
            const message = dataLine ? JSON.parse(dataLine.slice(6)).message : "Stream failed.";
            throw new Error(message);
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = async () => {
    const text = result?.response || streamingText;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const usedMeta = result?.elements_used_meta ?? {};
  const avoidedMeta = result?.elements_avoided_meta ?? {};

  const elementsUsed = result?.elements_used ?? [];
  const elementsAvoided = (() => {
    const raw = result?.elements_avoided ?? [];
    if (!elementsUsed.includes("style_matching") && !raw.includes("style_matching")) {
      return [...raw, "style_matching"];
    }
    return raw;
  })();

  return (
    <>
      {/* HERO - dark */}
      <section className="bg-ink text-white">
        <div className="max-w-[1200px] mx-auto px-6 py-24 sm:py-28">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-x-12 gap-y-14 items-start">
            <div className="min-w-0">
          <div className="animate-fadeUp">
            <h1 className="headline-serif text-5xl sm:text-6xl text-white mt-5">
              A model reply, written <em>by the research</em>.
            </h1>
            <p className="text-ink-400 text-lg mt-6 leading-relaxed max-w-2xl">
              Paste a guest review. The AI writes the ideal management reply, deliberately using the elements that
              raise ratings and revenue, and avoiding the ones that hurt them.
            </p>
          </div>

          {/* Form on dark */}
          <form onSubmit={submit} className="mt-12 max-w-3xl space-y-6 animate-fadeUp">
            <div>
              <div className="inline-flex rounded-lg border border-ink-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setReviewType("negative")}
                  className={`px-5 py-2 text-sm font-medium transition-colors ${
                    reviewType === "negative"
                      ? "bg-amber-accent text-ink"
                      : "bg-ink-700 text-ink-400 hover:text-white"
                  }`}
                >
                  Negative (1–3★)
                </button>
                <button
                  type="button"
                  onClick={() => setReviewType("positive")}
                  className={`px-5 py-2 text-sm font-medium transition-colors ${
                    reviewType === "positive"
                      ? "bg-amber-accent text-ink"
                      : "bg-ink-700 text-ink-400 hover:text-white"
                  }`}
                >
                  Positive (4–5★)
                </button>
              </div>
              <p className="text-xs text-ink-500 mt-2">
                Select the review type above before pasting your review.
              </p>
            </div>

            <div>
              <textarea
                ref={textareaRef}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={6}
                placeholder="Paste the guest's review here…"
                className="w-full rounded-lg bg-ink-800 border border-ink-700 px-4 py-3 text-sm text-white placeholder-ink-500 focus:outline-none focus:border-amber-accent transition-colors resize-none font-sans"
                required
              />
            </div>

            {generateCount >= MAX_GENERATES ? (
              <p className="text-sm text-ink-400 italic">
                Session limit reached. You can generate up to {MAX_GENERATES} responses per session.
              </p>
            ) : (
              <button type="submit" disabled={loading || !review.trim()} className="btn-primary">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Generating…
                  </>
                ) : (
                  <>Generate model response <span aria-hidden>→</span> ({MAX_GENERATES - generateCount} left)</>
                )}
              </button>
            )}
          </form>

          {error && (
            <div className="mt-8 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
              <strong>Error:</strong> {error}
            </div>
          )}
            </div>

            <aside className="animate-fadeUp lg:pt-2">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-amber-accent mb-1.5">
                Try one of these
              </p>
              <p className="text-sm text-ink-500 mb-5 leading-relaxed">
                Real guest reviews. Click one to drop it into the box.
              </p>
              <div key={reviewType} className="space-y-3 animate-slideIn">
                {sampleReviews.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => useSample(s)}
                    className="group block w-full text-left rounded-lg bg-ink-800 border border-ink-700 p-4 transition-all duration-150 hover:border-amber-accent hover:bg-ink-700/50 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-mono uppercase tracking-wide text-amber-accent">
                        {s.topic}
                      </span>
                      <span className="text-ink-500 group-hover:text-amber-accent transition-colors" aria-hidden>
                        →
                      </span>
                    </div>
                    <p className="text-sm text-ink-400 leading-snug">{snippet(s.text)}</p>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* RESULTS - cream */}
      {(result || streamingText) && (
        <section ref={resultsRef} className="bg-cream scroll-mt-16">
          <div className="max-w-[1200px] mx-auto px-6 py-24">
            <div className="max-w-2xl mb-12 animate-fadeUp">
              <h2 className="headline-serif text-4xl sm:text-5xl text-ink mt-4">
                Here's the reply, and <em>why it works</em>.
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger">
              {/* Response card spans 2 cols on lg */}
              <div className="card lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-cream-200 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3a3a35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-ink">Generated response</h3>
                  </div>
                  {result && (
                    <button onClick={copyResponse} className="btn-outline !text-ink !border-ink-600 hover:!bg-ink hover:!text-white">
                      {copied ? "✓ Copied" : "Copy"}
                    </button>
                  )}
                </div>
                <p className="text-base text-ink-600 leading-relaxed whitespace-pre-wrap">
                  {streamingText || (result?.response ?? "")}
                </p>
              </div>

              {result?.rationale && (
                <div className="card-dark text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-md bg-ink-700 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-white">Why this works</h3>
                  </div>
                  <p className="text-sm text-ink-400 leading-relaxed">{result.rationale}</p>
                </div>
              )}

              {elementsUsed.length > 0 && (
                <div className="card lg:col-span-2">
                  <h3 className="font-serif text-2xl font-bold text-ink mt-2 mb-4">Elements applied</h3>
                  <div className="flex flex-wrap gap-2">
                    {elementsUsed.map((key) => (
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

              {elementsAvoided.length > 0 && (
                <div className="card">
                  <h3 className="font-serif text-2xl font-bold text-ink mt-2 mb-4">Elements skipped</h3>
                  <div className="flex flex-wrap gap-2">
                    {elementsAvoided.map((key) => (
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
          </div>
        </section>
      )}
    </>
  );
}
