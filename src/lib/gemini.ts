import { Company, SearchQuery } from "../types.ts";
import { saveCompany, updateSearch } from "./firestore.ts";

export interface ResearchCallbacks {
  onLog?: (message: string) => void;
  onDiscovered?: (companies: any[]) => void;
  onCompany?: (company: Company, index: number, total: number) => void;
  onComplete?: (count: number) => void;
  onError?: (error: string) => void;
}

/**
 * Runs the complete research pipeline via the server SSE stream.
 * Updates Firestore storage in real time as each company is processed.
 */
export async function executeResearchPipeline(
  search: SearchQuery,
  callbacks?: ResearchCallbacks
): Promise<Company[]> {
  const accumulatedCompanies: Company[] = [];
  const logs: string[] = [];

  const addLog = (msg: string) => {
    logs.push(msg);
    callbacks?.onLog?.(msg);
    updateSearch(search.id, {
      progressStep: msg,
      logs: [...logs],
    });
  };

  addLog(`Starting research for "${search.productDescription.slice(0, 50)}..."`);

  try {
    const response = await fetch("/api/research/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        searchId: search.id,
        productDescription: search.productDescription,
        companyWebsite: search.companyWebsite,
        industries: search.industries,
        countries: search.countries,
        objective: search.objective,
        objectives: search.objectives || (search.objective ? [search.objective] : ["customers", "distributors", "pilot"]),
        companySizePref: search.companySizePref,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server returned status ${response.status}: ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Unable to establish event stream from server.");
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data:")) {
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "log") {
              addLog(event.message);
            } else if (event.type === "discovered") {
              callbacks?.onDiscovered?.(event.companies || []);
            } else if (event.type === "company") {
              const comp = event.company as Company;
              accumulatedCompanies.push(comp);
              await saveCompany(comp);
              callbacks?.onCompany?.(comp, event.index, event.total);
            } else if (event.type === "complete") {
              await updateSearch(search.id, {
                status: "complete",
                progressStep: "Market intelligence research complete.",
              });
              callbacks?.onComplete?.(event.count || accumulatedCompanies.length);
            } else if (event.type === "error") {
              throw new Error(event.message || "Unknown error during intelligence scan.");
            }
          } catch (jsonErr) {
            console.warn("Failed to parse SSE chunk", jsonErr, jsonStr);
          }
        }
      }
    }

    // Mark complete if not already marked
    await updateSearch(search.id, {
      status: "complete",
      progressStep: "Market intelligence research complete.",
      logs: [...logs],
    });

    return accumulatedCompanies;
  } catch (error: any) {
    const errorMsg = error?.message || "Failed to execute research pipeline";
    console.error("Research execution error:", error);
    addLog(`⚠ Error: ${errorMsg}`);
    await updateSearch(search.id, {
      status: "error",
      errorMessage: errorMsg,
      progressStep: `Encountered error: ${errorMsg}`,
    });
    callbacks?.onError?.(errorMsg);
    throw error;
  }
}
