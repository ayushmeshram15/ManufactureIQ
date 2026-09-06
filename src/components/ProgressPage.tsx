import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Building2,
  ExternalLink,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { Company, SearchQuery } from "../types.ts";
import { getCompanies, subscribeCompanies, subscribeSearch } from "../lib/firestore.ts";

interface ProgressPageProps {
  search: SearchQuery;
  onViewDashboard: () => void;
  onRetry: () => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ search, onViewDashboard, onRetry }) => {
  const [currentSearch, setCurrentSearch] = useState<SearchQuery>(search);
  const [companies, setCompanies] = useState<Company[]>([]);
  // Track active insight view per company (defaulting to "why_relevant" when clicked)
  const [expandedInsights, setExpandedInsights] = useState<Record<string, "why_relevant" | "use_cases" | "top_signal" | null>>({});

  const toggleCompanyInsight = (companyId: string, insight: "why_relevant" | "use_cases" | "top_signal") => {
    setExpandedInsights((prev) => ({
      ...prev,
      [companyId]: prev[companyId] === insight ? null : insight,
    }));
  };

  useEffect(() => {
    const unsubSearch = subscribeSearch(search.id, (s) => {
      if (s) setCurrentSearch(s);
    });
    const unsubCompanies = subscribeCompanies(search.id, (comps) => {
      setCompanies(comps);
    });

    return () => {
      unsubSearch();
      unsubCompanies();
    };
  }, [search.id]);

  const isComplete = currentSearch.status === "complete";
  const isError = currentSearch.status === "error";

  const logs = currentSearch.logs || [
    `Analyzing manufacturing landscape in ${search.countries.join(", ")}...`,
    `Querying Google Search grounding for real operating manufacturers...`,
  ];

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 text-slate-100">
      {/* Header Status */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-800/80 bg-teal-950/70 px-3 py-1 text-xs font-semibold text-teal-300">
              {isError ? (
                <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
              ) : isComplete ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />
              )}
              <span>
                {isError
                  ? "Research Interrupted"
                  : isComplete
                  ? "Intelligence Scan Complete"
                  : "Grounded Market Research in Progress"}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Researching {search.countries.slice(0, 3).join(" + ")}
              {search.countries.length > 3 && ` (+${search.countries.length - 3} more)`}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Targeting: <span className="font-semibold text-slate-200">{search.industries.join(", ")}</span> • Product: <span className="italic text-slate-300">"{search.productDescription.slice(0, 60)}..."</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isError && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-700 transition cursor-pointer border border-slate-700"
              >
                <RotateCcw className="h-3.5 w-3.5 text-teal-400" />
                <span>Retry Pipeline</span>
              </button>
            )}

            {(isComplete || companies.length > 0) && (
              <button
                onClick={onViewDashboard}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-500 transition cursor-pointer"
              >
                <span>View Full Dashboard ({companies.length} Accounts)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Execution Steps Box */}
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 shadow-inner">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Verification Pipeline</span>
            </div>
            <span>Google Search Grounded</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {logs.map((log, idx) => {
              const isDone = log.startsWith("✓");
              const isRunning = log.startsWith("⟳");
              const isWarn = log.startsWith("⚠");
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 leading-relaxed ${
                    isDone
                      ? "text-emerald-400"
                      : isRunning
                      ? "text-teal-300 font-semibold"
                      : isWarn
                      ? "text-amber-300"
                      : "text-slate-300"
                  }`}
                >
                  <span className="shrink-0 text-slate-500 select-none">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span>{log}</span>
                </div>
              );
            })}

            {!isComplete && !isError && (
              <div className="flex items-center gap-2 text-teal-400 animate-pulse pt-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Running search verification and enrichment...</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Notification if failed */}
        {isError && (
          <div className="mt-4 rounded-xl border border-rose-900/60 bg-rose-950/40 p-4 text-xs text-rose-300">
            <div className="font-bold">An error occurred during discovery:</div>
            <div className="mt-1">{currentSearch.errorMessage || "Network or model query timeout."}</div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={onRetry}
                className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600"
              >
                Retry Search
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Discovered Companies Appearing Live */}
      {companies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">
                Verified Prospect Accounts ({companies.length})
              </h3>
            </div>
            <button
              onClick={onViewDashboard}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
            >
              Open Full Matrix →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company, index) => {
              const activeInsight = expandedInsights[company.id];

              return (
                <div
                  key={company.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xs transition hover:border-slate-700 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 shrink-0">#{index + 1}</span>
                          <h4 className="text-base font-bold text-white truncate">{company.name}</h4>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400 font-medium truncate">
                          {company.country} • {company.industry}
                        </p>
                      </div>
                      <div
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono shrink-0 ${
                          company.overallScore >= 90
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                            : company.overallScore >= 80
                            ? "bg-teal-950/80 text-teal-300 border border-teal-800"
                            : company.overallScore >= 70
                            ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {company.overallScore}/100
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {company.whyRelevant}
                    </p>

                    {/* Interactive Buttons for Why Relevant, Potential Use Cases, Top Buying Signal */}
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Quick Dashboard View:
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleCompanyInsight(company.id, "why_relevant")}
                          className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg border transition text-center cursor-pointer flex items-center justify-center gap-1 ${
                            activeInsight === "why_relevant"
                              ? "bg-teal-600 text-white border-teal-500 shadow-xs"
                              : "bg-teal-950/60 text-teal-300 border-teal-800/60 hover:bg-teal-900/60"
                          }`}
                        >
                          <span>🎯 Why relevant</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleCompanyInsight(company.id, "use_cases")}
                          className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg border transition text-center cursor-pointer flex items-center justify-center gap-1 ${
                            activeInsight === "use_cases"
                              ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                              : "bg-indigo-950/60 text-indigo-300 border-indigo-800/60 hover:bg-indigo-900/60"
                          }`}
                        >
                          <span>⚡ Use cases</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleCompanyInsight(company.id, "top_signal")}
                          className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg border transition text-center cursor-pointer flex items-center justify-center gap-1 ${
                            activeInsight === "top_signal"
                              ? "bg-amber-600 text-white border-amber-500 shadow-xs"
                              : "bg-amber-950/60 text-amber-300 border-amber-800/60 hover:bg-amber-900/60"
                          }`}
                        >
                          <span>🔥 Top signal</span>
                        </button>
                      </div>
                    </div>

                    {/* Dashboard-Type Information Container */}
                    {activeInsight && (
                      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-200 space-y-2.5 transition-all">
                        {activeInsight === "why_relevant" && (
                          <div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                              <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wide flex items-center gap-1">
                                <span>🎯 Why Relevant Dashboard</span>
                              </span>
                              <span className="text-[10px] text-teal-300 font-semibold bg-teal-950 border border-teal-800 px-2 py-0.5 rounded">
                                Fit Score: {company.fitScore}%
                              </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed font-medium">
                              {company.whyRelevant}
                            </p>
                            {company.whyRelevantPoints && company.whyRelevantPoints.length > 0 && (
                              <ul className="mt-2 space-y-1.5">
                                {company.whyRelevantPoints.map((pt, pIdx) => (
                                  <li key={pIdx} className="flex items-start gap-2 text-[11px] text-slate-400">
                                    <span className="h-4 w-4 rounded-full bg-teal-950 border border-teal-800 text-teal-300 font-bold flex items-center justify-center text-[9px] shrink-0 mt-0.5">
                                      {pIdx + 1}
                                    </span>
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {activeInsight === "use_cases" && (
                          <div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1">
                                <span>⚡ Potential Use Cases</span>
                              </span>
                              <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded">
                                {company.potentialUseCases?.length || 0} Identified
                              </span>
                            </div>
                            <div className="space-y-2">
                              {company.potentialUseCases?.map((uc, uIdx) => (
                                <div key={uIdx} className="bg-slate-900 p-2 rounded-lg border border-slate-800 shadow-xs">
                                  <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                                    <span className="text-slate-200 font-semibold">{uc.useCase}</span>
                                    <span className="text-indigo-400 font-mono font-bold">{uc.relevance}%</span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-indigo-500 h-full rounded-full"
                                      style={{ width: `${uc.relevance}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeInsight === "top_signal" && (
                          <div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1">
                                <span>🔥 Top Buying Signal</span>
                              </span>
                              <span className="text-[10px] text-amber-300 font-semibold bg-amber-950 border border-amber-800 px-2 py-0.5 rounded">
                                {company.buyingSignals?.[0]?.confidence || "High"} Confidence
                              </span>
                            </div>
                            {company.buyingSignals?.[0] ? (
                              <div className="bg-slate-900 p-2.5 rounded-lg border border-amber-900/60 shadow-xs space-y-1.5">
                                <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                                  <span>{company.buyingSignals[0].signal}</span>
                                </div>
                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                  {company.buyingSignals[0].detail}
                                </p>
                                {company.buyingSignals[0].sourceUrl && (
                                  <a
                                    href={company.buyingSignals[0].sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-teal-400 hover:text-teal-300 underline inline-flex items-center gap-1 pt-1"
                                  >
                                    <span>Verified Source Evidence ↗</span>
                                  </a>
                                )}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic">
                                Active operational manufacturing footprint in {company.country}.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium text-[11px]">
                      {company.manufacturingSites?.length || 1} Plant Location{(company.manufacturingSites?.length || 1) > 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={onViewDashboard}
                      className="font-semibold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <span>Full Matrix</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

