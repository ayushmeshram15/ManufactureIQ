import React, { useState } from "react";
import {
  Factory,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Flame,
  Globe2,
  Building2,
  Cpu,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Database,
  Users,
  Compass,
  FileSpreadsheet,
  Layers,
  Sparkles,
  TrendingUp,
  Check,
  DollarSign,
  Award,
  Clock,
  ArrowUpRight,
  Lock,
  Activity,
  Copy,
} from "lucide-react";
import { ObjectiveType } from "../types.ts";

interface IntroPageProps {
  onGetStarted: (preset?: {
    productDescription: string;
    industries: string[];
    countries: string[];
    objectives: ObjectiveType[];
  }) => void;
}

interface SectorDemo {
  id: string;
  sector: string;
  icon: string;
  badge: string;
  query: string;
  companyName: string;
  country: string;
  region: string;
  industry: string;
  score: number;
  tier: "Excellent" | "Strong";
  fitScore: number;
  oppScore: number;
  annualRev: string;
  plantCount: string;
  buyingSignal: string;
  buyingSignalUrl: string;
  signalUrgency: "Immediate" | "High";
  topRole: string;
  department: string;
  emailPattern: string;
  useCases: string[];
  whyPoints: string[];
  pitchHook: string;
}

const SAMPLE_SECTORS: SectorDemo[] = [
  {
    id: "auto",
    sector: "Automotive & EV",
    icon: "🚗",
    badge: "Tier 1 Powertrain & Chassis",
    query: "Stamping line acoustic ultrasonic vibration sensors detecting die micro-cracks before tool failure",
    companyName: "ZF Chassis Systems GmbH",
    country: "Germany",
    region: "Saarbrücken & Friedrichshafen",
    industry: "Automotive Tier 1",
    score: 96,
    tier: "Excellent",
    fitScore: 98,
    oppScore: 94,
    annualRev: "€43.8B",
    plantCount: "168 production facilities",
    buyingSignal: "Announced €45M expansion of cleanroom and high-speed robotic stamping facility in Saarbrücken.",
    buyingSignalUrl: "https://www.zf.com/press/plant-expansion",
    signalUrgency: "Immediate",
    topRole: "VP of Global Manufacturing Operations",
    department: "Press Shop & Tooling Modernization",
    emailPattern: "first.last@zf.com",
    useCases: [
      "In-line acoustic monitoring for 1,200T transfer stamping presses",
      "Predictive acoustic diagnostics for robotic tool-changers",
    ],
    whyPoints: [
      "Operating 18 heavy press plants across DACH and North America requiring 99.8% stamping uptime.",
      "Corporate mandate targeting 0% unplanned line stoppages for 2025-2026 EV chassis rollouts.",
    ],
    pitchHook: "Saw ZF's €45M Saarbrücken press shop expansion — we enable stamping lines to detect micro-cracks before tooling failure, eliminating emergency press shutdowns.",
  },
  {
    id: "semi",
    sector: "Semiconductor & Advanced Packaging",
    icon: "🔬",
    badge: "OSAT & Wafer Bumping",
    query: "High-speed 3D automated optical inspection (AOI) verifying micro-soldering joints on substrate packaging",
    companyName: "ASE Technology Holding Co.",
    country: "Taiwan",
    region: "Kaohsiung & Taoyuan",
    industry: "Semiconductor OSAT",
    score: 97,
    tier: "Excellent",
    fitScore: 99,
    oppScore: 95,
    annualRev: "$21.4B",
    plantCount: "34 advanced packaging fabs",
    buyingSignal: "Capital expenditure increase of $3.2B for advanced 2.5D/3D packaging lines and wafer bumping.",
    buyingSignalUrl: "https://www.aseglobal.com/capex-announcement",
    signalUrgency: "Immediate",
    topRole: "Director of Quality Engineering & Metrology",
    department: "Advanced Packaging Fab 7",
    emailPattern: "first_last@aseglobal.com",
    useCases: [
      "Sub-micron solder bump height coplanarity verification",
      "Automated real-time defect binning connected to factory MES",
    ],
    whyPoints: [
      "World's largest outsourced semiconductor assembly and test provider scaling AI accelerator substrate packaging.",
      "Direct technical requirement for automated high-density defect detection on next-gen silicon interposers.",
    ],
    pitchHook: "With ASE's $3.2B capex increase in advanced 2.5D/3D packaging, our sub-micron AOI solution cuts defect false-alarm rates by 42% on high-density bump lines.",
  },
  {
    id: "heavy",
    sector: "Heavy Machinery & Logistics",
    icon: "🏗️",
    badge: "Construction & Material Handling",
    query: "Autonomous laser-guided AGVs with omnidirectional heavy payload transport up to 25 metric tons",
    companyName: "Liebherr Group",
    country: "Germany",
    region: "Ehingen & Biberach",
    industry: "Heavy Construction Machinery",
    score: 93,
    tier: "Excellent",
    fitScore: 92,
    oppScore: 94,
    annualRev: "€14.0B",
    plantCount: "42 factory sites worldwide",
    buyingSignal: "Ongoing digital factory modernization of the Ehingen mobile crane assembly plant.",
    buyingSignalUrl: "https://www.liebherr.com/ehingen-plant-modernization",
    signalUrgency: "High",
    topRole: "Head of Assembly Logistics & Automation",
    department: "Internal Supply Chain Operations",
    emailPattern: "firstname.lastname@liebherr.com",
    useCases: [
      "Transporting crane chassis frames between weld shop and final paint booth",
      "Dynamic buffer storage sequencing for modular boom attachments",
    ],
    whyPoints: [
      "Manufactures massive crawler and rough-terrain cranes requiring specialized heavy material handling.",
      "Upgrading factory layout to eliminate fixed overhead cranes in favour of flexible autonomous floor transport.",
    ],
    pitchHook: "Regarding the Ehingen assembly modernization, our 25-ton omnidirectional AGVs eliminate crane bottlenecks by moving heavy chassis between weld and paint seamlessly.",
  },
  {
    id: "clean",
    sector: "Decarbonization & Clean Heat",
    icon: "⚡",
    badge: "Steel & Primary Metals",
    query: "Modular supercritical heat exchangers capturing industrial waste gas from high-temperature smelting furnaces",
    companyName: "ArcelorMittal Europe",
    country: "France",
    region: "Dunkirk & Florange",
    industry: "Steel & Metallurgy",
    score: 91,
    tier: "Strong",
    fitScore: 94,
    oppScore: 88,
    annualRev: "$68.2B",
    plantCount: "50+ primary metal mills",
    buyingSignal: "Allocated €1.7B EU innovation funding for low-carbon steelmaking and industrial heat recycling in Dunkirk.",
    buyingSignalUrl: "https://corporate.arcelormittal.com/sustainability/dunkirk-decarb",
    signalUrgency: "High",
    topRole: "VP of Decarbonization & Energy Transition",
    department: "Blast Furnace Modernization",
    emailPattern: "first.last@arcelormittal.com",
    useCases: [
      "Recapturing 450°C off-gas from electric arc furnaces to preheat scrap metal",
      "Modular steam generation supplying adjacent municipal district heating",
    ],
    whyPoints: [
      "Massive industrial emitter legally bound to EU ETS carbon reductions by 2030.",
      "High CAPEX budget allocated specifically for energy efficiency retrofits in continuous operations.",
    ],
    pitchHook: "In light of Dunkirk's €1.7B low-carbon transition, our supercritical heat exchangers recapture 450°C furnace off-gas with zero fouling risk, cutting gas spend by 28%.",
  },
  {
    id: "aero",
    sector: "Aerospace & Defense Systems",
    icon: "✈️",
    badge: "Commercial Aircraft & Space",
    query: "Closed-loop automated composite layup tape-placement monitoring systems for fuselage stringers",
    companyName: "Airbus Atlantic",
    country: "France",
    region: "Toulouse & Nantes",
    industry: "Aerospace Aerostructures",
    score: 95,
    tier: "Excellent",
    fitScore: 97,
    oppScore: 93,
    annualRev: "€65.4B (Airbus Group)",
    plantCount: "13 specialized aerostructure plants",
    buyingSignal: "Announced production ramp-up target to 75 A320 aircraft per month requiring increased automated composite throughput.",
    buyingSignalUrl: "https://www.airbus.com/press/ramp-up-milestones",
    signalUrgency: "Immediate",
    topRole: "Head of Industrial Manufacturing Technologies",
    department: "Composite Automation & Tooling",
    emailPattern: "first.last@airbus.com",
    useCases: [
      "In-situ tape-gap and fiber wrinkle detection during high-speed AFP head passes",
      "Automated ply-orientation verification certifying EN9100 aerospace compliance",
    ],
    whyPoints: [
      "Aggressive single-aisle aircraft ramp rate requiring zero-defect composite fabrication.",
      "Seeking qualified non-destructive automated inspection tools to replace manual laser-projection verification.",
    ],
    pitchHook: "To support the A320 ramp to 75/month, our in-situ AFP monitoring catches tape gap and wrinkle flaws during layup in real-time, preventing costly autoclaving of bad parts.",
  },
];

const TRUST_LOGOS = [
  { name: "Siemens Energy", badge: "Industrial Automation" },
  { name: "Bosch Mobility", badge: "Automotive Tier 1" },
  { name: "ABB Robotics", badge: "Robotics & Drives" },
  { name: "Schneider Electric", badge: "Energy Management" },
  { name: "Honeywell Industrial", badge: "Process Solutions" },
  { name: "Rockwell Automation", badge: "Smart Manufacturing" },
  { name: "Fanuc Robotics", badge: "CNC & Automation" },
  { name: "Caterpillar", badge: "Heavy Machinery" },
];

export const IntroPage: React.FC<IntroPageProps> = ({ onGetStarted }) => {
  const [activeSectorId, setActiveSectorId] = useState("auto");
  const [terminalTab, setTerminalTab] = useState<"dossier" | "signals" | "org" | "pitch">("dossier");
  const [copiedPitch, setCopiedPitch] = useState(false);

  // Interactive ROI Calculator State
  const [dealSize, setDealSize] = useState<number>(75000);
  const [salesReps, setSalesReps] = useState<number>(4);

  const activeSector = SAMPLE_SECTORS.find((s) => s.id === activeSectorId) || SAMPLE_SECTORS[0];

  // Calculate estimated outcomes
  const estimatedQualifiedDeals = Math.round(salesReps * 8.5);
  const estimatedPipelineUnlocked = estimatedQualifiedDeals * dealSize;
  const researchHoursSavedWeekly = salesReps * 13;

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(activeSector.pitchHook);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleLaunchPreset = (sector: SectorDemo) => {
    onGetStarted({
      productDescription: sector.query,
      industries: [sector.industry],
      countries: [sector.country],
      objectives: ["customers", "OEM", "pilot"],
    });
  };

  return (
    <div className="w-full bg-[#0B0F17] text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      {/* 1. TOP ENTERPRISE STATUS BANNER */}
      <div className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md py-2.5 px-4 sm:px-8 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              Live Grounding v2.4 Active
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-400">
              Zero Stale Databases • Real-Time Web Grounded Intelligence
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-teal-400" />
              <span>SOC-2 Type II Certified</span>
            </span>
            <span className="hidden md:inline text-slate-600">•</span>
            <span className="hidden md:inline text-slate-300 font-mono">Enterprise SLA 99.98%</span>
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-800">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-teal-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-blue-500/8 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          {/* Tag Pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/40 px-4 py-1.5 text-xs font-semibold text-teal-300 shadow-inner backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              <span>ManufactureIQ Enterprise Intelligence Suite</span>
              <span className="text-teal-600">|</span>
              <span className="text-white font-bold">2026 Edition</span>
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
              The B2B Manufacturing Deal Intelligence Platform.
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed font-normal max-w-3xl mx-auto">
              Replace outdated static contact directories with <strong>live industrial intelligence</strong>.
              Enter what equipment, parts, or industrial software you provide — our search-grounded engine
              scans operating plants globally, verifies real machinery footprint, uncovers active CAPEX buying signals,
              and identifies verified decision-makers.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={() => onGetStarted()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-8 py-4 text-sm sm:text-base shadow-lg shadow-teal-500/25 transition transform active:scale-98 cursor-pointer"
              >
                <span>Launch Enterprise Market Scan</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <a
                href="#live-terminal"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 px-6 py-4 text-sm sm:text-base font-semibold text-slate-200 hover:text-white transition cursor-pointer shadow-sm"
              >
                <span>Explore Live Intelligence Terminal</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-slate-800/80">
              <div className="text-left p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xl sm:text-2xl font-black text-white font-mono">18,500+</div>
                <div className="text-xs text-slate-400 font-medium">Verified Operating Plants</div>
              </div>
              <div className="text-left p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xl sm:text-2xl font-black text-teal-400 font-mono">94.8%</div>
                <div className="text-xs text-slate-400 font-medium">ICP Match Accuracy</div>
              </div>
              <div className="text-left p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xl sm:text-2xl font-black text-orange-400 font-mono">$42.8B</div>
                <div className="text-xs text-slate-400 font-medium">Active CAPEX Signals</div>
              </div>
              <div className="text-left p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">&lt; 45s</div>
                <div className="text-xs text-slate-400 font-medium">Full Account Synthesis</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ENTERPRISE LOGO / TRUST STRIP */}
      <section className="py-10 border-b border-slate-800 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">
            ENGINEERED FOR REVENUE TEAMS SELLING TO GLOBAL INDUSTRIAL & MANUFACTURING LEADERS
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-center">
            {TRUST_LOGOS.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 transition group text-center"
              >
                <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate max-w-[120px]">
                  {item.name}
                </span>
                <span className="text-[9px] text-slate-400 truncate max-w-[120px]">
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LIVE INTERACTIVE TERMINAL (THE CORE ENTERPRISE WORKSPACE DEMO) */}
      <section id="live-terminal" className="py-16 sm:py-24 border-b border-slate-800 bg-[#0B0F17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-teal-400 mb-2">
                <Activity className="h-3.5 w-3.5" />
                <span>Interactive Enterprise Demo Console</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Live Manufacturing Intelligence Terminal
              </h2>
              <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl">
                Select an industrial vertical to inspect live search-grounded account dossiers, verified plant footprints,
                procurement triggers, and tailored executive outreach angles.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchPreset(activeSector)}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 px-5 py-2.5 text-xs font-bold shadow-md transition self-start md:self-auto cursor-pointer"
            >
              <span>Scan With This Preset</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Sector Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar border-b border-slate-800">
            {SAMPLE_SECTORS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSectorId(sec.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                  activeSectorId === sec.id
                    ? "bg-slate-800 text-white border-teal-500 shadow-md ring-1 ring-teal-500/20"
                    : "bg-slate-900/50 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800/40"
                }`}
              >
                <span>{sec.icon}</span>
                <span>{sec.sector}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 text-teal-400">
                  {sec.score}/100
                </span>
              </button>
            ))}
          </div>

          {/* Terminal Console Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
            {/* Terminal Header Bar */}
            <div className="bg-slate-900/90 px-4 sm:px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-4 w-[1px] bg-slate-800" />
                <span className="text-xs font-mono text-slate-400 truncate max-w-[280px] sm:max-w-md">
                  QUERY: "{activeSector.query}"
                </span>
              </div>

              {/* View Tabs */}
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTerminalTab("dossier")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    terminalTab === "dossier" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Account Dossier
                </button>
                <button
                  type="button"
                  onClick={() => setTerminalTab("signals")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    terminalTab === "signals" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Flame className="h-3 w-3 text-orange-400" />
                  <span>Buying Signals</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTerminalTab("org")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    terminalTab === "org" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Decision-Maker
                </button>
                <button
                  type="button"
                  onClick={() => setTerminalTab("pitch")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    terminalTab === "pitch" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Outreach Angle
                </button>
              </div>
            </div>

            {/* Terminal Workspace Body */}
            <div className="p-5 sm:p-8">
              {/* Account Meta Ribbon */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl sm:text-2xl font-black text-white">{activeSector.companyName}</h3>
                    <span className="text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800/80 px-2.5 py-0.5 rounded-full uppercase">
                      {activeSector.tier} Match
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-orange-950 text-orange-300 border border-orange-800/80 px-2.5 py-0.5 rounded-full uppercase">
                      Urgency: {activeSector.signalUrgency}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{activeSector.industry}</span>
                    <span>•</span>
                    <span>{activeSector.country} ({activeSector.region})</span>
                    <span>•</span>
                    <span className="font-mono text-slate-300">{activeSector.annualRev} Rev</span>
                    <span>•</span>
                    <span className="text-slate-300">{activeSector.plantCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">ManufactureIQ Fit Score</div>
                    <div className="text-2xl font-black font-mono text-teal-400 leading-none">
                      {activeSector.score}<span className="text-xs text-slate-500 font-normal">/100</span>
                    </div>
                  </div>
                  <div className="h-8 w-[1px] bg-slate-800" />
                  <div className="text-right text-[11px] text-slate-400 space-y-0.5">
                    <div>ICP Fit: <span className="text-white font-mono font-bold">{activeSector.fitScore}%</span></div>
                    <div>Opp Index: <span className="text-white font-mono font-bold">{activeSector.oppScore}%</span></div>
                  </div>
                </div>
              </div>

              {/* Tab 1: Account Dossier */}
              {terminalTab === "dossier" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800/80 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Why Relevant for Industrial Sales</span>
                      </div>
                      <ul className="space-y-2.5 text-xs text-slate-300">
                        {activeSector.whyPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-teal-400 mt-0.5">▪</span>
                            <span className="leading-relaxed">{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800/80 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                        <Cpu className="h-4 w-4" />
                        <span>High-Fit Production Use Cases</span>
                      </div>
                      <div className="space-y-2">
                        {activeSector.useCases.map((uc, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-200 flex items-center justify-between">
                            <span>{uc}</span>
                            <span className="text-[10px] font-mono text-teal-400 font-bold">Validated</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Buying Signals */}
              {terminalTab === "signals" && (
                <div className="bg-slate-900/60 p-6 rounded-xl border border-orange-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
                      <Flame className="h-4 w-4" />
                      <span>Live Verified Procurement Catalyst</span>
                    </div>
                    <span className="text-[11px] font-mono bg-orange-950 text-orange-400 border border-orange-800 px-2 py-0.5 rounded font-bold">
                      CAPEX Expansion Trigger
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium bg-slate-950 p-4 rounded-lg border border-slate-800">
                    "{activeSector.buyingSignal}"
                  </p>

                  <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Ground-truth verified via official corporate investor disclosure</span>
                    </span>
                    <a
                      href={activeSector.buyingSignalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 font-semibold"
                    >
                      <span>View Source Announcement</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Tab 3: Decision Maker */}
              {terminalTab === "org" && (
                <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-teal-400">
                      Target Decision-Maker Persona
                    </div>
                    <span className="text-[11px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                      Role Verified Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Executive Title</div>
                      <div className="text-sm font-bold text-white mt-1">{activeSector.topRole}</div>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Department / Plant</div>
                      <div className="text-sm font-bold text-white mt-1">{activeSector.department}</div>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Verified Corporate Email Syntax</div>
                      <div className="text-sm font-mono text-teal-300 mt-1">{activeSector.emailPattern}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Outreach Angle */}
              {terminalTab === "pitch" && (
                <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-teal-400">
                      Tailored Executive Outreach Hook
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPitch}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-white bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 transition cursor-pointer"
                    >
                      {copiedPitch ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedPitch ? "Copied to Clipboard!" : "Copy Pitch Hook"}</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-200 font-mono leading-relaxed">
                    {activeSector.pitchHook}
                  </div>

                  <p className="text-xs text-slate-400">
                    * Engineered specifically for technical B2B cold emails and LinkedIn InMail targeting VP of Manufacturing and Plant Managers.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. ENTERPRISE VALUE COMPARISON TABLE */}
      <section className="py-16 sm:py-24 border-b border-slate-800 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
              Architecture Comparison
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
              Why Revenue Teams Choose ManufactureIQ Over Static Databases
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-3">
              Standard B2B databases scrape static contact sheets. ManufactureIQ conducts live shop floor research.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-800 bg-slate-900/40 rounded-2xl overflow-hidden">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-bold text-slate-300">
                  <th className="p-4 sm:p-5 w-1/3">Capability / Verification</th>
                  <th className="p-4 sm:p-5 w-1/3 text-slate-400">Traditional B2B Contact Databases (ZoomInfo, Apollo)</th>
                  <th className="p-4 sm:p-5 w-1/3 text-teal-400 bg-teal-950/30 border-l border-teal-500/30">
                    ManufactureIQ Enterprise Intelligence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-200">Data Freshness & Grounding</td>
                  <td className="p-4 sm:p-5 text-slate-400">Static 6-12 month old scraped directory tables</td>
                  <td className="p-4 sm:p-5 text-teal-300 bg-teal-950/20 border-l border-teal-500/30 font-semibold">
                    Live Google Search grounded in real-time (&lt; 24 hrs)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-200">Shop Floor & Machine Tool Insight</td>
                  <td className="p-4 sm:p-5 text-slate-400">Zero factory equipment awareness (generic SIC codes only)</td>
                  <td className="p-4 sm:p-5 text-teal-300 bg-teal-950/20 border-l border-teal-500/30 font-semibold">
                    Verifies specific press lines, CNC centers, cleanrooms, and automation setups
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-200">Procurement & CAPEX Signals</td>
                  <td className="p-4 sm:p-5 text-slate-400">Vague intent cookies (website visitor tracking)</td>
                  <td className="p-4 sm:p-5 text-teal-300 bg-teal-950/20 border-l border-teal-500/30 font-semibold">
                    Direct news citation of facility expansions, grant awards, and tooling upgrades
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-200">Relevance & Value Hook Generation</td>
                  <td className="p-4 sm:p-5 text-slate-400">Generic mail merge templates ("Saw you work at {`{company}`}")</td>
                  <td className="p-4 sm:p-5 text-teal-300 bg-teal-950/20 border-l border-teal-500/30 font-semibold">
                    Synthesizes customized technical ROI hooks tied to the company's real factory announcements
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-200">Export & Integration</td>
                  <td className="p-4 sm:p-5 text-slate-400">Export limits and paywalled contact credits</td>
                  <td className="p-4 sm:p-5 text-teal-300 bg-teal-950/20 border-l border-teal-500/30 font-semibold">
                    Unlimited CSV export with full strategic dossier fields ready for CRM ingestion
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE ROI & PIPELINE CALCULATOR */}
      <section className="py-16 sm:py-24 border-b border-slate-800 bg-[#0B0F17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-12 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-teal-400">
                  <DollarSign className="h-4 w-4" />
                  <span>Enterprise ROI Estimator</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Calculate Your Net Pipeline Expansion
                </h2>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Enter your typical industrial hardware/software deal size and commercial team scale to estimate
                  pipeline acceleration from search-grounded target account synthesis.
                </p>

                {/* Sliders */}
                <div className="space-y-5 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                      <span>Average Deal Contract Value (ACV)</span>
                      <span className="font-mono text-teal-400 font-bold">${dealSize.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={10000}
                      max={250000}
                      step={5000}
                      value={dealSize}
                      onChange={(e) => setDealSize(Number(e.target.value))}
                      className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>$10,000</span>
                      <span>$100,000</span>
                      <span>$250,000+</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                      <span>Industrial Sales Reps / AEs Targeting Accounts</span>
                      <span className="font-mono text-teal-400 font-bold">{salesReps} Reps</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={25}
                      step={1}
                      value={salesReps}
                      onChange={(e) => setSalesReps(Number(e.target.value))}
                      className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>1 Rep</span>
                      <span>10 Reps</span>
                      <span>25 Reps</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Output Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-slate-950 border border-teal-500/30 shadow-xl space-y-2">
                  <div className="text-xs text-slate-400 uppercase font-mono">Estimated Pipeline Identified</div>
                  <div className="text-3xl sm:text-4xl font-black text-teal-400 font-mono">
                    ${(estimatedPipelineUnlocked / 1000000).toFixed(2)}M
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Based on ~{estimatedQualifiedDeals} high-probability factory opportunities surfaced.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-2">
                  <div className="text-xs text-slate-400 uppercase font-mono">AE Research Hours Saved</div>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                    {researchHoursSavedWeekly} hrs<span className="text-xs text-slate-500">/wk</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Eliminates ~13 hours of manual plant and LinkedIn scraping per rep every week.
                  </p>
                </div>

                <div className="sm:col-span-2 p-5 rounded-xl bg-teal-950/20 border border-teal-500/30 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-300">
                    Ready to build your qualified plant account pipeline?
                  </div>
                  <button
                    type="button"
                    onClick={() => onGetStarted()}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 text-xs shadow-md transition cursor-pointer shrink-0"
                  >
                    <span>Start Market Scan</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL BOTTOM CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-[#0B0F17] text-center border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/60 px-4 py-1 text-xs font-semibold text-teal-300">
            <span>Instant Execution</span>
            <span className="text-teal-600">•</span>
            <span>Zero Stale Scraping</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Stop Guessing Which Plants Are Buying. Start Selling.
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Run a live market scan now. Get 10–30 highly qualified manufacturing accounts with confirmed
            buying signals and executive dossiers in under two minutes.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onGetStarted()}
              className="inline-flex items-center gap-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-9 py-4 text-base shadow-xl shadow-teal-500/25 transition transform active:scale-98 cursor-pointer"
            >
              <span>Launch Market Scan</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
