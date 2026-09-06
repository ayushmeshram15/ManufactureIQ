import React, { useState, useEffect, useCallback } from "react";
import { Company, ObjectiveType, SearchQuery } from "./types.ts";
import { Navbar } from "./components/Navbar.tsx";
import { IntroPage } from "./components/IntroPage.tsx";
import { LandingPage } from "./components/LandingPage.tsx";
import { ProgressPage } from "./components/ProgressPage.tsx";
import { DashboardPage } from "./components/DashboardPage.tsx";
import { CompanyDetailPage } from "./components/CompanyDetailPage.tsx";
import {
  getCompanies,
  getSearch,
  getSessionId,
  listSearches,
  saveSearch,
  subscribeCompanies,
  subscribeSearch,
} from "./lib/firestore.ts";
import { executeResearchPipeline } from "./lib/gemini.ts";
import { exportCompaniesToCSV } from "./lib/csvExport.ts";

export default function App() {
  const [view, setView] = useState<"intro" | "new" | "progress" | "dashboard" | "company">("intro");
  const [currentSearch, setCurrentSearch] = useState<SearchQuery | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [initialPreset, setInitialPreset] = useState<{
    productDescription?: string;
    industries?: string[];
    countries?: string[];
    objectives?: ObjectiveType[];
  } | null>(null);

  // Load last active search or handle browser hash on load
  useEffect(() => {
    const handleHashOrInitial = async () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash === "new") {
        setView("new");
        return;
      }
      if (hash === "intro") {
        setView("intro");
        return;
      }
      if (hash.startsWith("search/")) {
        const parts = hash.split("/");
        const searchId = parts[1];
        const s = await getSearch(searchId);
        if (s) {
          setCurrentSearch(s);
          if (parts[2] === "company" && parts[3]) {
            setSelectedCompanyId(parts[3]);
            setView("company");
          } else if (s.status === "researching") {
            setView("progress");
          } else {
            setView("dashboard");
          }
          return;
        }
      }
      // Default view is the new dynamic intro page
      setView("intro");
    };

    handleHashOrInitial();
  }, []);

  // Listen to active search updates
  useEffect(() => {
    if (!currentSearch?.id) return;

    const unsubSearch = subscribeSearch(currentSearch.id, (s) => {
      if (s) {
        setCurrentSearch(s);
      }
    });

    const unsubCompanies = subscribeCompanies(currentSearch.id, (comps) => {
      setCompanies(comps);
    });

    return () => {
      unsubSearch();
      unsubCompanies();
    };
  }, [currentSearch?.id]);

  // Handle Starting a New Search
  const handleStartSearch = async (params: {
    productDescription: string;
    companyWebsite: string;
    industries: string[];
    countries: string[];
    objective?: ObjectiveType | string;
    objectives?: ObjectiveType[];
    companySizePref: string;
  }) => {
    const searchId = "search_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
    const activeObjectives = params.objectives && params.objectives.length > 0
      ? params.objectives
      : params.objective
      ? [params.objective as ObjectiveType]
      : (["customers", "distributors", "pilot"] as ObjectiveType[]);

    const newSearch: SearchQuery = {
      id: searchId,
      sessionId: getSessionId(),
      productDescription: params.productDescription,
      companyWebsite: params.companyWebsite,
      industries: params.industries,
      countries: params.countries,
      objective: params.objective || activeObjectives.join(", "),
      objectives: activeObjectives,
      companySizePref: params.companySizePref,
      createdAt: Date.now(),
      status: "researching",
      progressStep: "Analyzing target manufacturing ecosystem...",
      logs: [
        `Target verticals: ${params.industries.join(", ")}`,
        `Operating geographies: ${params.countries.join(", ")}`,
        `Objectives: ${activeObjectives.join(", ")}`,
      ],
      companiesCount: 0,
      highPriorityCount: 0,
      buyingSignalsCount: 0,
    };

    await saveSearch(newSearch);
    setCurrentSearch(newSearch);
    setCompanies([]);
    setSelectedCompanyId(null);
    setView("progress");
    window.location.hash = `search/${searchId}`;

    setIsResearching(true);
    try {
      await executeResearchPipeline(newSearch);
      // Auto-switch to dashboard when complete if still on progress view
      setView((prev) => (prev === "progress" ? "dashboard" : prev));
    } catch (err) {
      console.error("Pipeline failure in App", err);
    } finally {
      setIsResearching(false);
    }
  };

  // Re-run search
  const handleRerun = async () => {
    if (!currentSearch) return;
    setView("progress");
    setIsResearching(true);
    try {
      await executeResearchPipeline(currentSearch);
      setView("dashboard");
    } catch (err) {
      console.error("Rerun failed", err);
    } finally {
      setIsResearching(false);
    }
  };

  // Selected company object
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || null;

  return (
    <div className="min-h-screen bg-[#0B0F17] font-sans text-slate-100 antialiased selection:bg-teal-500 selection:text-white flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentSearch={currentSearch}
        currentView={view}
        onNavigateHome={() => {
          setView("intro");
          window.location.hash = "intro";
        }}
        onNavigateNew={() => {
          setView("new");
          window.location.hash = "new";
        }}
        onSelectSearch={async (s) => {
          setCurrentSearch(s);
          const comps = await getCompanies(s.id);
          setCompanies(comps);
          if (s.status === "researching") {
            setView("progress");
          } else {
            setView("dashboard");
          }
          window.location.hash = `search/${s.id}`;
        }}
        onExportCSV={
          companies.length > 0 && currentSearch
            ? () => exportCompaniesToCSV(companies, currentSearch)
            : undefined
        }
      />

      {/* Main Content Areas */}
      <main className={view === "dashboard" ? "flex-1 overflow-hidden" : "flex-1"}>
        {view === "intro" && (
          <IntroPage
            onGetStarted={(preset) => {
              if (preset) {
                setInitialPreset(preset);
              }
              setView("new");
              window.location.hash = "new";
            }}
          />
        )}

        {view === "new" && (
          <LandingPage
            onSubmit={handleStartSearch}
            isLoading={isResearching}
            onBackToIntro={() => {
              setView("intro");
              window.location.hash = "intro";
            }}
            initialPreset={initialPreset}
          />
        )}

        {view === "progress" && currentSearch && (
          <ProgressPage
            search={currentSearch}
            onViewDashboard={() => {
              setView("dashboard");
              window.location.hash = `search/${currentSearch.id}/dashboard`;
            }}
            onRetry={handleRerun}
          />
        )}

        {view === "dashboard" && currentSearch && (
          <DashboardPage
            search={currentSearch}
            companies={companies}
            onSelectCompany={(companyId) => {
              setSelectedCompanyId(companyId);
              setView("company");
              window.location.hash = `search/${currentSearch.id}/company/${companyId}`;
            }}
            onNewSearch={() => {
              setView("new");
              window.location.hash = "new";
            }}
            onRerun={handleRerun}
          />
        )}

        {view === "company" && currentSearch && selectedCompany && (
          <CompanyDetailPage
            company={selectedCompany}
            search={currentSearch}
            onBack={() => {
              setView("dashboard");
              window.location.hash = `search/${currentSearch.id}/dashboard`;
            }}
          />
        )}
      </main>
    </div>
  );
}
