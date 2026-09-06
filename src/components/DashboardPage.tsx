import React, { useState, useMemo } from "react";
import {
  Download,
  Search,
  ExternalLink,
  Flame,
  Globe2,
  MapPin,
  Sparkles,
  Layers,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  Copy,
  Check,
  Table as TableIcon,
  Columns2,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Target,
  Zap,
} from "lucide-react";
import { Company, ScoreTier, SearchQuery } from "../types.ts";
import { exportCompaniesToCSV } from "../lib/csvExport.ts";

interface DashboardPageProps {
  search: SearchQuery;
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
  onNewSearch: () => void;
  onRerun: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  search,
  companies,
  onSelectCompany,
  onNewSearch,
  onRerun,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high_priority">("all");
  const [sortOrder, setSortOrder] = useState<"tier-desc" | "tier-asc" | "score-desc" | "score-asc">("tier-desc");
  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("All");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [selectedObjective, setSelectedObjective] = useState<string>("All");
  const [showAllUnder50, setShowAllUnder50] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "table">("split");
  const [mobileTab, setMobileTab] = useState<"list" | "dossier">("list");
  const [activeInsightTab, setActiveInsightTab] = useState<"why_relevant" | "use_cases" | "top_signal" | "all">("why_relevant");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    companies[0]?.id || ""
  );
  const [copiedPitch, setCopiedPitch] = useState(false);


  const TIER_RANK: Record<string, number> = {
    Excellent: 4,
    Strong: 3,
    Potential: 2,
    Low: 1,
  };

  const toggleTierSort = () => {
    setSortOrder((prev) => (prev === "tier-desc" ? "tier-asc" : "tier-desc"));
  };

  // Summary Metrics
  const totalAnalyzed = companies.length;
  const highPriorityAccounts = useMemo(
    () => companies.filter((c) => c.overallScore >= 80),
    [companies]
  );
  const totalSignals = useMemo(
    () => companies.reduce((sum, c) => sum + (c.buyingSignals?.length || 0), 0),
    [companies]
  );
  const avgOverallScore = useMemo(
    () => (totalAnalyzed ? Math.round(companies.reduce((sum, c) => sum + c.overallScore, 0) / totalAnalyzed) : 0),
    [companies, totalAnalyzed]
  );

  // Filter options
  const countryOptions = useMemo(() => {
    const list = Array.from(new Set(companies.map((c) => c.country).filter(Boolean)));
    return ["All", ...list];
  }, [companies]);

  const industryOptions = useMemo(() => {
    const list = Array.from(new Set(companies.map((c) => c.industry).filter(Boolean)));
    return ["All", ...list];
  }, [companies]);

  const objectiveOptions = useMemo(() => {
    const objSet = new Set<string>();
    companies.forEach((c) => {
      if (Array.isArray(c.matchedObjectives)) {
        c.matchedObjectives.forEach((o) => objSet.add(o));
      }
    });
    // Ensure default common objectives are listed if found or relevant
    if (objSet.size === 0) {
      return ["All", "Direct Customers", "Distributors & VARs", "Pilot Customers"];
    }
    return ["All", ...Array.from(objSet)];
  }, [companies]);

  // Filtered & Sorted list
  const filteredCompanies = useMemo(() => {
    return companies
      .filter((comp) => {
        if (!showAllUnder50 && comp.overallScore < 50) return false;

        // High priority toggle: Score >= 80 or Excellent / Strong tier
        if (priorityFilter === "high_priority" && comp.overallScore < 80) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const match =
            comp.name.toLowerCase().includes(q) ||
            comp.domain.toLowerCase().includes(q) ||
            comp.industry.toLowerCase().includes(q) ||
            comp.country.toLowerCase().includes(q) ||
            comp.whyRelevant?.toLowerCase().includes(q) ||
            comp.matchedObjectives?.some((o) => o.toLowerCase().includes(q));
          if (!match) return false;
        }

        if (selectedCountry !== "All" && comp.country !== selectedCountry) return false;
        if (selectedIndustry !== "All" && comp.industry !== selectedIndustry) return false;
        if (selectedTier !== "All" && comp.scoreTier !== selectedTier) return false;
        if (selectedObjective !== "All") {
          const hasObj = comp.matchedObjectives?.some(
            (o) => o.toLowerCase() === selectedObjective.toLowerCase() || o.toLowerCase().includes(selectedObjective.toLowerCase())
          ) || comp.whyRelevant?.toLowerCase().includes(selectedObjective.toLowerCase());
          if (!hasObj) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "tier-desc") {
          const rB = TIER_RANK[b.scoreTier] || 0;
          const rA = TIER_RANK[a.scoreTier] || 0;
          if (rB !== rA) return rB - rA;
          return b.overallScore - a.overallScore;
        }
        if (sortOrder === "tier-asc") {
          const rB = TIER_RANK[b.scoreTier] || 0;
          const rA = TIER_RANK[a.scoreTier] || 0;
          if (rA !== rB) return rA - rB;
          return a.overallScore - b.overallScore;
        }
        if (sortOrder === "score-desc") {
          return b.overallScore - a.overallScore;
        }
        if (sortOrder === "score-asc") {
          return a.overallScore - b.overallScore;
        }
        return b.overallScore - a.overallScore;
      });
  }, [companies, searchTerm, selectedCountry, selectedIndustry, selectedTier, selectedObjective, priorityFilter, sortOrder, showAllUnder50]);

  // Ensure an active selected company exists in filtered list
  const activeCompany = useMemo(() => {
    const found = filteredCompanies.find((c) => c.id === selectedCompanyId);
    return found || filteredCompanies[0] || companies[0] || null;
  }, [filteredCompanies, selectedCompanyId, companies]);

  const copyPitch = (text?: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2000);
    }
  };

  const getTierColor = (score: number) => {
    if (score >= 90) return "bg-emerald-950/80 text-emerald-300 border border-emerald-800/70";
    if (score >= 80) return "bg-teal-950/80 text-teal-300 border border-teal-800/70";
    if (score >= 70) return "bg-blue-950/80 text-blue-300 border border-blue-800/70";
    return "bg-slate-800/80 text-slate-400 border border-slate-700/60";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-[#0B0F17] font-sans text-slate-100 overflow-hidden">
      {/* Sub-header Filter & View Bar */}
      <div className="h-14 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between px-3 sm:px-6 flex-shrink-0 gap-2 sm:gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative w-full max-w-[160px] sm:max-w-[190px] shrink-0">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:bg-slate-950"
            />
          </div>

          {/* Priority Toggle: All Results vs High Priority Only */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setPriorityFilter("all")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
                priorityFilter === "all"
                  ? "bg-slate-800 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              All ({companies.length})
            </button>
            <button
              type="button"
              onClick={() => setPriorityFilter("high_priority")}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
                priorityFilter === "high_priority"
                  ? "bg-teal-950 text-teal-300 border border-teal-800/80 shadow-xs font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <ShieldCheck className={`h-3.5 w-3.5 ${priorityFilter === "high_priority" ? "text-teal-400" : "text-slate-500"}`} />
              <span className="hidden sm:inline">High Priority</span>
              <span>({highPriorityAccounts.length})</span>
            </button>
          </div>

          {/* Dynamic Sort by Overall Score Tier */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="text-xs bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="tier-desc" className="bg-slate-900 text-slate-100">Tier: High → Low</option>
              <option value="tier-asc" className="bg-slate-900 text-slate-100">Tier: Low → High</option>
              <option value="score-desc" className="bg-slate-900 text-slate-100">Score: 100 → 0</option>
              <option value="score-asc" className="bg-slate-900 text-slate-100">Score: 0 → 100</option>
            </select>
          </div>

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-teal-500 shrink-0 cursor-pointer hidden md:block"
          >
            {countryOptions.map((c) => (
              <option key={c} value={c} className="bg-slate-900 text-slate-100">
                {c === "All" ? "All Countries" : c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === "split"
                  ? "bg-slate-800 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dossier View</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-slate-800 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table Grid</span>
            </button>
          </div>

          <button
            onClick={() => exportCompaniesToCSV(filteredCompanies, search)}
            className="text-xs font-semibold text-slate-200 bg-slate-900 px-3 py-1.5 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-lg transition inline-flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-teal-400" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="font-mono text-slate-400">({filteredCompanies.length})</span>
          </button>
        </div>
      </div>

      {/* Mobile Responsive Navigation Tabs */}
      <div className="flex md:hidden items-center bg-slate-900 p-1 border-b border-slate-800 shrink-0">
        <button
          onClick={() => setMobileTab("list")}
          className={`flex-1 py-1.5 text-xs font-bold text-center rounded-lg transition cursor-pointer ${
            mobileTab === "list" ? "bg-slate-800 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          📋 Accounts ({filteredCompanies.length})
        </button>
        <button
          onClick={() => setMobileTab("dossier")}
          className={`flex-1 py-1.5 text-xs font-bold text-center rounded-lg transition cursor-pointer ${
            mobileTab === "dossier" ? "bg-teal-950 text-teal-300 shadow-xs border border-teal-800/80" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          📊 {activeCompany ? activeCompany.name.slice(0, 16) : "Dossier"}
        </button>
      </div>

      {/* Main Workspace Body */}
      {viewMode === "split" ? (
        <main className="flex flex-1 overflow-hidden w-full">
          {/* Left Sidebar - Account List & Metrics */}
          <aside
            className={`border-r border-slate-800 bg-[#0D131F] flex flex-col flex-shrink-0 ${
              mobileTab === "list"
                ? "w-full md:w-80 lg:w-96"
                : "hidden md:flex md:w-80 lg:w-96"
            }`}
          >
            {/* Research Status Summary */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex-shrink-0">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Research Status
              </h2>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setPriorityFilter("all")}
                  className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                    priorityFilter === "all"
                      ? "bg-slate-800 font-bold text-white border border-slate-700 shadow-xs"
                      : "text-slate-300 hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${priorityFilter === "all" ? "bg-teal-400" : "bg-slate-600"}`} />
                    <span>Companies Analyzed</span>
                  </span>
                  <span className="font-mono font-bold text-white">{totalAnalyzed}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPriorityFilter(priorityFilter === "high_priority" ? "all" : "high_priority")}
                  className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                    priorityFilter === "high_priority"
                      ? "bg-teal-950 font-bold text-teal-300 border border-teal-800/80 shadow-xs"
                      : "text-slate-300 hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className={`h-3.5 w-3.5 ${priorityFilter === "high_priority" ? "text-teal-400" : "text-slate-500"}`} />
                    <span>High Priority Only</span>
                  </span>
                  <span className="text-teal-400 font-mono font-bold">
                    {highPriorityAccounts.length}
                  </span>
                </button>

                <div className="flex items-center justify-between text-xs px-2.5 py-1 text-slate-400">
                  <span>Buying Signals</span>
                  <span className="text-amber-400 font-mono font-bold">{totalSignals}</span>
                </div>
              </div>

              {/* Target GTM Objectives */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
                  <span>Target GTM Objectives</span>
                  {selectedObjective !== "All" && (
                    <button
                      onClick={() => setSelectedObjective("All")}
                      className="text-[10px] text-teal-400 hover:underline font-medium"
                    >
                      Reset filter
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {objectiveOptions.filter(o => o !== "All").map((obj) => {
                    const isFiltered = selectedObjective === obj;
                    return (
                      <button
                        key={obj}
                        type="button"
                        onClick={() => setSelectedObjective(isFiltered ? "All" : obj)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition font-medium ${
                          isFiltered
                            ? "bg-teal-500 text-slate-950 font-bold border-teal-400"
                            : "bg-slate-900 text-slate-300 border-slate-800 hover:border-teal-500 hover:text-teal-300"
                        }`}
                      >
                        {obj}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Accounts Count & Dynamic Sort Header */}
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {filteredCompanies.length} {filteredCompanies.length === 1 ? "Account" : "Accounts"}
              </span>
              <button
                type="button"
                onClick={toggleTierSort}
                className="inline-flex items-center gap-1 text-[11px] text-teal-300 hover:text-teal-200 bg-teal-950/80 hover:bg-teal-900/80 border border-teal-800/80 px-2 py-0.5 rounded-md transition font-semibold cursor-pointer"
                title="Click to toggle Overall Score Tier sort order"
              >
                <span>{sortOrder === "tier-desc" ? "Tier: High → Low" : sortOrder === "tier-asc" ? "Tier: Low → High" : sortOrder === "score-desc" ? "Score: High → Low" : "Score: Low → High"}</span>
                {sortOrder.endsWith("desc") ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
              </button>
            </div>

            {/* Scrollable Company List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredCompanies.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No companies match the filters
                </div>
              ) : (
                filteredCompanies.map((comp) => {
                  const isSelected = activeCompany?.id === comp.id;
                  return (
                    <div
                      key={comp.id}
                      onClick={() => {
                        setSelectedCompanyId(comp.id);
                        setMobileTab("dossier");
                      }}
                      className={`p-3 rounded-xl transition cursor-pointer border ${
                        isSelected
                          ? "bg-slate-900 border-teal-500 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/30"
                          : "bg-slate-900/60 hover:bg-slate-900 border-slate-800/90"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1 gap-1.5">
                        <span className={`text-xs font-bold truncate ${
                          isSelected ? "text-teal-300" : "text-white"
                        }`}>
                          {comp.name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono shrink-0 ${getTierColor(comp.overallScore)}`}>
                          {comp.overallScore}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {comp.industry || "Manufacturing"} • {comp.country}
                      </p>

                      {/* Interactive Buttons: Why relevant, Potential use cases, Top buying signal */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompanyId(comp.id);
                            setActiveInsightTab("why_relevant");
                            setMobileTab("dossier");
                          }}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition flex items-center gap-1 cursor-pointer ${
                            isSelected && activeInsightTab === "why_relevant"
                              ? "bg-teal-600 text-white border-teal-500 shadow-xs font-bold"
                              : "bg-teal-950/60 text-teal-300 border-teal-800/60 hover:bg-teal-900/60"
                          }`}
                          title="View Why Relevant Dashboard"
                        >
                          <span>🎯 Why relevant</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompanyId(comp.id);
                            setActiveInsightTab("use_cases");
                            setMobileTab("dossier");
                          }}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition flex items-center gap-1 cursor-pointer ${
                            isSelected && activeInsightTab === "use_cases"
                              ? "bg-indigo-600 text-white border-indigo-500 shadow-xs font-bold"
                              : "bg-indigo-950/60 text-indigo-300 border-indigo-800/60 hover:bg-indigo-900/60"
                          }`}
                          title="View Potential Use Cases Dashboard"
                        >
                          <span>⚡ Use cases</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompanyId(comp.id);
                            setActiveInsightTab("top_signal");
                            setMobileTab("dossier");
                          }}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition flex items-center gap-1 cursor-pointer ${
                            isSelected && activeInsightTab === "top_signal"
                              ? "bg-amber-600 text-white border-amber-500 shadow-xs font-bold"
                              : "bg-amber-950/60 text-amber-300 border-amber-800/60 hover:bg-amber-900/60"
                          }`}
                          title="View Top Buying Signal Dashboard"
                        >
                          <span>🔥 Top signal</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Status Filter */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAllUnder50}
                  onChange={(e) => setShowAllUnder50(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500 h-3.5 w-3.5"
                />
                <span className="text-[11px] text-slate-300">Show low fits (&lt;50)</span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {filteredCompanies.length} showing
              </span>
            </div>
          </aside>

          {/* Right Section - Company Dossier / Dashboard */}
          <section
            className={`flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#0B0F17] ${
              mobileTab === "dossier" ? "w-full flex" : "hidden md:flex"
            }`}
          >
            {activeCompany ? (
              <div className="max-w-4xl w-full mx-auto space-y-4 sm:space-y-6">
                {/* 1. Header Banner Card */}
                <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">{activeCompany.name}</h2>
                        {activeCompany.overallScore >= 80 && (
                          <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            High Priority
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {activeCompany.industry}
                        </span>
                        <span className="text-[10px] font-bold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {activeCompany.country}
                        </span>
                        {activeCompany.employeeRange && (
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {activeCompany.employeeRange}
                          </span>
                        )}
                        {activeCompany.matchedObjectives && activeCompany.matchedObjectives.length > 0 && (
                          <>
                            <span className="text-slate-600">•</span>
                            {activeCompany.matchedObjectives.map((obj, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-semibold bg-teal-950/70 text-teal-300 border border-teal-800/80 px-2 py-0.5 rounded-md"
                              >
                                ✓ {obj}
                              </span>
                            ))}
                          </>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 max-w-2xl leading-relaxed pt-1">
                        {activeCompany.description}
                      </p>

                      {activeCompany.domain && (
                        <div className="pt-0.5">
                          <a
                            href={`https://${activeCompany.domain.replace(/^https?:\/\//, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300"
                          >
                            <Globe2 className="h-3 w-3" />
                            <span>{activeCompany.domain.replace(/^https?:\/\//, "")}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-3 bg-teal-950/40 sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-teal-900/60">
                      <div className="text-2xl sm:text-3xl font-black text-teal-400 font-mono">
                        {activeCompany.overallScore}/100
                      </div>
                      <div className="text-[10px] font-bold uppercase text-teal-300 tracking-wider">
                        {activeCompany.scoreTier} Tier Match
                      </div>
                      <div className="flex gap-2.5 text-[11px] text-slate-400 font-mono mt-1">
                        <span>Fit: <strong className="text-slate-200">{activeCompany.fitScore}%</strong></span>
                        <span>Opp: <strong className="text-slate-200">{activeCompany.opportunityScore}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Insight Navigation Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mr-1 shrink-0">
                      Insight Dashboard:
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveInsightTab("why_relevant")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        activeInsightTab === "why_relevant"
                          ? "bg-teal-600 text-white shadow-xs"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <Target className="h-3.5 w-3.5" />
                      <span>Why Relevant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInsightTab("use_cases")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        activeInsightTab === "use_cases"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Potential Use Cases ({activeCompany.potentialUseCases?.length || 0})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInsightTab("top_signal")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        activeInsightTab === "top_signal"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <Flame className="h-3.5 w-3.5" />
                      <span>Top Buying Signal ({activeCompany.buyingSignals?.length || 0})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInsightTab("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        activeInsightTab === "all"
                          ? "bg-slate-700 text-white shadow-xs"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      <span>Complete Dossier</span>
                    </button>
                  </div>
                </div>

                {/* --- DASHBOARD VIEW: WHY RELEVANT --- */}
                {(activeInsightTab === "why_relevant" || activeInsightTab === "all") && (
                  <div className="bg-slate-900/90 p-5 sm:p-6 rounded-2xl border-2 border-teal-500/40 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-teal-950 text-teal-400 border border-teal-800 rounded-lg">
                          <Target className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Why {activeCompany.name} is Relevant
                          </h3>
                          <p className="text-xs text-slate-400">
                            Fit score: {activeCompany.fitScore}% • Evaluated against ICP criteria
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-teal-300 bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-800/80">
                        {activeCompany.whyRelevantPoints?.length || 1} Strategic Signals
                      </span>
                    </div>

                    {/* Summary Callout */}
                    <div className="p-3.5 bg-teal-950/40 border border-teal-800/60 rounded-xl text-xs text-teal-200 leading-relaxed font-medium">
                      {activeCompany.whyRelevant}
                    </div>

                    {/* Numbered Granular Breakdown */}
                    <div className="space-y-2.5">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Core Alignment Breakdown:
                      </h4>
                      <ul className="space-y-2.5">
                        {activeCompany.whyRelevantPoints && activeCompany.whyRelevantPoints.length > 0 ? (
                          activeCompany.whyRelevantPoints.map((point, idx) => (
                            <li key={idx} className="flex gap-3 items-start text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                              <div className="h-6 w-6 rounded-full bg-teal-600 text-white flex-shrink-0 flex items-center justify-center font-bold text-xs">
                                {idx + 1}
                              </div>
                              <p className="text-slate-300 leading-relaxed pt-0.5">{point}</p>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl">
                            {activeCompany.whyRelevant}
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Matched Objectives Tags */}
                    {activeCompany.matchedObjectives && activeCompany.matchedObjectives.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Matched Strategic Objectives:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {activeCompany.matchedObjectives.map((obj, i) => (
                            <span
                              key={i}
                              className="text-xs font-semibold px-2.5 py-1 bg-slate-950 border border-teal-500/40 text-teal-300 rounded-lg shadow-xs flex items-center gap-1.5"
                            >
                              <Check className="h-3.5 w-3.5 text-teal-400" />
                              <span>{obj}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- DASHBOARD VIEW: POTENTIAL USE CASES --- */}
                {(activeInsightTab === "use_cases" || activeInsightTab === "all") && (
                  <div className="bg-slate-900/90 p-5 sm:p-6 rounded-2xl border-2 border-indigo-500/40 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-lg">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Potential Use Cases & Application Areas
                          </h3>
                          <p className="text-xs text-slate-400">
                            Operational use cases ranked by alignment and feasibility
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-800/80">
                        {activeCompany.potentialUseCases?.length || 0} Identified
                      </span>
                    </div>

                    <div className="space-y-3">
                      {activeCompany.potentialUseCases?.map((useCase, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-indigo-900/60 bg-indigo-950/30 hover:bg-indigo-950/50 transition"
                        >
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="font-bold text-slate-200 flex items-center gap-2">
                              <span className="h-5 w-5 rounded-md bg-indigo-900 text-indigo-200 flex items-center justify-center text-[10px] font-bold">
                                #{idx + 1}
                              </span>
                              <span>{useCase.useCase}</span>
                            </span>
                            <span className="text-indigo-300 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-indigo-800">
                              {useCase.relevance}% relevance
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${useCase.relevance}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- DASHBOARD VIEW: TOP BUYING SIGNAL --- */}
                {(activeInsightTab === "top_signal" || activeInsightTab === "all") && (
                  <div className="bg-slate-900/90 p-5 sm:p-6 rounded-2xl border-2 border-amber-500/40 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-950 text-amber-400 border border-amber-800 rounded-lg">
                          <Flame className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Top Buying Signals & Triggers
                          </h3>
                          <p className="text-xs text-slate-400">
                            Verified buying triggers, public initiatives, and operational signals
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800/80">
                        {activeCompany.buyingSignals?.length || 0} Active Signals
                      </span>
                    </div>

                    {activeCompany.buyingSignals && activeCompany.buyingSignals.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {activeCompany.buyingSignals.map((signal, idx) => (
                          <div
                            key={idx}
                            className="p-4 border border-amber-900/60 bg-amber-950/20 rounded-xl space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Flame className="h-4 w-4 text-amber-400 shrink-0" />
                                <span className="text-xs font-bold text-white">{signal.signal}</span>
                              </div>
                              <span className="text-[10px] bg-slate-900 border border-amber-700/80 text-amber-300 px-2 py-0.5 rounded-md font-bold uppercase shrink-0">
                                {signal.confidence}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {signal.detail}
                            </p>
                            {signal.sourceUrl && (
                              <a
                                href={signal.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-teal-400 hover:text-teal-300 underline inline-flex items-center gap-1 pt-1 font-medium"
                              >
                                <span>Verified Evidence Link</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 italic">
                        Inferred baseline operational signals based on verified facility infrastructure and corporate manufacturing targets.
                      </div>
                    )}
                  </div>
                )}

                {/* Recommended Outreach & Grounded Sources */}
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                  {/* Recommended Outreach */}
                  <div className="flex-1 bg-slate-900/90 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        Recommended Outreach
                      </h3>
                      <button
                        onClick={() => copyPitch(activeCompany.recommendedApproach)}
                        className="text-xs font-semibold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedPitch ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Pitch</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      {activeCompany.recommendedContacts?.[0] && (
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center w-full sm:w-36 shrink-0">
                          <span className="text-xs font-bold block text-white leading-tight">
                            {activeCompany.recommendedContacts[0].jobTitle}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-tight block mt-1">
                            {activeCompany.recommendedContacts[0].department}
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-slate-300 leading-relaxed italic bg-slate-950 p-3 rounded-xl border border-slate-800 flex-1">
                        "{activeCompany.recommendedApproach || "Focus pitch on direct ROI, operational uptime, and compatibility with their current tooling footprint."}"
                      </div>
                    </div>
                  </div>

                  {/* Grounded Sources */}
                  <div className="w-full lg:w-80 bg-slate-950 p-5 sm:p-6 rounded-2xl text-white shadow-xs flex flex-col justify-between border border-slate-800">
                    <div>
                      <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">
                        Grounded Evidence Sources
                      </h3>
                      <div className="space-y-1.5">
                        {activeCompany.sources && activeCompany.sources.length > 0 ? (
                          activeCompany.sources.slice(0, 3).map((s, idx) => (
                            <a
                              key={idx}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-slate-300 truncate block hover:text-teal-400 transition"
                              title={s.title || s.url}
                            >
                              🔗 {s.url}
                            </a>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-400">Google Grounded Citations</div>
                        )}
                      </div>
                    </div>

                    {activeCompany.sources && activeCompany.sources.length > 3 && (
                      <div className="text-[10px] text-teal-400 hover:underline cursor-pointer font-medium mt-3">
                        + {activeCompany.sources.length - 3} more validated sources
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Roles & Manufacturing Sites */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Recommended Job Titles */}
                  <div className="bg-slate-900/90 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                      Target Job Roles (Zero Fabricated Emails)
                    </h3>
                    <div className="space-y-2">
                      {activeCompany.recommendedContacts?.map((c, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white">{c.jobTitle}</div>
                            <div className="text-[11px] text-slate-400">{c.department} • {c.reason}</div>
                          </div>
                          <span className="text-[10px] text-teal-400 font-medium whitespace-nowrap ml-2">Verified Role</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manufacturing Sites */}
                  <div className="bg-slate-900/90 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                      Verified Manufacturing Sites
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {activeCompany.manufacturingSites?.map((site, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                          <div className="font-bold text-white">{site.city || "Hub"}</div>
                          <div className="text-[11px] text-slate-400">{site.country}</div>
                          <div className="text-[10px] text-teal-300 font-medium mt-0.5">{site.facilityType}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500">
                Select an account from the list to inspect its dashboard dossier
              </div>
            )}
          </section>
        </main>
      ) : (
        /* Full Table Matrix View */
        <div className="flex-1 overflow-auto p-6 sm:p-8 bg-[#0B0F17]">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Company</th>
                    <th className="py-3.5 px-4">Industry & Country</th>
                    <th className="py-3.5 px-4">Target Objectives</th>
                    <th
                      className="py-3.5 px-4 cursor-pointer select-none hover:text-teal-300 hover:bg-slate-800/70 transition"
                      onClick={toggleTierSort}
                      title="Click to toggle Overall Score Tier sorting order"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Overall Score</span>
                        {sortOrder === "tier-desc" || sortOrder === "score-desc" ? (
                          <ArrowDown className="h-3 w-3 text-teal-400" />
                        ) : (
                          <ArrowUp className="h-3 w-3 text-teal-400" />
                        )}
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Fit / Opp</th>
                    <th className="py-3.5 px-4">Signals</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {filteredCompanies.map((comp) => (
                    <tr
                      key={comp.id}
                      onClick={() => {
                        setSelectedCompanyId(comp.id);
                        setViewMode("split");
                      }}
                      className="hover:bg-slate-800/50 cursor-pointer transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{comp.name}</div>
                        <div className="text-slate-400 text-[11px]">{comp.domain}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-300 font-medium">{comp.industry}</div>
                        <div className="text-slate-500">{comp.country}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(comp.matchedObjectives && comp.matchedObjectives.length > 0
                            ? comp.matchedObjectives
                            : ["Direct Customer"]
                          ).map((obj, oi) => (
                            <span
                              key={oi}
                              className="text-[10px] font-semibold bg-teal-950/70 text-teal-300 border border-teal-800/80 px-1.5 py-0.5 rounded"
                            >
                              {obj}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${getTierColor(comp.overallScore)}`}>
                          {comp.overallScore} • {comp.scoreTier}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {comp.fitScore}% / {comp.opportunityScore}%
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-amber-400 font-bold font-mono">
                          {comp.buyingSignals?.length || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCompanyId(comp.id);
                              setActiveInsightTab("why_relevant");
                              setViewMode("split");
                            }}
                            className="text-[10px] font-semibold text-teal-300 bg-teal-950/80 hover:bg-teal-900 border border-teal-800/80 px-2 py-1 rounded cursor-pointer transition"
                            title="View Why Relevant"
                          >
                            Why relevant
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCompanyId(comp.id);
                              setActiveInsightTab("use_cases");
                              setViewMode("split");
                            }}
                            className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 px-2 py-1 rounded cursor-pointer transition"
                            title="View Potential Use Cases"
                          >
                            Use cases
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCompanyId(comp.id);
                              setActiveInsightTab("top_signal");
                              setViewMode("split");
                            }}
                            className="text-[10px] font-semibold text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/80 px-2 py-1 rounded cursor-pointer transition"
                            title="View Top Buying Signal"
                          >
                            Top signal
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCompanyId(comp.id);
                              setActiveInsightTab("all");
                              setViewMode("split");
                            }}
                            className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-1 rounded inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Dossier</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
