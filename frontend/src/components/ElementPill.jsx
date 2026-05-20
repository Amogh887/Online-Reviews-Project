import { labelFor, NEG_ONLY } from "../lib/elements";

// onDark: when rendered on the dark ink section, use lighter pill backgrounds
export default function ElementPill({ elementKey, value, meta, reviewType, intent = "detected", onDark = false }) {
  if (reviewType === "positive" && NEG_ONLY.has(elementKey)) return null;
  if (intent === "detected" && (value === null || value === undefined)) return null;

  const direction = meta?.direction ?? "neutral";
  const label = labelFor(elementKey);

  const isPresent =
    typeof value === "boolean"
      ? value
      : typeof value === "number"
      ? value > 0.3
      : false;

  // palette
  const palette = onDark
    ? {
        neutral: "bg-ink-700 text-ink-400 border-ink-700",
        good:    "bg-[#5b8a5a]/20 text-[#a8d3a4] border-[#5b8a5a]/40",
        bad:     "bg-[#b94a3d]/20 text-[#e8a89e] border-[#b94a3d]/40",
        mixed:   "bg-amber-accent/20 text-amber-accent border-amber-accent/40",
      }
    : {
        neutral: "bg-cream-200 text-ink-600 border-ink-400/20",
        good:    "bg-[#5b8a5a]/15 text-[#3f6b3e] border-[#5b8a5a]/40",
        bad:     "bg-[#b94a3d]/15 text-[#8a3225] border-[#b94a3d]/40",
        mixed:   "bg-amber-accent/15 text-amber-deep border-amber-accent/40",
      };

  let colorClass = palette.neutral;

  if (intent === "used") {
    colorClass = palette.good;
  } else if (intent === "avoided") {
    colorClass = palette.bad;
  } else if (isPresent) {
    if (direction === "good") colorClass = palette.good;
    else if (direction === "bad") colorClass = palette.bad;
    else if (direction === "mixed") colorClass = palette.mixed;
  }

  let displayValue = null;
  if (intent === "detected") {
    if (typeof value === "boolean") {
      displayValue = value ? "✓" : "✗";
    } else if (typeof value === "number") {
      displayValue = `${Math.round(value * 100)}%`;
    }
  } else if (meta?.revenue != null) {
    const sign = meta.revenue > 0 ? "+" : "";
    displayValue = `${sign}${(meta.revenue * 100).toFixed(1)}% rev`;
  }

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${colorClass}`}>
      <span>{label}</span>
      {displayValue && <span className="font-mono opacity-80">{displayValue}</span>}
    </span>
  );
}
