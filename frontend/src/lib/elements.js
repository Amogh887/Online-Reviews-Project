export const ELEMENT_LABELS = {
  problem_acceptance: "Problem Acceptance",
  taking_responsibility: "Taking Responsibility",
  regret: "Regret",
  action: "Action Promises",
  response_tailoring: "Response Tailoring",
  style_matching: "Mimicry",
  thanks: "Thanks",
  loyalty: "Loyalty Mention",
  revisit_request: "Revisit Request",
  apology: "Apology",
};

// Elements only applicable to negative reviews
export const NEG_ONLY = new Set([
  "problem_acceptance",
  "taking_responsibility",
  "regret",
  "action",
]);

export const labelFor = (key) => ELEMENT_LABELS[key] || key;

export const formatPct = (n) => `${n > 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;
