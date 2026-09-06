import React, { useState, useEffect } from "react";
import {
  Factory,
  Search,
  Globe2,
  Check,
  Building2,
  Plus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Cpu,
  HelpCircle,
  ArrowLeft,
  Zap,
  Target,
  FileSpreadsheet,
} from "lucide-react";
import { ObjectiveType } from "../types.ts";

interface LandingPageProps {
  onSubmit: (params: {
    productDescription: string;
    companyWebsite: string;
    industries: string[];
    countries: string[];
    objective: ObjectiveType | string;
    objectives: ObjectiveType[];
    companySizePref: string;
  }) => void;
  isLoading?: boolean;
  onBackToIntro?: () => void;
  initialPreset?: {
    productDescription?: string;
    industries?: string[];
    countries?: string[];
    objectives?: ObjectiveType[];
  } | null;
}

const DEFAULT_INDUSTRIES = [
  "Automotive",
  "Aerospace",
  "Chemicals",
  "Pharma",
  "Semiconductor",
  "Electronics",
  "Steel",
  "Energy",
  "Heavy Machinery",
  "Precision Engineering",
  "Food Manufacturing",
  "Oil & Gas",
  "Robotics",
];

const REGIONAL_COUNTRIES: Record<string, string[]> = {
  "Europe": ["Germany", "Italy", "France", "United Kingdom", "Spain", "Poland", "Netherlands", "Sweden", "Switzerland"],
  "North America": ["United States", "Mexico", "Canada"],
  "Asia": ["Japan", "South Korea", "China", "India", "Taiwan", "Singapore", "Vietnam", "Malaysia"],
  "Middle East": ["Saudi Arabia", "United Arab Emirates", "Turkey", "Qatar"],
};

const OBJECTIVES: Array<{ value: ObjectiveType; label: string; desc: string }> = [
  { value: "customers", label: "Direct Customers", desc: "Factories and plant owners buying directly for their operations" },
  { value: "distributors", label: "Distributors & VARs", desc: "Regional industrial distributors, value-added resellers & dealers" },
  { value: "pilot", label: "Pilot Customers", desc: "Innovative production facilities ready to validate early stage technology" },
  { value: "OEM", label: "OEM Partnerships", desc: "Tier 1 & Tier 2 suppliers incorporating your hardware/software" },
  { value: "partners", label: "System Integrators & Tech Partners", desc: "Engineering firms and automation partners deploying full solutions" },
  { value: "contract_manufacturing", label: "Contract Manufacturers & EMS", desc: "Contract production plants and electronics manufacturing services" },
  { value: "mro", label: "MRO & Aftermarket Service", desc: "Maintenance, repair & overhaul facilities servicing operating plants" },
  { value: "joint_venture", label: "Joint Venture / Co-Development", desc: "Strategic industrial partners for co-engineering next-gen offerings" },
];

const PRESETS = [
  {
    title: "Predictive Maintenance IoT",
    desc: "Wireless vibration & temperature acoustic sensors for CNC spindles and heavy gearboxes with AI anomaly detection.",
    industries: ["Automotive", "Heavy Machinery", "Precision Engineering"],
    countries: ["Germany", "Japan", "United States"],
    objectives: ["customers", "distributors", "pilot"] as ObjectiveType[],
  },
  {
    title: "Automated Optical Inspection (AOI)",
    desc: "High-speed 3D robotic vision inspection systems detecting sub-millimeter micro-cracks in printed circuit boards and batteries.",
    industries: ["Electronics", "Semiconductor", "Automotive"],
    countries: ["Japan", "South Korea", "Germany", "Taiwan"],
    objectives: ["OEM", "customers", "pilot"] as ObjectiveType[],
  },
  {
    title: "Industrial Decarbonization Heat Exchangers",
    desc: "Supercritical CO2 waste-heat recovery modular exchangers reducing furnace gas consumption by up to 28% in continuous smelters.",
    industries: ["Steel", "Chemicals", "Heavy Machinery"],
    countries: ["United States", "Germany", "Italy"],
    objectives: ["customers", "distributors"] as ObjectiveType[],
  },
  {
    title: "Robotic Autonomous Mobile Platforms (AMR)",
    desc: "Autonomous laser-guided heavy payload mobile transport platforms for moving dies and stamped steel components across press bays.",
    industries: ["Automotive", "Robotics", "Heavy Machinery"],
    countries: ["Germany", "United States", "Mexico"],
    objectives: ["customers", "partners", "OEM"] as ObjectiveType[],
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onSubmit,
  isLoading,
  onBackToIntro,
  initialPreset,
}) => {
  const [productDescription, setProductDescription] = useState(
    initialPreset?.productDescription ||
      "Predictive vibration and acoustic ultrasound sensors for industrial CNC machine tools and robotic assembly arms to eliminate unplanned downtime."
  );
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    initialPreset?.industries || ["Automotive", "Heavy Machinery", "Precision Engineering"]
  );
  const [customIndustry, setCustomIndustry] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initialPreset?.countries || ["Germany", "Japan", "United States"]
  );
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedObjectives, setSelectedObjectives] = useState<ObjectiveType[]>(
    initialPreset?.objectives || ["customers", "distributors", "pilot"]
  );
  const [companySizePref, setCompanySizePref] = useState("Mid to Large Enterprise (500+ employees)");

  useEffect(() => {
    if (initialPreset) {
      if (initialPreset.productDescription) setProductDescription(initialPreset.productDescription);
      if (initialPreset.industries) setSelectedIndustries(initialPreset.industries);
      if (initialPreset.countries) setSelectedCountries(initialPreset.countries);
      if (initialPreset.objectives) setSelectedObjectives(initialPreset.objectives);
    }
  }, [initialPreset]);

  const toggleObjective = (val: ObjectiveType) => {
    if (selectedObjectives.includes(val)) {
      if (selectedObjectives.length > 1) {
        setSelectedObjectives(selectedObjectives.filter((o) => o !== val));
      }
    } else {
      setSelectedObjectives([...selectedObjectives, val]);
    }
  };

  const selectAllObjectives = () => {
    setSelectedObjectives(OBJECTIVES.map((o) => o.value));
  };

  const selectCoreObjectives = () => {
    setSelectedObjectives(["customers", "distributors", "pilot"]);
  };

  const toggleIndustry = (ind: string) => {
    if (selectedIndustries.includes(ind)) {
      if (selectedIndustries.length > 1) {
        setSelectedIndustries(selectedIndustries.filter((i) => i !== ind));
      }
    } else {
      setSelectedIndustries([...selectedIndustries, ind]);
    }
  };

  const addCustomIndustry = () => {
    const trimmed = customIndustry.trim();
    if (trimmed && !selectedIndustries.includes(trimmed)) {
      setSelectedIndustries([...selectedIndustries, trimmed]);
      setCustomIndustry("");
    }
  };

  const toggleCountry = (country: string) => {
    if (selectedCountries.includes(country)) {
      if (selectedCountries.length > 1) {
        setSelectedCountries(selectedCountries.filter((c) => c !== country));
      }
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  const selectAllInRegion = (region: string) => {
    const countriesInRegion = REGIONAL_COUNTRIES[region] || [];
    const allSelected = countriesInRegion.every((c) => selectedCountries.includes(c));
    if (allSelected) {
      const remaining = selectedCountries.filter((c) => !countriesInRegion.includes(c));
      if (remaining.length > 0) {
        setSelectedCountries(remaining);
      }
    } else {
      const merged = Array.from(new Set([...selectedCountries, ...countriesInRegion]));
      setSelectedCountries(merged);
    }
  };

  const loadPreset = (preset: (typeof PRESETS)[0]) => {
    setProductDescription(preset.desc);
    setSelectedIndustries(preset.industries);
    setSelectedCountries(preset.countries);
    setSelectedObjectives(preset.objectives);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !productDescription.trim() ||
      selectedIndustries.length === 0 ||
      selectedCountries.length === 0 ||
      selectedObjectives.length === 0
    ) {
      return;
    }
    onSubmit({
      productDescription: productDescription.trim(),
      companyWebsite: companyWebsite.trim(),
      industries: selectedIndustries,
      countries: selectedCountries,
      objective: selectedObjectives.join(", "),
      objectives: selectedObjectives,
      companySizePref,
    });
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#0B0F17] py-6 sm:py-8 lg:py-10 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        {/* Top Header & Breadcrumb / Back Button */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {onBackToIntro && (
                <button
                  type="button"
                  onClick={onBackToIntro}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs mr-1"
                  title="Return to Intro Overview"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Overview</span>
                </button>
              )}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-950/60 px-3 py-0.5 text-[11px] font-bold text-teal-300">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                <span>Search-Grounded AI Prospecting • Zero Fabricated Contacts</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Configure Target Industrial Market Scan
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Provide details on what your company manufactures or supplies. We will find operating plants and decision-makers in your target verticals.
            </p>
          </div>

          {/* Preset quick buttons on laptop */}
          <div className="flex flex-col sm:items-end gap-1 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Quick Test Presets:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESETS.slice(0, 3).map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => loadPreset(p)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-xs"
                >
                  <Sparkles className="h-3 w-3 text-teal-400" />
                  <span>{p.title.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Widescreen / Laptop 12-Column Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Main Form Body (8 Columns on Laptop) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Product Description */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="productDescription" className="block text-sm font-bold text-white">
                  1. What does your company sell? <span className="text-teal-400">*</span>
                </label>
                <span className="text-xs text-slate-400">Hardware, automation, or software</span>
              </div>
              <textarea
                id="productDescription"
                rows={4}
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="e.g. Automated visual inspection cameras with sub-millimeter defect detection for stamping lines..."
                className="block w-full rounded-xl border border-slate-700 p-3.5 text-sm text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-slate-950"
                required
              />

              <div className="pt-1">
                <label htmlFor="companyWebsite" className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Company Website <span className="text-slate-500 font-normal">(Optional, helps contextualize your solution)</span>
                </label>
                <div className="relative">
                  <Globe2 className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="companyWebsite"
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="block w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            </div>

            {/* 2. Target Industries */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-white">
                  2. Target Industries <span className="text-teal-400">*</span>
                </label>
                <span className="text-xs font-bold text-teal-300 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800/80">
                  {selectedIndustries.length} selected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Select manufacturing verticals where your product provides highest operational value.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {DEFAULT_INDUSTRIES.map((ind) => {
                  const active = selectedIndustries.includes(ind);
                  return (
                    <button
                      type="button"
                      key={ind}
                      onClick={() => toggleIndustry(ind)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        active
                          ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20"
                          : "border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {active && <Check className="h-3.5 w-3.5 text-slate-950 stroke-[3]" />}
                      <span>{ind}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add custom industry */}
              <div className="pt-2 flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomIndustry();
                    }
                  }}
                  placeholder="+ Add custom industry..."
                  className="block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomIndustry}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* 3. Target Countries */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-white">
                  3. Target Countries & Regions <span className="text-teal-400">*</span>
                </label>
                <span className="text-xs font-bold text-teal-300 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800/80">
                  {selectedCountries.length} countries selected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Filter companies with active manufacturing and production operations in these geographic territories.
              </p>

              <div className="space-y-3 pt-1">
                {Object.entries(REGIONAL_COUNTRIES).map(([region, countries]) => {
                  const allSelected = countries.every((c) => selectedCountries.includes(c));
                  return (
                    <div key={region} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          {region}
                        </span>
                        <button
                          type="button"
                          onClick={() => selectAllInRegion(region)}
                          className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
                        >
                          {allSelected ? "Deselect region" : "Select all in region"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {countries.map((country) => {
                          const active = selectedCountries.includes(country);
                          return (
                            <button
                              type="button"
                              key={country}
                              onClick={() => toggleCountry(country)}
                              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                                active
                                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-bold"
                                  : "border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              {active && <Check className="h-3 w-3 text-slate-950 stroke-[3]" />}
                              <span>{country}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Go-to-Market Objectives */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <label className="block text-sm font-bold text-white">
                  4. Go-To-Market Objective <span className="text-teal-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-teal-300 bg-teal-950/80 border border-teal-800/80 px-2 py-0.5 rounded-full">
                    {selectedObjectives.length} selected
                  </span>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={selectCoreObjectives}
                    className="text-xs font-semibold text-slate-400 hover:text-teal-300 cursor-pointer"
                  >
                    Core 3
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={selectAllObjectives}
                    className="text-xs font-semibold text-slate-400 hover:text-teal-300 cursor-pointer"
                  >
                    Select all
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Specify what type of commercial partner or buyer relationships you want uncovered.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {OBJECTIVES.map((obj) => {
                  const active = selectedObjectives.includes(obj.value);
                  return (
                    <button
                      type="button"
                      key={obj.value}
                      onClick={() => toggleObjective(obj.value)}
                      className={`flex flex-col text-left p-3.5 rounded-xl border transition cursor-pointer ${
                        active
                          ? "border-teal-500/80 bg-teal-950/30 ring-1 ring-teal-500/50 shadow-md"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-4 w-4 rounded flex items-center justify-center border transition ${
                              active
                                ? "bg-teal-500 border-teal-500 text-slate-950"
                                : "border-slate-700 bg-slate-900"
                            }`}
                          >
                            {active && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-bold text-white">{obj.label}</span>
                        </div>
                        {active && (
                          <span className="text-[10px] font-bold text-teal-300 bg-teal-950 border border-teal-800/80 px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="mt-1.5 pl-6 text-[11px] text-slate-400 leading-relaxed">
                        {obj.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Company Scale */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7 shadow-xl space-y-2">
              <label htmlFor="companySize" className="block text-sm font-bold text-white">
                5. Operating Plant Scale Preference
              </label>
              <select
                id="companySize"
                value={companySizePref}
                onChange={(e) => setCompanySizePref(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="Any company scale">Any scale (Tier 1 conglomerates to specialized precision plants)</option>
                <option value="Mid to Large Enterprise (500+ employees)">Mid to Large Enterprise (500+ employees / multi-plant networks)</option>
                <option value="Large Conglomerates (5,000+ employees)">Global Tier 1 Giants (5,000+ employees)</option>
                <option value="Mid-Market Factories (100 - 500 employees)">Mid-Market Focused Factories (100 - 500 employees)</option>
              </select>
            </div>

            {/* Submit Bar for mobile/bottom */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
                <span>Runs 3-stage Google Search grounded pipeline with deterministic scoring</span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !productDescription.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-7 py-3.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/20 hover:bg-teal-400 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>Scanning Global Industry...</span>
                  </>
                ) : (
                  <>
                    <span>Launch Market Intelligence Scan</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Sticky Sidebar (4 Columns on Laptop) */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            {/* Live Scan Readiness Card */}
            <div className="rounded-2xl border-2 border-teal-500/40 bg-slate-900/95 p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center font-bold text-xs">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Scan Summary</h3>
                    <p className="text-[11px] text-slate-400">Real-time configuration</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              </div>

              {/* Stat breakdown */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Target Verticals:</span>
                  <span className="font-bold text-slate-200">{selectedIndustries.length} Industries</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Operating Countries:</span>
                  <span className="font-bold text-slate-200">{selectedCountries.length} Countries</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Commercial Objectives:</span>
                  <span className="font-bold text-slate-200">{selectedObjectives.length} Objectives</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Est. Account Yield:</span>
                  <span className="font-mono font-bold text-teal-400">15 – 30 Profiles</span>
                </div>
              </div>

              {/* Primary Direct Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !productDescription.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-xs sm:text-sm font-extrabold text-slate-950 shadow-lg shadow-teal-500/25 hover:bg-teal-400 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>Executing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <span>Start Market Scan</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-[10px] text-slate-500 text-center font-medium">
                ⚡ Typical scan completes in ~40 seconds
              </div>
            </div>

            {/* Quick Preset Selector Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                <span>1-Click Test Configurations</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Click any preset to instantly populate high-converting hardware or software templates:
              </p>

              <div className="space-y-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => loadPreset(p)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-teal-500/50 hover:bg-teal-950/20 transition text-xs space-y-1 cursor-pointer"
                  >
                    <div className="font-bold text-slate-200 text-[11px] flex items-center justify-between">
                      <span>{p.title}</span>
                      <span className="text-[10px] text-teal-400">Load ↗</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {p.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality & Zero-Spam Guarantee Box */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 text-white p-5 shadow-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-teal-400 font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>Zero-Hallucination Quality Guard</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ManufactureIQ never fabricates email addresses or generates placeholder companies. Every output reflects real manufacturing operations with verifiable digital evidence.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

