import { Company, SearchQuery } from "../types.ts";

const SESSION_KEY = "mfg_session_id";
const SEARCHES_STORAGE_KEY = "manufacture_iq_searches_v1";
const COMPANIES_STORAGE_KEY = "manufacture_iq_companies_v1";

type Listener<T> = (data: T) => void;
const searchListeners = new Map<string, Set<Listener<SearchQuery | null>>>();
const companiesListeners = new Map<string, Set<Listener<Company[]>>>();

export function getSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function loadSearchesFromStorage(): Record<string, SearchQuery> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SEARCHES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to parse searches from localStorage", e);
    return {};
  }
}

function persistSearchesToStorage(searches: Record<string, SearchQuery>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEARCHES_STORAGE_KEY, JSON.stringify(searches));
  } catch (e) {
    console.error("Failed to save searches to localStorage", e);
  }
}

function loadCompaniesFromStorage(): Record<string, Company[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COMPANIES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to parse companies from localStorage", e);
    return {};
  }
}

function persistCompaniesToStorage(companiesMap: Record<string, Company[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companiesMap));
  } catch (e) {
    console.error("Failed to save companies to localStorage", e);
  }
}

// In-memory caches
let searchesCache: Record<string, SearchQuery> = loadSearchesFromStorage();
let companiesCache: Record<string, Company[]> = loadCompaniesFromStorage();

export async function saveSearch(search: SearchQuery): Promise<void> {
  searchesCache[search.id] = search;
  persistSearchesToStorage(searchesCache);
  notifySearchListeners(search.id, search);
}

export async function updateSearch(searchId: string, updates: Partial<SearchQuery>): Promise<void> {
  const existing = searchesCache[searchId];
  if (!existing) return;
  const updated: SearchQuery = {
    ...existing,
    ...updates,
  };
  searchesCache[searchId] = updated;
  persistSearchesToStorage(searchesCache);
  notifySearchListeners(searchId, updated);
}

export async function getSearch(searchId: string): Promise<SearchQuery | null> {
  return searchesCache[searchId] || null;
}

export async function listSearches(sessionId?: string): Promise<SearchQuery[]> {
  const currentSession = sessionId || getSessionId();
  const all = Object.values(searchesCache);
  // Sort descending by createdAt
  return all
    .filter((s) => !sessionId || s.sessionId === currentSession)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveCompany(company: Company): Promise<void> {
  const searchId = company.searchId;
  const current = companiesCache[searchId] || [];
  const index = current.findIndex((c) => c.id === company.id);
  if (index >= 0) {
    current[index] = company;
  } else {
    current.push(company);
  }
  // Sort companies descending by overallScore
  current.sort((a, b) => b.overallScore - a.overallScore);
  companiesCache[searchId] = current;
  persistCompaniesToStorage(companiesCache);
  notifyCompaniesListeners(searchId, current);

  // Also update search counts
  const highPriority = current.filter((c) => c.overallScore >= 80).length;
  const totalSignals = current.reduce((acc, c) => acc + (c.buyingSignals?.length || 0), 0);
  await updateSearch(searchId, {
    companiesCount: current.length,
    highPriorityCount: highPriority,
    buyingSignalsCount: totalSignals,
  });
}

export async function saveCompaniesBatch(searchId: string, newCompanies: Company[]): Promise<void> {
  const current = companiesCache[searchId] || [];
  for (const comp of newCompanies) {
    const idx = current.findIndex((c) => c.id === comp.id || c.domain === comp.domain);
    if (idx >= 0) {
      current[idx] = comp;
    } else {
      current.push(comp);
    }
  }
  current.sort((a, b) => b.overallScore - a.overallScore);
  companiesCache[searchId] = current;
  persistCompaniesToStorage(companiesCache);
  notifyCompaniesListeners(searchId, current);

  const highPriority = current.filter((c) => c.overallScore >= 80).length;
  const totalSignals = current.reduce((acc, c) => acc + (c.buyingSignals?.length || 0), 0);
  await updateSearch(searchId, {
    companiesCount: current.length,
    highPriorityCount: highPriority,
    buyingSignalsCount: totalSignals,
  });
}

export async function getCompanies(searchId: string): Promise<Company[]> {
  return companiesCache[searchId] || [];
}

export async function getCompany(searchId: string, companyId: string): Promise<Company | null> {
  const list = companiesCache[searchId] || [];
  return list.find((c) => c.id === companyId) || null;
}

export function subscribeSearch(searchId: string, callback: (search: SearchQuery | null) => void): () => void {
  if (!searchListeners.has(searchId)) {
    searchListeners.set(searchId, new Set());
  }
  searchListeners.get(searchId)!.add(callback);
  // Initial fire
  callback(searchesCache[searchId] || null);

  return () => {
    const set = searchListeners.get(searchId);
    if (set) {
      set.delete(callback);
      if (set.size === 0) searchListeners.delete(searchId);
    }
  };
}

export function subscribeCompanies(searchId: string, callback: (companies: Company[]) => void): () => void {
  if (!companiesListeners.has(searchId)) {
    companiesListeners.set(searchId, new Set());
  }
  companiesListeners.get(searchId)!.add(callback);
  // Initial fire
  callback(companiesCache[searchId] || []);

  return () => {
    const set = companiesListeners.get(searchId);
    if (set) {
      set.delete(callback);
      if (set.size === 0) companiesListeners.delete(searchId);
    }
  };
}

function notifySearchListeners(searchId: string, search: SearchQuery) {
  const set = searchListeners.get(searchId);
  if (set) {
    set.forEach((cb) => cb(search));
  }
}

function notifyCompaniesListeners(searchId: string, companies: Company[]) {
  const set = companiesListeners.get(searchId);
  if (set) {
    set.forEach((cb) => cb(companies));
  }
}
