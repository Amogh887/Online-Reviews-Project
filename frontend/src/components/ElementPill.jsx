import { labelFor, NEG_ONLY } from "../lib/elements";

// Reusable pill for showing an element's presence + direction
// - elementKey: the dict key (e.g. "problem_acceptance")
// - value: bool, float (0..1), or null/undefined (= absent)
// - meta: { direction, rating, revenue } from backend (optional)
// - reviewType: "positive" | "negative" — hides neg-only pills on positive
// - intent: "detected" (default) | "used" | "avoided"
//   "used"/"avoided" force green/red regardless of value
export default function ElementPill({ elementKey, value, meta, reviewType, intent = "detected" }) {
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

  let colorClass = "bg-gray-800 text-gray-400 border-gray-700";

  if (intent === "used") {
    colorClass = "bg-green-900/50 text-green-300 border-green-700";
  } else if (intent === "avoided") {
    colorClass = "bg-red-900/50 text-red-300 border-red-700";
  } else if (isPresent) {
    if (direction === "good") colorClass = "bg-green-900/50 text-green-300 border-green-700";
    else if (direction === "bad") colorClass = "bg-red-900/50 text-red-300 border-red-700";
    else if (direction === "mixed") colorClass = "bg-yellow-900/50 text-yellow-300 border-yellow-700";
  }

  let displayValue = null;
  if (intent === "detected") {
    if (typeof value === "boolean") {
      displayValue = value ? "✓ Present" : "✗ Absent";
    } else if (typeof value === "number") {
      displayValue = `${Math.round(value * 100)}%`;
    }
  } else if (meta?.revenue != null) {
    const sign = meta.revenue > 0 ? "+" : "";
    displayValue = `${sign}${(meta.revenue * 100).toFixed(1)}% rev`;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {label}
      {displayValue && <span className="opacity-70">{displayValue}</span>}
    </span>
  );
}
