import { CompanyScores, RawCompanySignals, ScoreTier } from "../types.ts";

/**
 * Deterministic scoring function as specified in Section 6.
 * Signals are 0-1 normalized floating point values extracted from grounded evidence.
 */
export function computeScore(signals: RawCompanySignals): CompanyScores {
  // Clamp signals to [0, 1] range to avoid floating anomalies
  const safeSignals: RawCompanySignals = {
    productFit: Math.min(Math.max(signals.productFit ?? 0, 0), 1),
    industryFit: Math.min(Math.max(signals.industryFit ?? 0, 0), 1),
    manufacturingFit: Math.min(Math.max(signals.manufacturingFit ?? 0, 0), 1),
    geographicFit: Math.min(Math.max(signals.geographicFit ?? 0, 0), 1),
    companyPotential: Math.min(Math.max(signals.companyPotential ?? 0, 0), 1),
    technologyAdoption: Math.min(Math.max(signals.technologyAdoption ?? 0, 0), 1),
    buyingSignalsStrength: Math.min(Math.max(signals.buyingSignalsStrength ?? 0, 0), 1),
  };

  // Raw fit sum: weights total 0.30 + 0.20 + 0.15 + 0.05 = 0.70
  const rawFitSum =
    safeSignals.productFit * 0.30 +
    safeSignals.industryFit * 0.20 +
    safeSignals.manufacturingFit * 0.15 +
    safeSignals.geographicFit * 0.05;

  // Normalize fitScore to 0-100 scale
  const fitScore = Math.round((rawFitSum / 0.70) * 100);

  // Opportunity sum: weights total 0.40 + 0.30 + 0.30 = 1.00
  const rawOpportunitySum =
    safeSignals.companyPotential * 0.40 +
    safeSignals.technologyAdoption * 0.30 +
    safeSignals.buyingSignalsStrength * 0.30;

  // Normalize opportunityScore to 0-100 scale
  const opportunityScore = Math.round(rawOpportunitySum * 100);

  // Overall score: fitScore * 0.7 + opportunityScore * 0.3
  const overallScore = Math.round(fitScore * 0.70 + opportunityScore * 0.30);

  let scoreTier: ScoreTier = "Poor";
  if (overallScore >= 90) scoreTier = "Excellent";
  else if (overallScore >= 80) scoreTier = "Strong";
  else if (overallScore >= 70) scoreTier = "Potential";
  else if (overallScore >= 60) scoreTier = "Low";

  return {
    fitScore: Math.min(100, Math.max(0, fitScore)),
    opportunityScore: Math.min(100, Math.max(0, opportunityScore)),
    overallScore: Math.min(100, Math.max(0, overallScore)),
    scoreTier,
  };
}

/**
 * Deduplicates companies by normalized name and domain as required by Section 3.
 */
export function deduplicateCompanies<T extends { name: string; domain?: string }>(companies: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const company of companies) {
    const cleanDomain = (company.domain || "")
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "")
      .trim();

    const cleanName = (company.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();

    const key = cleanDomain ? `domain:${cleanDomain}` : `name:${cleanName}`;

    if (!seen.has(key) && (cleanDomain || cleanName)) {
      seen.add(key);
      if (cleanDomain && cleanName) {
        seen.add(`name:${cleanName}`);
      }
      result.push(company);
    }
  }

  return result;
}
