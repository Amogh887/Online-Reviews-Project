import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";

const RATINGS_NEG_DATA = [
  { element: "Problem Acceptance", value: 0.74 },
  { element: "Response Tailoring", value: 0.43 },
  { element: "Mimicry", value: 0.37 },
  { element: "Taking Responsibility", value: 0.14 },
  { element: "Apology", value: 0.05 },
  { element: "Loyalty", value: -0.06 },
  { element: "Regret", value: -0.08 },
  { element: "Action Promises", value: -0.13 },
];

const RATINGS_POS_DATA = [
  { element: "Mimicry", value: 1.1 },
  { element: "Response Tailoring", value: 0.39 },
  { element: "Loyalty", value: 0.06 },
  { element: "Apology", value: -0.04 },
];

const REVENUE_NEG_DATA = [
  { element: "Response Tailoring", value: 2.5 },
  { element: "Problem Acceptance", value: 2.3 },
  { element: "Taking Responsibility", value: 0.6 },
  { element: "Apology", value: 0.06 },
  { element: "Loyalty", value: -0.02 },
  { element: "Mimicry", value: -0.1 },
  { element: "Regret", value: -0.4 },
  { element: "Action Promises", value: -1.7 },
];

const REVENUE_POS_DATA = [
  { element: "Response Tailoring", value: 4.6 },
  { element: "Apology", value: 0.5 },
  { element: "Loyalty", value: -0.2 },
  { element: "Mimicry", value: -5.4 },
];

const POSITIVE_COLOR = "#5b8a5a";
const NEGATIVE_COLOR = "#b94a3d";

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{ background: "#000", borderRadius: "8px", padding: "12px" }}
      className="shadow-lg text-sm"
    >
      <p style={{ color: "#fff" }} className="font-semibold mb-1">{label}</p>
      {payload.map((p) =>
        p.value != null ? (
          <p key={p.dataKey} style={{ color: "#fff" }} className="text-xs font-mono">
            {p.value > 0 ? "+" : ""}{p.value}{unit}
          </p>
        ) : null
      )}
    </div>
  );
};

const barColor = (value) => {
  if (value === null || value === undefined) return "transparent";
  if (value > 0) return POSITIVE_COLOR;
  if (value < 0) return NEGATIVE_COLOR;
  return "#9ca3af";
};

function SingleBarChart({ data, unit, title }) {
  return (
    <div className="card">
      <h3 className="font-serif text-xl font-bold text-ink mb-1">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 60 }}
          barCategoryGap="35%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e1d6" />
          <XAxis
            dataKey="element"
            tick={{ fontSize: 11, fill: "#5a5a52" }}
            angle={-35}
            textAnchor="end"
            interval={0}
            height={72}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#5a5a52" }}
            tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}${unit}`}
          />
          <ReferenceLine y={0} stroke="#3a3a35" strokeWidth={1} />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ fill: "rgba(201,168,76,0.08)" }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={barColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  return (
    <>
      {/* HERO - dark */}
      <section className="bg-ink text-white">
        <div className="max-w-[1200px] mx-auto px-6 py-24 sm:py-28">
          <div className="max-w-3xl animate-fadeUp">
            <h1 className="headline-serif text-5xl sm:text-6xl text-white">
              How response to reviews{" "}
              <span
                className="text-amber-accent"
                style={{ background: "rgba(201,168,76,0.18)", borderRadius: "3px", padding: "0 4px" }}
              >
                impacts future ratings and sales
              </span>
              .
            </h1>
            <p className="text-ink-400 text-lg mt-6 leading-relaxed max-w-2xl">
              A large-scale causal study of 5.4M hotel reviews across 4,910 properties over 12 years.
              Responding helps your reputation, but only certain things you{" "}
              <span className="italic text-amber-accent font-serif">say</span> move revenue.
            </p>
          </div>
        </div>
      </section>

      {/* KEY INSIGHT - dark continuation, then transition */}
      <section className="bg-ink text-white pb-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="card-dark border-l-4 !border-l-amber-accent animate-fadeUp">
            <p className="text-white text-lg leading-relaxed font-serif">
              Simply responding improves future ratings but does not improve sales per se.
              <em className="text-amber-accent"> What you say matters.</em> Two response elements consistently improve both
              ratings and revenue regardless of review type: problem acceptance and tailoring the response to specific
              topics raised in the review. Promises of future action consistently hurt both.
            </p>
          </div>
        </div>
      </section>

      {/* CHARTS - cream */}
      <section className="bg-cream">
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="max-w-2xl mb-12">
            <h2 className="headline-serif text-4xl sm:text-5xl text-ink">
              Effects of <em>each element</em> on ratings & revenue.
            </h2>
            <p className="text-ink-600 text-base mt-4 leading-relaxed">
              Estimated via visibility-based causal identification. Bars show the percentage change relative to baseline.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger">
            <SingleBarChart
              data={RATINGS_NEG_DATA}
              unit="%"
              title="Impact on Ratings (Negative Reviews)"
            />
            <SingleBarChart
              data={RATINGS_POS_DATA}
              unit="%"
              title="Impact on Ratings (Positive Reviews)"
            />
            <SingleBarChart
              data={REVENUE_NEG_DATA}
              unit="%"
              title="Impact on Sales (Negative Reviews)"
            />
            <SingleBarChart
              data={REVENUE_POS_DATA}
              unit="%"
              title="Impact on Sales (Positive Reviews)"
            />
          </div>
        </div>
      </section>

      {/* STAT CARDS - dark */}
      <section className="bg-ink text-white">
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="max-w-2xl mb-12">
            <h2 className="headline-serif text-4xl sm:text-5xl text-white">
              Responding at all is <em>the floor</em>, not the ceiling.
            </h2>
            <p className="text-ink-400 text-base mt-4 leading-relaxed">
              The act of replying lifts ratings, especially after negative reviews, but the content of the reply is
              what determines whether it moves revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
            <div className="card-dark">
              <span className="block font-serif text-4xl font-bold text-amber-accent">+0.24★</span>
              <span className="block text-sm font-semibold text-white mt-2">Rating lift, negative reviews</span>
              <span className="block text-xs text-ink-400 mt-2 leading-relaxed">Next incoming review (full response rate)</span>
            </div>
            <div className="card-dark">
              <span className="block font-serif text-4xl font-bold text-white">+0.03★</span>
              <span className="block text-sm font-semibold text-white mt-2">Rating lift, positive reviews</span>
              <span className="block text-xs text-ink-400 mt-2 leading-relaxed">Next incoming review (full response rate)</span>
            </div>
            <div className="card-dark">
              <span className="block font-serif text-3xl font-bold text-white">Not significant</span>
              <span className="block text-sm font-semibold text-white mt-2">Revenue impact, responding alone</span>
              <span className="block text-xs text-ink-400 mt-2 leading-relaxed">Content of the response is what drives sales</span>
            </div>
            <div className="card-dark">
              <span className="block font-serif text-4xl font-bold text-white">5.4M</span>
              <span className="block text-sm font-semibold text-white mt-2">Reviews analysed</span>
              <span className="block text-xs text-ink-400 mt-2 leading-relaxed">4,910 hotels · 12 years · daily financials</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
