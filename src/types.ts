export type ObjectiveType =
  | "customers"
  | "distributors"
  | "pilot"
  | "OEM"
  | "partners"
  | "contract_manufacturing"
  | "mro"
  | "joint_venture";

export type ScoreTier = "Excellent" | "Strong" | "Potential" | "Low" | "Poor";

export type SignalConfidence = "High" | "Medium" | "Low";

export interface ManufacturingSite {
  country: string;
  city: string;
  facilityType: string;
}

export interface BuyingSignal {
  signal: string;
  detail: string;
  sourceUrl: string;
  confidence: SignalConfidence;
}

export interface PotentialUseCase {
  useCase: string;
  relevance: number; // 0 - 100%
}

export interface RecommendedContact {
  jobTitle: string;
  department: string;
  reason: string;
}

export interface SourceCitation {
  title: string;
  url: string;
  retrievedAt: number;
}

export interface RawCompanySignals {
  productFit: number; // 0 to 1
  industryFit: number; // 0 to 1
  manufacturingFit: number; // 0 to 1
  geographicFit: number; // 0 to 1
  companyPotential: number; // 0 to 1
  technologyAdoption: number; // 0 to 1
  buyingSignalsStrength: number; // 0 to 1
}

export interface CompanyScores {
  fitScore: number; // 0 - 100
  opportunityScore: number; // 0 - 100
  overallScore: number; // 0 - 100
  scoreTier: ScoreTier;
}

export interface Company {
  id: string;
  searchId: string;
  name: string;
  canonicalName: string;
  domain: string;
  country: string;
  industry: string;
  description: string;
  employeeRange: string;
  manufacturingSites: ManufacturingSite[];
  rawSignals: RawCompanySignals;
  fitScore: number;
  opportunityScore: number;
  overallScore: number;
  scoreTier: ScoreTier;
  whyRelevant: string;
  whyRelevantPoints: string[];
  potentialUseCases: PotentialUseCase[];
  buyingSignals: BuyingSignal[];
  recommendedContacts: RecommendedContact[];
  recommendedApproach: string;
  matchedObjectives?: string[];
  sources: SourceCitation[];
  createdAt: number;
}

export type SearchStatus = "researching" | "complete" | "error";

export interface SearchQuery {
  id: string;
  sessionId: string;
  productDescription: string;
  companyWebsite?: string;
  industries: string[];
  countries: string[];
  objective?: ObjectiveType | string;
  objectives?: ObjectiveType[];
  companySizePref: string;
  createdAt: number;
  status: SearchStatus;
  progressStep?: string;
  logs?: string[];
  companiesCount?: number;
  highPriorityCount?: number;
  buyingSignalsCount?: number;
  errorMessage?: string;
}

export interface ResearchStreamEvent {
  type: "log" | "discovered" | "enriched" | "reasoned" | "complete" | "error";
  message?: string;
  data?: any;
  company?: Company;
  progress?: number;
}
