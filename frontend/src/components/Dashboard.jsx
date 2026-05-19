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

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-100 mb-1">{label}</p>
      {payload.map((p) =>
        p.value != null ? (
          <p key={p.dataKey} style={{ color: p.color }} className="text-xs">
            {p.name}: {p.value > 0 ? "+" : ""}
            {p.value}
            {unit}
          </p>
        ) : null
      )}
    </div>
  );
};

const barColor = (value) => {
  if (value === null || value === undefined) return "transparent";
  if (value > 0) return "#16a34a";
  if (value < 0) return "#dc2626";
  return "#9ca3af";
};

function GroupedBarChart({ data, unit, title, subtitle }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-xs text-gray-400 mt-1 mb-4">{subtitle}</p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 8, bottom: 60 }}
          barCategoryGap="30%"
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="element"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            angle={-35}
            textAnchor="end"
            interval={0}
            height={72}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}${unit}`}
          />
          <ReferenceLine y={0} stroke="#d1d5db" strokeWidth={1.5} />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ fill: "#f9fafb" }}
          />
          <Legend
            verticalAlign="top"
            height={28}
            formatter={(value) => (
              <span className="text-xs text-gray-400">{value}</span>
            )}
          />
          <Bar dataKey="negative" name="Negative review response" radius={[3, 3, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={barColor(entry.negative)} opacity={entry.negative == null ? 0 : 1} />
            ))}
          </Bar>
          <Bar dataKey="positive" name="Positive review response" radius={[3, 3, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.positive != null ? (entry.positive > 0 ? "#4ade80" : "#f87171") : "transparent"} opacity={entry.positive == null ? 0 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-600 text-center mt-2">
        Green = positive effect &nbsp;·&nbsp; Red = negative effect &nbsp;·&nbsp; Missing bar = not applicable
      </p>
    </div>
  );
}

function StatCard({ value, label, sub, highlight }) {
  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-1 ${
        highlight
          ? "border-blue-700 bg-blue-900/30"
          : "border-gray-700 bg-gray-900"
      }`}
    >
      <span className="text-3xl font-bold text-white">{value}</span>
      <span className="text-sm font-medium text-gray-300">{label}</span>
      {sub && <span className="text-xs text-gray-500 mt-1">{sub}</span>}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Research Findings</h2>
        <p className="text-gray-400 text-sm mt-1">
          Based on Karaman, Chakraborty &amp; Banerjee (2025) — 5.4M hotel reviews across 4,910 hotels, 12 years
        </p>
      </div>

      {/* Key message */}
      <div className="bg-amber-950/40 border border-amber-800 rounded-xl p-5">
        <p className="text-sm text-amber-200">
          <strong>Key insight:</strong> Simply responding improves reputation but doesn't move revenue.
          <strong> What you say matters</strong> — two elements consistently improve both ratings and revenue regardless of review type:
          openly accepting the problem and tailoring the message to the specific topics raised.
          Promises of future action consistently hurt both.
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GroupedBarChart
          data={RATINGS_DATA}
          unit="%"
          title="Effect on Future Ratings"
          subtitle="% of mean star rating · Table 12, Karaman et al. 2025"
        />
        <GroupedBarChart
          data={REVENUE_DATA}
          unit="%"
          title="Effect on Revenue"
          subtitle="% of mean daily revenue · Table 12, Karaman et al. 2025"
        />
      </div>

      <p className="text-xs text-gray-600 text-center pb-4">
        Effects estimated via visibility-based causal identification. Robustness verified with Tripadvisor data as external quality control.
      </p>

      {/* Headline stats */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Impact of Responding (any response)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            value="+0.24★"
            label="Rating lift — negative reviews"
            sub="Next incoming review (full response rate)"
            highlight
          />
          <StatCard
            value="+0.03★"
            label="Rating lift — positive reviews"
            sub="Next incoming review (full response rate)"
          />
          <StatCard
            value="Not significant"
            label="Revenue impact — responding alone"
            sub="Content of the response is what drives sales"
          />
          <StatCard
            value="5.4M reviews"
            label="Dataset size"
            sub="4,910 hotels · 12 years · daily financials"
          />
        </div>
      </div>

      {/* Why responding matters — consumer stats */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
        <h3 className="text-base font-semibold mb-4 text-slate-200 uppercase tracking-wide text-xs">
          Why Management Responses Matter
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-4xl font-bold text-red-400">58%</div>
            <p className="text-sm text-slate-300 mt-1">
              of customers are <strong>unlikely to use a business</strong> if managers don't respond to reviews at all
            </p>
            <p className="text-xs text-slate-500 mt-2">Brightlocal, 2023</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-4xl font-bold text-green-400">88%</div>
            <p className="text-sm text-slate-300 mt-1">
              of consumers are <strong>likely to use a business</strong> if the manager responds to all reviews — positive or negative
            </p>
            <p className="text-xs text-slate-500 mt-2">Brightlocal, 2023</p>
          </div>
        </div>
        <div className="mt-4 bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-slate-300">
          <strong className="text-white">Two audiences, two effects:</strong> Future reviewers use responses as benchmarks when writing their own reviews.
          Prospective customers who haven't yet booked use the same responses to decide whether to purchase —
          making response quality a lever for both reputation <em>and</em> revenue.
        </div>
      </div>
    </div>
  );
}
