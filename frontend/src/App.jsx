import { useState } from "react";
import Dashboard from "./components/Dashboard";
import Generate from "./components/Generate";
import Practice from "./components/Practice";

const TABS = [
  { id: "dashboard", label: "Research Findings" },
  { id: "generate", label: "Generate Response" },
  { id: "practice", label: "Practice Mode" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top nav */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">Review Response Coach</span>
              <span className="hidden sm:inline text-xs text-gray-500 border border-gray-700 rounded px-1.5 py-0.5">
                Karaman et al. 2025
              </span>
            </div>
            <nav className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                      ? "border-blue-400 text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "generate" && <Generate />}
        {activeTab === "practice" && <Practice />}
      </main>
    </div>
  );
}
