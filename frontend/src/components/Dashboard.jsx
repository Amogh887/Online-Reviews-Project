import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";

const RATINGS_DATA = [
  { element: "Problem Acceptance", negative: 0.74, positive: null },
  { element: "Response Tailoring", negative: 0.43, positive: 0.39 },
  { element: "Style Matching", negative: 0.37, positive: 1.1 },
  { element: "Taking Responsibility", negative: 0.14, positive: null },
  { element: "Apology", negative: 0.05, positive: -0.04 },
  { element: "Loyalty", negative: -0.06, positive: 0.06 },
  { element: "Regret", negative: -0.08, positive: null },
  { element: "Action Promises", negative: -0.13, positive: null },
];

const REVENUE_DATA = [
  { element: "Response Tailoring", negative: 2.5, positive: 4.6 },
  { element: "Problem Acceptance", negative: 2.3, positive: null },
  { element: "Taking Responsibility", negative: 0.6, positive: null },
  { element: "Apology", negative: 0.06, positive: 0.5 },
  { element: "Loyalty", negative: -0.02, positive: -0.2 },
  { element: "Regret", negative: -0.4, positive: null },
  { element: "Action Promises", negative: -1.7, positive: null },
  { element: "Style Matching", negative: -0.1, positive: -5.4 },
];

const POSITIVE_COLOR = "#5b8a5a";   // muted green
const NEGATIVE_COLOR = "#b94a3d";   // muted brick red
const POSITIVE_SOFT = "#7ea878";
const NEGATIVE_SOFT = "#d97a6c";

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p) =>
        p.value != null ? (
          <p key={p.dataKey} className="text-xs font-mono text-white">
            {p.name}: {p.value > 0 ? "+" : ""}{p.value}{unit}
          </p>
        ) : null
      )}
    </div>
  );
};

const barColor = (value, soft = false) => {
  if (value === null || value === undefined) return "transparent";
  if (value > 0) return soft ? POSITIVE_SOFT : POSITIVE_COLOR;
  if (value < 0) return soft ? NEGATIVE_SOFT : NEGATIVE_COLOR;
  return "#9ca3af";
};

function GroupedBarChart({ data, unit, title, subtitle }) {
  const [highlighted, setHighlighted] = useState(null);

  const getBarOpacity = (isNegative, entry) => {
    if (isNegative ? entry.negative === null : entry.positive === null) return 0;
    if (!highlighted) return 1;
    const series = isNegative ? "negative" : "positive";
    return series === highlighted ? 1 : 0.25;
  };

  return (
    <div className="card">
      <h3 className="font-serif text-2xl font-bold text-ink">{title}</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 60 }}
          barCategoryGap="30%"
          barGap={4}
          onClick={() => highlighted && setHighlighted(null)}
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
          <Legend
            verticalAlign="top"
            height={28}
            content={() => (
              <div className="flex gap-4 justify-center text-xs text-ink-500 mt-1">
                <span className="flex items-center gap-1.5 cursor-pointer hover:text-ink" onClick={(e) => { e.stopPropagation(); setHighlighted(highlighted === "negative" ? null : "negative"); }}>
                  <span style={{background: NEGATIVE_COLOR}} className="inline-block w-3 h-3 rounded-sm" />
                  Negative review response
                </span>
                <span className="flex items-center gap-1.5 cursor-pointer hover:text-ink" onClick={(e) => { e.stopPropagation(); setHighlighted(highlighted === "positive" ? null : "positive"); }}>
                  <span style={{background: POSITIVE_SOFT}} className="inline-block w-3 h-3 rounded-sm" />
                  Positive review response
                </span>
              </div>
            )}
          />
          <Bar
            dataKey="negative"
            name="Negative review response"
            radius={[3, 3, 0, 0]}
            onClick={(e) => { e.stopPropagation(); setHighlighted(highlighted === "negative" ? null : "negative"); }}
          >
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={barColor(entry.negative)}
                opacity={getBarOpacity(true, entry)}
              />
            ))}
          </Bar>
          <Bar
            dataKey="positive"
            name="Positive review response"
            radius={[3, 3, 0, 0]}
            onClick={(e) => { e.stopPropagation(); setHighlighted(highlighted === "positive" ? null : "positive"); }}
          >
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={barColor(entry.positive, true)}
                opacity={getBarOpacity(false, entry)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {highlighted && (
        <p className="text-xs text-ink-500 italic mt-3">
          Click to reset
        </p>
      )}
    </div>
  );
}

function StatCard({ value, label, sub, highlight }) {
  return (
    <div className={`card ${highlight ? "ring-2 ring-amber-accent/40" : ""}`}>
      <span className="block font-serif text-4xl font-bold text-ink">{value}</span>
      <span className="block text-sm font-semibold text-ink-600 mt-2">{label}</span>
      {sub && <span className="block text-xs text-ink-500 mt-2 leading-relaxed">{sub}</span>}
    </div>
  );
}

export default function Dashboard() {
  return (
    <>
      {/* HERO — dark */}
      <section className="bg-ink text-white">
        <div className="max-w-[1200px] mx-auto px-6 py-24 sm:py-28">
          <div className="max-w-3xl animate-fadeUp">
            <h1 className="headline-serif text-5xl sm:text-6xl text-white">
              What <em>actually</em> moves the needle on reviews.
            </h1>
            <p className="text-ink-400 text-lg mt-6 leading-relaxed max-w-2xl">
              A large-scale causal study of 5.4M hotel reviews across 4,910 properties over 12 years.
              Responding helps your reputation — but only certain things you{" "}
              <span className="italic text-amber-accent font-serif">say</span> move revenue.
            </p>
          </div>
        </div>
      </section>

      {/* KEY INSIGHT — dark continuation, then transition */}
      <section className="bg-ink text-white pb-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="card-dark border-l-4 !border-l-amber-accent animate-fadeUp">
            <p className="text-white text-lg leading-relaxed font-serif">
              Simply responding improves reputation but doesn't move revenue.
              <em className="text-amber-accent"> What you say matters.</em> Two elements consistently improve both
              ratings and revenue regardless of review type: openly accepting the problem, and tailoring the message
              to the specific topics raised. Promises of future action consistently hurt both.
            </p>
          </div>
        </div>
      </section>

      {/* CHARTS — cream */}
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
            <GroupedBarChart
              data={RATINGS_DATA}
              unit="%"
              title="Effect on Future Ratings"
              subtitle="// % of mean star rating"
            />
            <GroupedBarChart
              data={REVENUE_DATA}
              unit="%"
              title="Effect on Revenue"
              subtitle="// % of mean daily revenue"
            />
          </div>
        </div>
      </section>

      {/* STAT CARDS — dark */}
      <section className="bg-ink text-white">
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="max-w-2xl mb-12">
            <h2 className="headline-serif text-4xl sm:text-5xl text-white">
              Responding at all is <em>the floor</em>, not the ceiling.
            </h2>
            <p className="text-ink-400 text-base mt-4 leading-relaxed">
              The act of replying lifts ratings — especially after negative reviews — but the content of the reply is
              what determines whether it moves revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
            <div className="card-dark">
              <span className="block font-serif text-4xl font-bold text-amber-accent">+0.24★</span>
              <span className="block text-sm font-semibold text-white mt-2">Rating lift — negative reviews</span>
              <span className="block text-xs text-ink-400 mt-2 leading-relaxed">Next incoming review (full response rate)</span>
            </div>
            <div className="card-dark">
              <span className="block font-serif text-4xl font-bold text-white">+0.03★</span>
              <span className="block text-sm font-semibold text-white mt-2">Rating lift — positive reviews</span>
              <span className="block text-xs text-ink-400 mt-2 leading-relaxed">Next incoming review (full response rate)</span>
            </div>
            <div className="card-dark">
              <span className="block font-serif text-3xl font-bold text-white">Not significant</span>
              <span className="block text-sm font-semibold text-white mt-2">Revenue impact — responding alone</span>
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

      {/* WHY MANAGEMENT RESPONSES MATTER — cream */}
      <section className="bg-cream">
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="max-w-2xl mb-12">
            <h2 className="headline-serif text-4xl sm:text-5xl text-ink">
              Two audiences are reading <em>every reply</em>.
            </h2>
            <p className="text-ink-600 text-base mt-4 leading-relaxed">
              Future reviewers use responses as benchmarks when writing their own. Prospective customers
              who haven't yet booked use the same responses to decide whether to buy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 stagger">
            <StatCard
              value="58%"
              label="Likely to skip a business"
              sub="… if managers don't respond to reviews at all. Brightlocal, 2023."
              highlight
            />
            <StatCard
              value="88%"
              label="Likely to use a business"
              sub="… if the manager responds to all reviews — positive and negative. Brightlocal, 2023."
              highlight
            />
          </div>
        </div>
      </section>
    </>
  );
}
