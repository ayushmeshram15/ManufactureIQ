import { Company, SearchQuery } from "../types.ts";

export function exportCompaniesToCSV(companies: Company[], search?: SearchQuery | null) {
  if (!companies || companies.length === 0) return;

  const headers = [
    "Rank",
    "Company Name",
    "Canonical Name",
    "Domain",
    "Country",
    "Industry",
    "Overall Score",
    "Score Tier",
    "Matched Objectives",
    "Fit Score",
    "Opportunity Score",
    "Employee Range",
    "Manufacturing Sites",
    "Why Relevant",
    "Potential Use Cases",
    "Buying Signals",
    "Recommended Contacts",
    "Recommended Approach",
    "Sources",
  ];

  const escapeCSV = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = companies.map((c, index) => {
    const sitesStr = c.manufacturingSites
      ?.map((s) => `${s.city || ""}, ${s.country || ""} (${s.facilityType || "Facility"})`)
      .join("; ") || "Not publicly available";

    const useCasesStr = c.potentialUseCases
      ?.map((u) => `${u.useCase} (${u.relevance}%)`)
      .join("; ") || "";

    const signalsStr = c.buyingSignals
      ?.map((b) => `[${b.confidence}] ${b.signal}: ${b.detail}`)
      .join("; ") || "";

    const contactsStr = c.recommendedContacts
      ?.map((rc) => `${rc.jobTitle} (${rc.department}) - ${rc.reason}`)
      .join("; ") || "";

    const sourcesStr = c.sources?.map((s) => s.url).join("; ") || "";

    return [
      index + 1,
      escapeCSV(c.name),
      escapeCSV(c.canonicalName),
      escapeCSV(c.domain),
      escapeCSV(c.country),
      escapeCSV(c.industry),
      c.overallScore,
      escapeCSV(c.scoreTier),
      escapeCSV((c.matchedObjectives || []).join("; ") || "Direct Customers"),
      c.fitScore,
      c.opportunityScore,
      escapeCSV(c.employeeRange),
      escapeCSV(sitesStr),
      escapeCSV(c.whyRelevant),
      escapeCSV(useCasesStr),
      escapeCSV(signalsStr),
      escapeCSV(contactsStr),
      escapeCSV(c.recommendedApproach),
      escapeCSV(sourcesStr),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `ManufactureIQ_${(search?.productDescription || "Accounts").slice(0, 20).replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
