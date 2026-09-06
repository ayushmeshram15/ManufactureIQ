import React, { useState, useEffect } from "react";
import { History, PlusCircle, ChevronDown, Download, Sparkles, ShieldCheck } from "lucide-react";
import { SearchQuery } from "../types.ts";
import { listSearches } from "../lib/firestore.ts";

interface NavbarProps {
  currentSearch: SearchQuery | null;
  currentView?: string;
  onNavigateHome: () => void;
  onNavigateNew: () => void;
  onSelectSearch: (search: SearchQuery) => void;
  onExportCSV?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSearch,
  currentView = "intro",
  onNavigateHome,
  onNavigateNew,
  onSelectSearch,
  onExportCSV,
}) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [searches, setSearches] = useState<SearchQuery[]>([]);

  useEffect(() => {
    listSearches().then(setSearches);
  }, [currentSearch?.status, currentSearch?.id, historyOpen]);

  // Format short product name
  const shortProduct = currentSearch?.productDescription
    ? currentSearch.productDescription.length > 28
      ? currentSearch.productDescription.slice(0, 28) + "..."
      : currentSearch.productDescription
    : null;

  const shortCountries = currentSearch?.countries?.length
    ? currentSearch.countries.slice(0, 2).join(", ") + (currentSearch.countries.length > 2 ? ` +${currentSearch.countries.length - 2}` : "")
    : null;

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0B0F17] flex items-center justify-between px-4 sm:px-8 flex-shrink-0 sticky top-0 z-40 text-slate-100 shadow-md">
      {/* Left: Brand + Enterprise Badge + Nav Links */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 transition hover:opacity-90 focus:outline-none cursor-pointer"
        >
          <div className="bg-gradient-to-br from-teal-400 to-teal-600 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-500/20">
            <div className="w-3.5 h-3.5 border-2 border-slate-950 rounded-xs"></div>
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-white leading-tight">
                ManufactureIQ
              </span>
              <span className="text-[9px] font-mono font-bold bg-teal-950/80 text-teal-400 border border-teal-800/80 px-1.5 py-0.2 rounded uppercase">
                ENTERPRISE
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase leading-none">
              Industrial Deal Intelligence
            </span>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-800">
          <button
            type="button"
            onClick={onNavigateHome}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentView === "intro"
                ? "bg-slate-800 text-white font-bold border border-slate-700 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={onNavigateNew}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentView === "new"
                ? "bg-teal-950 text-teal-300 font-bold border border-teal-500/50 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            New Market Scan
          </button>
        </nav>

        {currentSearch && (
          <>
            <div className="hidden xl:block h-4 w-[1px] bg-slate-800 mx-1"></div>
            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-500">Active Query:</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-200 font-medium max-w-[160px] truncate" title={currentSearch.productDescription}>
                {shortProduct}
              </span>
              <span>in</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-200 font-medium">
                {shortCountries}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Export CSV if provided */}
        {onExportCSV && (
          <button
            type="button"
            onClick={onExportCSV}
            className="text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-teal-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        )}

        {/* History Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition focus:outline-none cursor-pointer"
          >
            <History className="h-3.5 w-3.5 text-teal-400" />
            <span className="hidden sm:inline">Past Scans</span>
            {searches.length > 0 && (
              <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono font-bold text-teal-300">
                {searches.length}
              </span>
            )}
            <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${historyOpen ? "rotate-180" : ""}`} />
          </button>

          {historyOpen && (
            <>
              <div
                className="fixed inset-0 z-20 cursor-default"
                onClick={() => setHistoryOpen(false)}
              />
              <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl ring-1 ring-white/10">
                <div className="border-b border-slate-800/80 px-3 py-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Past Market Scans</span>
                  <span className="text-[10px] text-teal-400">Archived</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 py-1">
                  {searches.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No previous scans recorded
                    </div>
                  ) : (
                    searches.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          onSelectSearch(s);
                          setHistoryOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg transition hover:bg-slate-900 flex flex-col gap-1 cursor-pointer ${
                          currentSearch?.id === s.id ? "bg-teal-950/40 border-l-3 border-teal-500" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                          <span className="truncate max-w-[190px]">{s.productDescription}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${
                              s.status === "complete"
                                ? "bg-teal-950 text-teal-300 border border-teal-800/60"
                                : s.status === "researching"
                                ? "bg-amber-950 text-amber-300 border border-amber-800/60 animate-pulse"
                                : "bg-red-950 text-red-400"
                            }`}
                          >
                            {s.status === "complete" ? `${s.companiesCount || 0} accounts` : s.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{s.countries?.slice(0, 2).join(", ")}</span>
                          <span>•</span>
                          <span>{new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Get Started / New Search CTA */}
        <button
          type="button"
          onClick={onNavigateNew}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold px-4 py-1.5 rounded-lg shadow-md shadow-teal-500/20 transition inline-flex items-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>New Market Scan</span>
        </button>
      </div>
    </header>
  );
};
