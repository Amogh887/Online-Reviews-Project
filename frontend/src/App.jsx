import { useState } from "react";
import Dashboard from "./components/Dashboard";
import Generate from "./components/Generate";
import Practice from "./components/Practice";

const TABS = [
  { id: "dashboard", label: "Findings" },
  { id: "generate", label: "Generate" },
  { id: "practice", label: "Practice" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-cream">
      {/* Top nav */}
      <header className="bg-ink sticky top-0 z-20 border-b border-ink-700">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="font-sans text-[13px] font-semibold text-white tracking-[0.18em] uppercase">
                Response Coach
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      active
                        ? "text-amber-accent"
                        : "text-ink-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile tab strip */}
            <nav className="md:hidden flex items-center gap-0">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2 py-2 text-xs font-medium transition-colors ${
                      active ? "text-amber-accent" : "text-ink-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main key={activeTab} className="animate-fadeUp">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "generate" && <Generate />}
        {activeTab === "practice" && <Practice />}
      </main>

      <footer className="bg-ink text-ink-400 py-10 mt-24">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-amber-accent">// crafted_with_intent</span>
          </div>
          <p className="text-xs text-ink-500">Grounded in a study of 5.4M hotel reviews · 4,910 properties · 12 years</p>
        </div>
      </footer>
    </div>
  );
}
