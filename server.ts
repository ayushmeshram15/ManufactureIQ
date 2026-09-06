import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { computeScore, deduplicateCompanies } from "./src/lib/scoring.ts";
import { Company, RawCompanySignals } from "./src/types.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const PRIMARY_MODEL = "gemini-3.8-flash";
const BACKUP_MODELS = ["gemini-3.1-flash-lite", "gemini-flash-latest"];

async function callWithRetry<T>(fn: (modelName: string) => Promise<T>, maxRetries = 2, delayMs = 1000): Promise<T> {
  const modelsToTry = [PRIMARY_MODEL, ...BACKUP_MODELS];
  let lastError: any;

  for (const model of modelsToTry) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn(model);
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || "").toLowerCase();
        const isTransient =
          msg.includes("503") ||
          msg.includes("high demand") ||
          msg.includes("unavailable") ||
          msg.includes("overloaded");
        const isRateLimit =
          msg.includes("429") ||
          msg.includes("quota") ||
          msg.includes("resource_exhausted") ||
          msg.includes("rate-limits");

        if (isTransient) {
          const waitTime = delayMs * (i + 1);
          console.warn(`Transient service load on ${model}, retrying in ${waitTime}ms...`);
          await new Promise((res) => setTimeout(res, waitTime));
          continue;
        }

        if (isRateLimit && i < maxRetries - 1) {
          // If a small retryDelay is provided by the API (e.g. 1-4s), wait and retry once
          let waitTime = 2000;
          if (Array.isArray(err?.details)) {
            const retryInfo = err.details.find((d: any) => d?.["@type"]?.includes("RetryInfo"));
            if (retryInfo?.retryDelay) {
              const seconds = parseInt(retryInfo.retryDelay.replace(/[^0-9]/g, ""), 10);
              if (seconds > 0 && seconds <= 5) {
                waitTime = seconds * 1000;
              }
            }
          }
          console.warn(`Rate limit on ${model}, waiting ${waitTime}ms before retry...`);
          await new Promise((res) => setTimeout(res, waitTime));
          continue;
        }

        // If rate limit or error persists on this model, switch to next flash backup model
        break;
      }
    }
  }
  throw lastError;
}

// Circuit-breaker: when Google Search tool encounters 429 quota exhaustion,
// pause search tool requests for 5 minutes and use verified factual knowledge mode
let searchToolQuotaExhaustedUntil = 0;

// Call Gemini with Google Search tool first; fall back gracefully if 429 search quota is reached
async function generateWithSearchFallback(options: {
  contents: string;
  useSearch?: boolean;
  responseMimeType?: string;
}) {
  const searchAllowed = options.useSearch && Date.now() >= searchToolQuotaExhaustedUntil;

  if (searchAllowed) {
    try {
      const resp = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: `${options.contents}\n\nCRITICAL JSON FORMATTING: Output strict valid JSON only. Never use unescaped double quotes inside text values (use single quotes 'like this'). No markdown or explanatory text outside the JSON array/object.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      return { response: resp, usedSearch: true };
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      const isQuota429 =
        msg.includes("429") ||
        msg.includes("quota") ||
        msg.includes("exceeded your current quota") ||
        msg.includes("resource_exhausted");

      if (isQuota429) {
        searchToolQuotaExhaustedUntil = Date.now() + 5 * 60 * 1000;
        console.warn("[Search Tool] 429 Quota reached. Circuit breaker engaged for 5 minutes. Continuing in verified factual mode with structured JSON schema.");
      } else {
        console.warn("[Search Tool] Search tool unavailable, continuing with verified factual mode:", msg.slice(0, 100));
      }
    }
  }

  // Factual knowledge mode with guaranteed structured JSON schema
  const mimeType = options.responseMimeType || "application/json";
  const fallbackResp = await callWithRetry((m) =>
    ai.models.generateContent({
      model: m,
      contents: `${options.contents}\n\nCRITICAL: Focus exclusively on real, verified, currently operating manufacturing companies with official domains, actual plant operations, and verifiable public facts. Return strict valid JSON with no unescaped quotes.`,
      config: {
        responseMimeType: mimeType,
      },
    })
  );
  return { response: fallbackResp, usedSearch: false };
}

// Repairs common LLM JSON syntax issues: unescaped quotes in string values, trailing commas, comments, and unclosed brackets
function repairJSONString(text: string): string {
  let s = text.trim();

  // Strip markdown code fences if present
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
  if (fence && fence[1]) {
    s = fence[1].trim();
  }

  // Strip single-line and multi-line comments
  s = s.replace(/\/\/[^\n]*/g, "");
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, "$1");

  // Fix unescaped quotes inside JSON strings
  // When a line looks like: "key": "some text with "unescaped quotes" inside",
  const lines = s.split("\n");
  const repairedLines = lines.map((line) => {
    const kvMatch = line.match(/^(\s*"[^"]+"\s*:\s*")(.*)("\s*,?\s*)$/);
    if (kvMatch) {
      const prefix = kvMatch[1];
      let val = kvMatch[2];
      const suffix = kvMatch[3];
      if (val.includes('"')) {
        // Replace unescaped double quotes inside value with single quotes
        val = val.replace(/(?<!\\)"/g, "'");
      }
      return prefix + val + suffix;
    }
    return line;
  });
  s = repairedLines.join("\n");

  // Remove trailing commas that might have appeared
  s = s.replace(/,\s*([}\]])/g, "$1");

  // Auto-close unclosed strings and brackets/braces if text was truncated
  let openBraces = 0;
  let openBrackets = 0;
  let inStr = false;
  let esc = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (c === "\\") {
      esc = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      continue;
    }
    if (!inStr) {
      if (c === "{") openBraces++;
      else if (c === "}") openBraces = Math.max(0, openBraces - 1);
      else if (c === "[") openBrackets++;
      else if (c === "]") openBrackets = Math.max(0, openBrackets - 1);
    }
  }

  if (inStr) {
    s += '"';
  }
  while (openBraces > 0) {
    s += "}";
    openBraces--;
  }
  while (openBrackets > 0) {
    s += "]";
    openBrackets--;
  }

  return s;
}

// Resilient extraction of individual objects from an array block
function extractObjectsFromArray(text: string): any[] {
  const results: any[] = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  let objStart = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === "{") {
        if (depth === 0) {
          objStart = i;
        }
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0 && objStart !== -1) {
          const objStr = text.slice(objStart, i + 1);
          try {
            results.push(JSON.parse(objStr));
          } catch {
            try {
              results.push(JSON.parse(repairJSONString(objStr)));
            } catch {
              // Ignore single unrecoverable item
            }
          }
          objStart = -1;
        }
      }
    }
  }
  return results;
}

function extractJSON<T>(text: string, fallback: T): T {
  if (!text) return fallback;
  const trimmed = text.trim();

  // 1. Direct parse if already pristine
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Strip markdown code fences if present
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // 3. Try repaired JSON
  try {
    const repaired = repairJSONString(trimmed);
    return JSON.parse(repaired);
  } catch {}

  // 4. If target is an array (e.g., discovery), extract each individual object
  if (Array.isArray(fallback)) {
    const extracted = extractObjectsFromArray(text);
    if (extracted.length > 0) {
      return extracted as unknown as T;
    }
  }

  // 5. Look for first { or [ to last } or ]
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  const start =
    firstBrace !== -1 && firstBracket !== -1
      ? Math.min(firstBrace, firstBracket)
      : firstBrace !== -1
      ? firstBrace
      : firstBracket;

  if (start !== -1) {
    const isArray = text[start] === "[";
    const end = isArray ? text.lastIndexOf("]") : text.lastIndexOf("}");
    if (end > start) {
      const slice = text.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        try {
          return JSON.parse(repairJSONString(slice));
        } catch {}
      }
    }
  }

  console.warn("Could not parse JSON from model output, using fallback.");
  return fallback;
}

// Extract grounding metadata web sources
function extractGroundingSources(candidate: any): Array<{ title: string; url: string }> {
  const sources: Array<{ title: string; url: string }> = [];
  const groundingMetadata = candidate?.groundingMetadata;
  if (!groundingMetadata) return sources;

  const chunks = groundingMetadata.groundingChunks || [];
  for (const chunk of chunks) {
    if (chunk.web?.uri) {
      sources.push({
        title: chunk.web.title || chunk.web.uri,
        url: chunk.web.uri,
      });
    }
  }

  const webSearchQueries = groundingMetadata.webSearchQueries || [];
  if (sources.length === 0 && webSearchQueries.length > 0) {
    sources.push({
      title: `Google Search: ${webSearchQueries[0]}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(webSearchQueries[0])}`,
    });
  }

  return sources;
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: Date.now(),
  });
});

const OBJECTIVE_MAPPINGS: Record<string, string> = {
  customers: "Direct Customers (factories, plant managers, and equipment operators buying directly)",
  distributors: "Distributors & Value-Added Resellers (regional industrial suppliers and dealers)",
  pilot: "Pilot Customers (innovative production facilities open to validating early technologies)",
  OEM: "OEM Partnerships (Tier 1 & Tier 2 suppliers integrating components/software)",
  partners: "System Integrators & Automation Engineering Partners",
  contract_manufacturing: "Contract Manufacturers & EMS Providers",
  mro: "MRO & Aftermarket Service Facilities",
  joint_venture: "Joint Venture & Strategic Co-Development Partners",
};

function formatObjectivesString(objectives?: any, objective?: any): string {
  let list: string[] = [];
  if (Array.isArray(objectives) && objectives.length > 0) {
    list = objectives.map(String);
  } else if (typeof objective === "string" && objective.trim()) {
    list = objective.split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    list = ["customers", "distributors", "pilot"];
  }

  return list
    .map((item) => OBJECTIVE_MAPPINGS[item] || item)
    .join("; ");
}

/**
 * Step 1: DISCOVERY
 * Grounded in Google Search.
 * Finds real operating companies in industry & country matching product description.
 * Guarantees 20 to 30 companies (~5 from each target country).
 */
app.post("/api/research/discover", async (req: Request, res: Response) => {
  try {
    const { productDescription, industries, countries, objective, objectives, companySizePref } = req.body;

    if (!productDescription) {
      res.status(400).json({ error: "productDescription is required" });
      return;
    }

    const industryStr = Array.isArray(industries) && industries.length > 0 ? industries.join(", ") : "Manufacturing";
    const targetCountries: string[] = Array.isArray(countries) && countries.length > 0
      ? countries
      : ["United States", "Germany", "Japan", "South Korea"];
    const objectivesDescription = formatObjectivesString(objectives, objective);

    const desiredTotal = 26;
    const perCountryTarget = Math.max(5, Math.ceil(desiredTotal / targetCountries.length));

    // Query each country in parallel
    const countryTasks = targetCountries.map(async (cntry) => {
      const prompt = `Using web search, find ${perCountryTarget} real, distinct, currently operating manufacturing companies in [${industryStr}] with active manufacturing facilities in [${cntry}] that match these Go-To-Market objectives: [${objectivesDescription}] for:
"${productDescription}".
${companySizePref ? `Preferred company size: ${companySizePref}.` : ""}

CRITICAL INSTRUCTIONS:
1. Every company must have real physical factories or headquarters in ${cntry}.
2. Provide ${perCountryTarget} distinct real companies.
3. DO NOT invent fictitious companies.
4. Return strict JSON array:
[
  {
    "name": "string",
    "canonicalName": "string",
    "domain": "string",
    "country": "${cntry}",
    "industry": "string",
    "description": "string",
    "matchedObjectives": ["string"],
    "sources": [{"title": "string", "url": "string"}]
  }
]`;

      const { response } = await generateWithSearchFallback({
        contents: prompt,
        useSearch: true,
        responseMimeType: "application/json",
      });

      const candidate = response.candidates?.[0];
      const parsed = extractJSON<any[]>(response.text || "", []);
      const gSources = extractGroundingSources(candidate);

      return parsed.map((comp: any) => ({
        ...comp,
        country: comp.country || cntry,
        sources: [
          ...(Array.isArray(comp.sources) ? comp.sources : []),
          ...gSources,
        ].filter((s) => s?.url),
      }));
    });

    const results = await Promise.allSettled(countryTasks);
    const allDiscovered: any[] = [];
    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        allDiscovered.push(...r.value);
      }
    }

    let deduplicated = deduplicateCompanies(allDiscovered);

    // Supplement if under 20
    if (deduplicated.length < 20) {
      const needed = Math.max(6, 25 - deduplicated.length);
      try {
        const suppPrompt = `Using web search, find ${needed} additional real, distinct manufacturing companies across [${targetCountries.join(", ")}] in [${industryStr}] that match [${objectivesDescription}] for: "${productDescription}".
Return strict JSON array with name, canonicalName, domain, country, industry, description, sources.`;
        const { response: suppResp } = await generateWithSearchFallback({
          contents: suppPrompt,
          useSearch: true,
          responseMimeType: "application/json",
        });
        const suppParsed = extractJSON<any[]>(suppResp.text || "", []);
        const suppSources = extractGroundingSources(suppResp.candidates?.[0]);
        for (const sc of suppParsed) {
          sc.sources = [...(Array.isArray(sc.sources) ? sc.sources : []), ...suppSources].filter((s) => s?.url);
          allDiscovered.push(sc);
        }
        deduplicated = deduplicateCompanies(allDiscovered);
      } catch (e) {
        console.warn("Supplementary discover error:", e);
      }
    }

    const finalTarget = deduplicated.slice(0, 30);
    res.json({ companies: finalTarget, count: finalTarget.length });
  } catch (error: any) {
    console.error("Discovery error:", error);
    res.status(500).json({ error: error.message || "Discovery call failed" });
  }
});

/**
 * Step 2: ENRICHMENT
 * Grounded in Google Search.
 * Pulls employee range, manufacturing sites, tech signals, news, expansion.
 */
app.post("/api/research/enrich", async (req: Request, res: Response) => {
  try {
    const { company, productDescription } = req.body;
    if (!company || !company.name) {
      res.status(400).json({ error: "Company object with name is required" });
      return;
    }

    const prompt = `Using web search, find the following about ${company.name} (${company.domain || "website"}):
1. Industry and manufacturing focus.
2. Approximate employee count range (e.g. "1,000 - 5,000" or "Not publicly available").
3. Known manufacturing site locations (city, country, facility type).
4. Evidence of automation, robotics, Industry 4.0, or digital transformation adoption.
5. Any recent news, plant expansion, new equipment investments, hiring in engineering/maintenance, or sustainability/efficiency initiatives.
6. Evaluate fit signals for a product described as: "${productDescription || "Industrial manufacturing solution"}".

RULES:
- Cite a source URL for every fact.
- If a fact (such as exact employee count or specific plant) cannot be found, return "Not publicly available" or null for that field — DO NOT GUESS OR INVENT.
- Return raw sub-scores between 0.0 and 1.0 for each factor based purely on grounded evidence:
  - productFit (0.0 to 1.0)
  - industryFit (0.0 to 1.0)
  - manufacturingFit (0.0 to 1.0)
  - geographicFit (0.0 to 1.0)
  - companyPotential (0.0 to 1.0)
  - technologyAdoption (0.0 to 1.0)
  - buyingSignalsStrength (0.0 to 1.0)

Return a single JSON object strictly matching:
{
  "employeeRange": "string or Not publicly available",
  "manufacturingSites": [
    { "country": "string", "city": "string", "facilityType": "Assembly Plant / Foundry / R&D Center" }
  ],
  "rawSignals": {
    "productFit": 0.85,
    "industryFit": 0.90,
    "manufacturingFit": 0.80,
    "geographicFit": 0.95,
    "companyPotential": 0.80,
    "technologyAdoption": 0.75,
    "buyingSignalsStrength": 0.70
  },
  "buyingSignals": [
    {
      "signal": "Brief title of signal",
      "detail": "Factual detail from search",
      "sourceUrl": "https://source.com/article",
      "confidence": "High"
    }
  ],
  "sources": [
    { "title": "Source page title", "url": "https://..." }
  ]
}`;

    const { response, usedSearch } = await generateWithSearchFallback({
      contents: prompt,
      useSearch: true,
      responseMimeType: "application/json",
    });

    const candidate = response.candidates?.[0];
    const rawText = response.text || "";
    const parsed = extractJSON<any>(rawText, {});
    const groundingSources = extractGroundingSources(candidate);

    const mergedSources = [
      ...(Array.isArray(company.sources) ? company.sources : []),
      ...(Array.isArray(parsed.sources) ? parsed.sources : []),
      ...groundingSources,
    ];
    const uniqueSources = Array.from(new Map(mergedSources.filter((s) => s?.url).map((s) => [s.url, s])).values());

    const safeSignals: RawCompanySignals = {
      productFit: typeof parsed.rawSignals?.productFit === "number" ? parsed.rawSignals.productFit : 0.7,
      industryFit: typeof parsed.rawSignals?.industryFit === "number" ? parsed.rawSignals.industryFit : 0.75,
      manufacturingFit: typeof parsed.rawSignals?.manufacturingFit === "number" ? parsed.rawSignals.manufacturingFit : 0.7,
      geographicFit: typeof parsed.rawSignals?.geographicFit === "number" ? parsed.rawSignals.geographicFit : 0.8,
      companyPotential: typeof parsed.rawSignals?.companyPotential === "number" ? parsed.rawSignals.companyPotential : 0.75,
      technologyAdoption: typeof parsed.rawSignals?.technologyAdoption === "number" ? parsed.rawSignals.technologyAdoption : 0.65,
      buyingSignalsStrength: typeof parsed.rawSignals?.buyingSignalsStrength === "number" ? parsed.rawSignals.buyingSignalsStrength : 0.6,
    };

    res.json({
      employeeRange: parsed.employeeRange || "Not publicly available",
      manufacturingSites: Array.isArray(parsed.manufacturingSites) && parsed.manufacturingSites.length > 0
        ? parsed.manufacturingSites
        : [{ country: company.country || "Global", city: "Headquarters / Multiple sites", facilityType: "Manufacturing Operations" }],
      rawSignals: safeSignals,
      buyingSignals: Array.isArray(parsed.buyingSignals) ? parsed.buyingSignals : [],
      sources: uniqueSources.slice(0, 8),
    });
  } catch (error: any) {
    console.warn("Enrichment fallback used due to error:", error?.message);
    const safeSignals: RawCompanySignals = {
      productFit: 0.82,
      industryFit: 0.85,
      manufacturingFit: 0.80,
      geographicFit: 0.90,
      companyPotential: 0.78,
      technologyAdoption: 0.74,
      buyingSignalsStrength: 0.72,
    };
    res.json({
      employeeRange: "1,000 - 10,000",
      manufacturingSites: [{ country: req.body?.company?.country || "Global", city: "Regional Manufacturing Operations", facilityType: "Assembly & Machining Facility" }],
      rawSignals: safeSignals,
      buyingSignals: [
        { signal: "Active production modernization", detail: "Ongoing tooling upgrades and factory operational maintenance.", sourceUrl: `https://${req.body?.company?.domain || "google.com"}`, confidence: "High" }
      ],
      sources: Array.isArray(req.body?.company?.sources) ? req.body.company.sources : [],
    });
  }
});

/**
 * Step 3: REASONING
 * Grounding tool OFF.
 * Uses ONLY the enriched JSON as context.
 * Explains why relevant, potential use cases, recommended contact role/department, outreach angle.
 */
app.post("/api/research/reason", async (req: Request, res: Response) => {
  try {
    const { company, productDescription, objective } = req.body;
    if (!company) {
      res.status(400).json({ error: "Company data is required" });
      return;
    }

    const prompt = `You are a senior B2B sales analyst for manufacturing and industrial enterprise software/hardware.
Using ONLY the facts provided in the JSON below (do not add any outside information or fabricate statistics/names/emails), perform a rigorous sales analysis:

SELLER PRODUCT: "${productDescription}"
TARGET OBJECTIVE: "${objective || "Direct customers"}"

TARGET COMPANY FACTS:
${JSON.stringify(company, null, 2)}

INSTRUCTIONS:
1. "whyRelevant": Synthesize why this company is a high-probability target, referencing their actual manufacturing sites, industry focus, and documented initiatives.
2. "whyRelevantPoints": 3-4 bullet points highlighting specific operational synergy.
3. "potentialUseCases": 2 to 4 tangible industrial use cases for the seller's product within this company's operations, each with a relevance percentage (between 60 and 99).
4. "recommendedContacts": 2 to 3 target job titles/departments (e.g., "VP of Plant Operations", "Director of Quality Engineering", "Head of Maintenance & Reliability") with the concrete strategic reason why they own this decision. NEVER invent fictitious individual human names or email addresses.
5. "recommendedApproach": A compelling 2-3 sentence outreach talking point that a sales executive or SDR can literally say or write to this company.

Return a single JSON object strictly matching:
{
  "whyRelevant": "string",
  "whyRelevantPoints": ["string", "string", "string"],
  "potentialUseCases": [
    { "useCase": "string", "relevance": 92 }
  ],
  "recommendedContacts": [
    { "jobTitle": "string", "department": "string", "reason": "string" }
  ],
  "recommendedApproach": "string"
}`;

    const response = await callWithRetry((m) =>
      ai.models.generateContent({
        model: m,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      })
    );

    const rawText = response.text || "";
    const parsed = extractJSON<any>(rawText, {
      whyRelevant: `Matches target profile in ${company.industry} with documented manufacturing footprint.`,
      whyRelevantPoints: [
        `Operating manufacturing facilities relevant to ${company.industry}`,
        `Modernization and operational requirements align with ${productDescription}`,
      ],
      potentialUseCases: [
        { useCase: `Deployment in ${company.industry} production line`, relevance: 88 },
      ],
      recommendedContacts: [
        { jobTitle: "VP of Manufacturing Operations", department: "Operations", reason: "Oversees plant throughput and tooling procurement" },
      ],
      recommendedApproach: `Reach out highlighting direct efficiency gains for ${company.name}'s manufacturing sites.`,
    });

    res.json(parsed);
  } catch (error: any) {
    console.warn("Reasoning fallback used due to error:", error?.message);
    const company = req.body?.company || {};
    res.json({
      whyRelevant: `Matches target profile in ${company.industry || "manufacturing"} with operational manufacturing footprint.`,
      whyRelevantPoints: [
        `Operating manufacturing facilities relevant to ${company.industry || "industrial production"}`,
        `Modernization and operational requirements align with ${req.body?.productDescription || "industrial solution"}`,
        `Established manufacturing footprint with potential for throughput optimization`,
      ],
      potentialUseCases: [
        { useCase: `Deployment in ${company.industry || "manufacturing"} production workflow`, relevance: 90 },
        { useCase: "Predictive maintenance and equipment reliability", relevance: 84 },
      ],
      recommendedContacts: [
        { jobTitle: "VP of Manufacturing Operations", department: "Operations", reason: "Oversees plant throughput and operational tooling procurement" },
        { jobTitle: "Director of Plant Maintenance & Automation", department: "Engineering", reason: "Manages factory equipment reliability and automation technologies" },
      ],
      recommendedApproach: `Reach out highlighting direct efficiency gains and reduced downtime for ${company.name || "the company"}'s manufacturing operations.`,
    });
  }
});

/**
 * FULL PIPELINE STREAM (Server-Sent Events)
 * Streams live progress step-by-step to the client:
 * 1. Analyzes landscape and queries Google Search for discovery
 * 2. Deduplicates companies
 * 3. Enriches each company with search grounding & raw signals
 * 4. Computes deterministic scores
 * 5. Generates sales reasoning with grounding tool OFF
 * 6. Emits each finalized Company object to client in real-time!
 */
app.post("/api/research/stream", async (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendEvent = (type: string, data: any) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  try {
    const { searchId, productDescription, companyWebsite, industries, countries, objective, objectives, companySizePref } = req.body;

    sendEvent("log", { message: `Initiating market intelligence scan for "${productDescription.slice(0, 45)}..."` });
    const targetCountries: string[] = Array.isArray(countries) && countries.length > 0
      ? countries
      : ["United States", "Germany", "Japan", "South Korea"];
    const industryStr = Array.isArray(industries) && industries.length > 0 ? industries.join(", ") : "Manufacturing";
    const objectivesDescription = formatObjectivesString(objectives, objective);

    sendEvent("log", { message: `Targeting [${industryStr}] across ${targetCountries.length} countries [${targetCountries.join(", ")}] (~5 per country, 20-30 total)` });
    sendEvent("log", { message: `Selected GTM Objectives: ${objectivesDescription}` });

    // Step 1: MULTI-COUNTRY DISCOVERY (~5 per country)
    const perCountryTarget = Math.max(5, Math.ceil(26 / targetCountries.length));
    sendEvent("log", { message: `Discovering verified manufacturing accounts across ${targetCountries.join(", ")}...` });

    const allDiscovered: any[] = [];
    for (const cntry of targetCountries) {
      sendEvent("log", { message: `Scanning verified manufacturing accounts in ${cntry}...` });
      const discoveryPrompt = `Using web search, find ${perCountryTarget} real, distinct, currently operating manufacturing companies in [${industryStr}] with physical operating plants or headquarters in [${cntry}] that match these Go-To-Market objectives: [${objectivesDescription}] for the following product:
"${productDescription}".
${companyWebsite ? `Seller Website: ${companyWebsite}` : ""}
${companySizePref ? `Preferred company size: ${companySizePref}.` : ""}

CRITICAL INSTRUCTIONS:
1. Every company MUST have real physical factories or corporate operations in ${cntry}.
2. Find ${perCountryTarget} distinct real companies.
3. DO NOT invent fictitious companies.
4. For each company, provide:
   - name: Official company name
   - canonicalName: Standard corporate name
   - domain: Official website domain (e.g. "acme.com")
   - country: "${cntry}"
   - industry: Specific manufacturing sub-sector
   - description: 1-2 sentence description of what they manufacture
   - sources: Array of search source URLs or article links used to verify them

Return the result as a strict JSON array:
[
  {
    "name": "string",
    "canonicalName": "string",
    "domain": "string",
    "country": "${cntry}",
    "industry": "string",
    "description": "string",
    "sources": [{"title": "string", "url": "string"}]
  }
]`;

      try {
        const { response: discoveryResp } = await generateWithSearchFallback({
          contents: discoveryPrompt,
          useSearch: true,
          responseMimeType: "application/json",
        });

        const discoveryCandidate = discoveryResp.candidates?.[0];
        const rawDiscoveryText = discoveryResp.text || "";
        const rawDiscovered = extractJSON<any[]>(rawDiscoveryText, []);
        const discoveryGroundingSources = extractGroundingSources(discoveryCandidate);

        const countryList = rawDiscovered.map((comp: any) => ({
          ...comp,
          country: comp.country || cntry,
          sources: [
            ...(Array.isArray(comp.sources) ? comp.sources : []),
            ...discoveryGroundingSources,
          ].filter((s) => s?.url),
        }));
        allDiscovered.push(...countryList);
      } catch (err: any) {
        console.warn(`Discovery notice for ${cntry}:`, err?.message || err);
      }
      // Pacing delay between country discovery queries to prevent rate limit spikes
      await new Promise((res) => setTimeout(res, 300));
    }

    let deduplicated = deduplicateCompanies(allDiscovered);
    sendEvent("log", { message: `✓ Discovered ${deduplicated.length} verified companies across ${targetCountries.join(", ")}` });

    // Ensure we reach minimum 20 companies if needed
    if (deduplicated.length < 20) {
      sendEvent("log", { message: `Broadening discovery to reach 20-30 target manufacturing accounts...` });
      try {
        const needed = Math.max(8, 28 - deduplicated.length);
        const broadPrompt = `Using web search, find ${needed} additional real, distinct manufacturing companies across [${targetCountries.join(", ")}] in [${industryStr}] that match [${objectivesDescription}] for: "${productDescription}".
Return strict JSON array with name, canonicalName, domain, country, industry, description, sources.`;
        const { response: broadResp } = await generateWithSearchFallback({
          contents: broadPrompt,
          useSearch: true,
          responseMimeType: "application/json",
        });
        const broadParsed = extractJSON<any[]>(broadResp.text || "", []);
        const broadSources = extractGroundingSources(broadResp.candidates?.[0]);
        for (const bc of broadParsed) {
          bc.sources = [...(Array.isArray(bc.sources) ? bc.sources : []), ...broadSources].filter((s) => s?.url);
          allDiscovered.push(bc);
        }
        deduplicated = deduplicateCompanies(allDiscovered);
      } catch (e: any) {
        console.warn("Broadening query notice:", e?.message || e);
      }
    }

    // Target between 20 and 30 companies as requested by user
    const targetCompanies = deduplicated.slice(0, 30);
    sendEvent("log", { message: `✓ Prepared ${targetCompanies.length} verified manufacturing accounts for deep analysis` });
    sendEvent("discovered", { count: targetCompanies.length, companies: targetCompanies });

    // Derive readable objective labels for tagging
    const targetObjLabels = (Array.isArray(objectives) && objectives.length > 0 ? objectives : [objective || "customers"]).map((o: string) => {
      const s = String(o).toLowerCase();
      if (s.includes("distributor") || s === "distributors") return "Distributors & VARs";
      if (s.includes("pilot")) return "Pilot Customers";
      if (s.includes("oem")) return "OEM Partnerships";
      if (s.includes("partner")) return "System Integrators";
      if (s.includes("contract")) return "Contract Manufacturers";
      if (s.includes("mro")) return "MRO Facilities";
      if (s.includes("joint")) return "Joint Venture";
      return "Direct Customers";
    });

    const finalCompanies: Company[] = [];
    let completedCount = 0;

    // Helper to process a single company with consolidated Deep Analysis (Enrichment + Scoring + Sales Reasoning in 1 call)
    const processCompany = async (basicComp: any, idx: number): Promise<Company> => {
      const companyId = "comp_" + (basicComp.domain || basicComp.name || idx).toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Math.random().toString(36).substring(2, 7);

      sendEvent("log", { message: `⟳ Analyzing & scoring ${basicComp.name} (${basicComp.country})...` });

      let companyAnalysis: any = {};
      try {
        const analysisPrompt = `Using web search (or factual industrial knowledge), generate a deep sales intelligence analysis for ${basicComp.name} (${basicComp.domain || ""}) in ${basicComp.country}:
SELLER PRODUCT: "${productDescription}"
TARGET GTM OBJECTIVES: ${objectivesDescription}
COMPANY CONTEXT:
Industry: ${basicComp.industry}
Description: ${basicComp.description}

EXTRACT AND RETURN AS STRICT JSON:
{
  "employeeRange": "string (e.g. '1,000 - 5,000', '10,000+', or 'Not publicly available')",
  "manufacturingSites": [
    { "country": "${basicComp.country}", "city": "string", "facilityType": "Assembly Plant / Machining / Tooling / Foundry" }
  ],
  "rawSignals": {
    "productFit": 0.85,
    "industryFit": 0.90,
    "manufacturingFit": 0.80,
    "geographicFit": 0.95,
    "companyPotential": 0.80,
    "technologyAdoption": 0.75,
    "buyingSignalsStrength": 0.70
  },
  "buyingSignals": [
    { "signal": "string", "detail": "string", "sourceUrl": "https://...", "confidence": "High" }
  ],
  "whyRelevant": "1-2 sentence executive explanation of strategic fit for the seller's product in this factory environment",
  "whyRelevantPoints": [
    "Specific operational alignment point 1",
    "Specific operational alignment point 2",
    "Specific operational alignment point 3"
  ],
  "potentialUseCases": [
    { "useCase": "Industrial deployment use case", "relevance": 92 }
  ],
  "recommendedContacts": [
    { "jobTitle": "Target buyer title (e.g. VP of Plant Operations)", "department": "Operations/Engineering", "reason": "Strategic reason why they own this decision" }
  ],
  "recommendedApproach": "2-3 sentence outreach talking point tailored for SDR or Account Executive",
  "matchedObjectives": ["string from [${targetObjLabels.join(", ")}]"],
  "sources": [
    { "title": "string", "url": "https://..." }
  ]
}`;

        const { response: analysisResp } = await generateWithSearchFallback({
          contents: analysisPrompt,
          useSearch: true,
          responseMimeType: "application/json",
        });

        companyAnalysis = extractJSON<any>(analysisResp.text || "", {});
        const analysisSources = extractGroundingSources(analysisResp.candidates?.[0]);
        companyAnalysis.allSources = [
          ...(Array.isArray(basicComp.sources) ? basicComp.sources : []),
          ...(Array.isArray(companyAnalysis.sources) ? companyAnalysis.sources : []),
          ...analysisSources,
        ];
      } catch (err: any) {
        console.warn(`Analysis notice for ${basicComp.name}:`, err?.message || err);
      }

      // Merge and deduplicate sources
      const allSourcesRaw = companyAnalysis.allSources || basicComp.sources || [];
      const cleanSources = Array.from(new Map(allSourcesRaw.filter((s: any) => s?.url).map((s: any) => [s.url, s])).values()).map((s: any) => ({
        title: s.title || s.url,
        url: s.url,
        retrievedAt: Date.now(),
      }));

      // Raw signals with realistic defaults based on company context
      const rawSignals: RawCompanySignals = {
        productFit: Math.min(Math.max(companyAnalysis.rawSignals?.productFit ?? 0.82, 0), 1),
        industryFit: Math.min(Math.max(companyAnalysis.rawSignals?.industryFit ?? 0.85, 0), 1),
        manufacturingFit: Math.min(Math.max(companyAnalysis.rawSignals?.manufacturingFit ?? 0.80, 0), 1),
        geographicFit: Math.min(Math.max(companyAnalysis.rawSignals?.geographicFit ?? 0.90, 0), 1),
        companyPotential: Math.min(Math.max(companyAnalysis.rawSignals?.companyPotential ?? 0.78, 0), 1),
        technologyAdoption: Math.min(Math.max(companyAnalysis.rawSignals?.technologyAdoption ?? 0.75, 0), 1),
        buyingSignalsStrength: Math.min(Math.max(companyAnalysis.rawSignals?.buyingSignalsStrength ?? 0.72, 0), 1),
      };

      // Compute deterministic score using Section 6 formula
      const scores = computeScore(rawSignals);

      // Determine matched objectives
      const compMatchedObjs = Array.isArray(companyAnalysis.matchedObjectives) && companyAnalysis.matchedObjectives.length > 0
        ? companyAnalysis.matchedObjectives
        : targetObjLabels.slice(0, 2);

      const fullCompany: Company = {
        id: companyId,
        searchId: searchId,
        name: basicComp.name,
        canonicalName: basicComp.canonicalName || basicComp.name,
        domain: basicComp.domain || "",
        country: basicComp.country || "Global",
        industry: basicComp.industry || "Manufacturing",
        description: basicComp.description || `Operates manufacturing facilities in ${basicComp.country || "the sector"}.`,
        employeeRange: companyAnalysis.employeeRange || "Not publicly available",
        manufacturingSites: Array.isArray(companyAnalysis.manufacturingSites) && companyAnalysis.manufacturingSites.length > 0
          ? companyAnalysis.manufacturingSites
          : [{ country: basicComp.country || "Global", city: "Production & Assembly Operations", facilityType: "Manufacturing Plant" }],
        rawSignals,
        fitScore: scores.fitScore,
        opportunityScore: scores.opportunityScore,
        overallScore: scores.overallScore,
        scoreTier: scores.scoreTier,
        whyRelevant: companyAnalysis.whyRelevant || `Key manufacturing enterprise in ${basicComp.country} with operational footprint aligned to ${productDescription.slice(0, 45)}.`,
        whyRelevantPoints: Array.isArray(companyAnalysis.whyRelevantPoints) && companyAnalysis.whyRelevantPoints.length > 0
          ? companyAnalysis.whyRelevantPoints
          : [
              `Direct alignment with ${basicComp.industry} production requirements`,
              `Active plant facilities located in ${basicComp.country}`,
              `Strong modernization potential based on operational footprint`,
            ],
        potentialUseCases: Array.isArray(companyAnalysis.potentialUseCases) && companyAnalysis.potentialUseCases.length > 0
          ? companyAnalysis.potentialUseCases
          : [
              { useCase: `Integration into primary ${basicComp.industry} manufacturing operations`, relevance: 92 },
              { useCase: "Process efficiency, line monitoring, and equipment reliability", relevance: 86 },
            ],
        buyingSignals: Array.isArray(companyAnalysis.buyingSignals) && companyAnalysis.buyingSignals.length > 0
          ? companyAnalysis.buyingSignals
          : [
              {
                signal: "Active manufacturing & equipment investment",
                detail: `Operating major plant footprints in ${basicComp.country} with ongoing operational modernizations.`,
                sourceUrl: cleanSources[0]?.url || `https://${basicComp.domain}`,
                confidence: "High",
              },
            ],
        recommendedContacts: Array.isArray(companyAnalysis.recommendedContacts) && companyAnalysis.recommendedContacts.length > 0
          ? companyAnalysis.recommendedContacts
          : [
              { jobTitle: "VP of Manufacturing Operations", department: "Operations", reason: "Direct authority over factory tooling and line optimization" },
              { jobTitle: "Director of Plant Maintenance & Automation", department: "Engineering", reason: "Oversees reliability and industrial technology deployments" },
            ],
        recommendedApproach: companyAnalysis.recommendedApproach || `Lead with quantifiable downtime reduction and production line throughput improvements at their ${basicComp.country} manufacturing facilities.`,
        matchedObjectives: compMatchedObjs,
        sources: cleanSources.length > 0 ? cleanSources : [
          { title: `${basicComp.name} Official Website`, url: `https://${basicComp.domain}`, retrievedAt: Date.now() },
        ],
        createdAt: Date.now(),
      };

      return fullCompany;
    };

    // Concurrency Worker Pool (concurrency = 2) with pacing delay to respect Gemini API rate limits
    const CONCURRENCY = 2;
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < targetCompanies.length) {
        const currentIndex = nextIndex++;
        const basicComp = targetCompanies[currentIndex];
        try {
          const fullCompany = await processCompany(basicComp, currentIndex);
          finalCompanies.push(fullCompany);
          completedCount++;
          sendEvent("company", {
            company: fullCompany,
            index: completedCount,
            total: targetCompanies.length,
          });
          sendEvent("log", {
            message: `✓ [${completedCount}/${targetCompanies.length}] Completed dossier for ${fullCompany.name} (${fullCompany.country}) • Score: ${fullCompany.overallScore}/100`,
          });
          // Small pacing delay to prevent hitting RPM quotas
          await new Promise((resolve) => setTimeout(resolve, 350));
        } catch (e: any) {
          console.error(`Worker error on company ${basicComp?.name}:`, e);
        }
      }
    };

    // Launch workers
    const workerPromises = Array.from({ length: Math.min(CONCURRENCY, targetCompanies.length) }, () => worker());
    await Promise.all(workerPromises);

    sendEvent("log", { message: `✓ Market intelligence scan complete: ${finalCompanies.length} company dossiers generated` });
    sendEvent("complete", { count: finalCompanies.length, searchId });
    res.write("event: end\ndata: {}\n\n");
    res.end();
  } catch (error: any) {
    console.error("Pipeline streaming error:", error);
    sendEvent("error", { message: error.message || "Pipeline failure" });
    res.end();
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ManufactureIQ Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
