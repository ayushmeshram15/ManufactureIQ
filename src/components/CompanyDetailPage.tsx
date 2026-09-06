import React from "react";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Flame,
  Globe2,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Target,
  Sparkles,
  Briefcase,
  Layers,
  MessageSquareText,
  FileText,
  Check,
  Copy,
  Info,
} from "lucide-react";
import { Company, ScoreTier, SearchQuery } from "../types.ts";

interface CompanyDetailPageProps {
  company: Company;
  search: SearchQuery;
  onBack: () => void;
}

export const CompanyDetailPage: React.FC<CompanyDetailPageProps> = ({
  company,
  search,
  onBack,
}) => {
  const [copiedApproach, setCopiedApproach] = React.useState(false);

  const copyApproach = () => {
    if (company.recommendedApproach) {
      navigator.clipboard.writeText(company.recommendedApproach);
      setCopiedApproach(true);
      setTimeout(() => setCopiedApproach(false), 2000);
    }
  };

  const getTierBadge = (tier: ScoreTier) => {
    switch (tier) {
      case "Excellent":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800";
      case "Strong":
        return "bg-teal-950/80 text-teal-300 border-teal-800";
      case "Potential":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "Low":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-rose-950/80 text-rose-300 border-rose-800";
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 text-slate-100">
      {/* Navigation Breadcrumb */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-xs cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
          <span>Back to Account Matrix</span>
        </button>
      </div>

      {/* Main Company Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                {company.industry}
              </span>
              <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                {company.country}
              </span>
              {company.employeeRange && (
                <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
                  <Users className="h-3 w-3 mr-1 text-slate-400" />
                  {company.employeeRange}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {company.name}
            </h1>

            {company.canonicalName && company.canonicalName !== company.name && (
              <p className="text-xs font-medium text-slate-400">
                Corporate: {company.canonicalName}
              </p>
            )}

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {company.description}
            </p>

            {company.domain && (
              <div className="pt-2">
                <a
                  href={`https://${company.domain.replace(/^https?:\/\//, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300"
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  <span>{company.domain.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Big Score Card */}
          <div className="flex flex-col items-center md:items-end shrink-0">
            <div
              className={`rounded-2xl border-2 p-5 text-center shadow-xs min-w-[160px] ${getTierBadge(
                company.scoreTier
              )}`}
            >
              <div className="text-4xl font-extrabold tracking-tight">
                {company.overallScore}
                <span className="text-lg font-normal opacity-75">/100</span>
              </div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wider">
                {company.scoreTier} Fit
              </div>
            </div>

            <div className="mt-3 flex gap-4 text-xs">
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Product Fit</div>
                <div className="font-bold text-slate-200">{company.fitScore}%</div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Opportunity</div>
                <div className="font-bold text-slate-200">{company.opportunityScore}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section: Why Relevant & Recommended Approach */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Why Relevant */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Target className="h-4 w-4 text-teal-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Strategic Target Relevance
            </h2>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {company.whyRelevant}
          </p>

          <div className="space-y-2.5 pt-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Operational Synergy Signals:
            </div>
            {company.whyRelevantPoints?.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Recommended Approach Talking Point */}
        <div className="rounded-2xl border border-teal-900/60 bg-teal-950/30 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-teal-900/60 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-teal-400" />
                <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Outreach Angle
                </h3>
              </div>
              <button
                onClick={copyApproach}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
              >
                {copiedApproach ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy pitch</span>
                  </>
                )}
              </button>
            </div>

            <p className="mt-4 text-xs text-teal-100 leading-relaxed italic bg-slate-950 p-3.5 rounded-xl border border-teal-800/40 shadow-xs">
              "{company.recommendedApproach}"
            </p>
          </div>

          <div className="text-[11px] text-teal-300/80 flex items-center gap-1.5 pt-2">
            <Sparkles className="h-3.5 w-3.5 text-teal-400 shrink-0" />
            <span>Ready-to-use executive email or cold intro talking point</span>
          </div>
        </div>
      </div>

      {/* Potential Industrial Use Cases */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Potential Industrial Use Cases
            </h2>
          </div>
          <span className="text-xs text-slate-400">Relevance % based on plant operations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {company.potentialUseCases?.map((useCase, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{useCase.useCase}</span>
                <span className="rounded-full bg-teal-950 border border-teal-800 px-2 py-0.5 text-[11px] font-extrabold text-teal-300">
                  {useCase.relevance}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${useCase.relevance}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Buying Signals */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Verified Buying Signals ({company.buyingSignals?.length || 0})
            </h2>
          </div>
          <span className="text-xs text-slate-400">Extracted from grounded news & plant filings</span>
        </div>

        {company.buyingSignals?.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No specific recent public press releases found; baseline signals inferred from active facilities.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.buyingSignals?.map((signal, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                    <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{signal.signal}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      signal.confidence === "High"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                        : "bg-amber-950 text-amber-300 border-amber-800"
                    }`}
                  >
                    {signal.confidence} Confidence
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {signal.detail}
                </p>

                {signal.sourceUrl && (
                  <div className="pt-1">
                    <a
                      href={signal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-400 hover:text-teal-300"
                    >
                      <span>View evidence source</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Contact & Departments */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-slate-300" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Recommended Target Contacts & Roles
            </h2>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Info className="h-3 w-3" />
            <span>Job titles only — zero fabricated personal emails</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {company.recommendedContacts?.map((contact, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{contact.jobTitle}</span>
                <span className="text-[11px] font-semibold text-slate-400 rounded bg-slate-900 border border-slate-800 px-2 py-0.5">
                  {contact.department}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {contact.reason}
              </p>
              <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Direct email: <strong className="font-medium text-slate-400">Not publicly available</strong></span>
                <span className="text-teal-400 font-medium">Search on LinkedIn ↗</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Known Manufacturing Sites & Facilities */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-300" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Verified Manufacturing Sites & Facilities
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {company.manufacturingSites?.map((site, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs"
            >
              <div className="font-bold text-white">{site.city || "Operational Hub"}</div>
              <div className="text-slate-400">{site.country}</div>
              <div className="mt-1 text-[11px] font-medium text-teal-300 bg-teal-950/80 border border-teal-800/80 inline-block px-1.5 py-0.5 rounded">
                {site.facilityType || "Production Facility"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grounding Sources & Evidence Citations */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Grounded Web Sources & Evidence ({company.sources?.length || 0})
            </h2>
          </div>
          <span className="text-xs text-slate-400">All claims verified via Google Search</span>
        </div>

        <div className="space-y-2">
          {company.sources?.map((source, idx) => (
            <a
              key={idx}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-300 hover:border-slate-700 hover:bg-slate-900 transition group"
            >
              <div className="flex items-center gap-2 truncate max-w-2xl">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
                <span className="font-medium truncate">{source.title || source.url}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-teal-400 shrink-0 font-medium">
                <span className="truncate max-w-[200px] text-slate-500 hidden sm:inline">{source.url}</span>
                <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
