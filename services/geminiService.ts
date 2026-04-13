import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION_PLANNER, SYSTEM_INSTRUCTION_CODER, SYSTEM_INSTRUCTION_SUMMARY, SYSTEM_INSTRUCTION_DASHBOARD, SYSTEM_INSTRUCTION_CHATBOT } from "../constants";
import { DashboardMetrics } from "../types";

// Initialize the API client
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY || process.env.API_KEY : '');

if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing! AI features will not work. Please check your .env file or environment variables.");
} else {
  console.log("Gemini SDK initialized with API key (first 4 chars):", apiKey.substring(0, 4) + "...");
}

const genAI = new GoogleGenerativeAI(apiKey);

// ---------------------------------------------------------------------------
// Model Fallback Configuration
// ---------------------------------------------------------------------------
// When a model hits its quota limit (429), the service will automatically
// retry the request using the next model in this list, in order.
// Priority: 4th → 5th → 3rd → 2nd → 1st (as per user specification)
// ---------------------------------------------------------------------------
export const FALLBACK_MODELS: string[] = [
  "gemini-2.5-flash-lite",
];

let currentModelIndex = 0; // Tracks which model is currently active across all calls

/**
 * Returns the currently active model name.
 */
export const getActiveModel = (): string => FALLBACK_MODELS[currentModelIndex];

/**
 * Checks whether an error is a quota/rate-limit error (HTTP 429).
 */
const isQuotaError = (error: any): boolean =>
  error?.status === 429 ||
  error?.message?.includes("429") ||
  error?.message?.toLowerCase().includes("quota") ||
  error?.message?.toLowerCase().includes("rate limit");

/**
 * Core fallback executor.
 *
 * Tries calling `fn(modelName)` with the current model.  If a quota error is
 * thrown, it advances to the next model in FALLBACK_MODELS and retries —
 * unless every model has been exhausted, in which case it rethrows.
 *
 * @param fn   An async factory that accepts a model name and returns a result.
 * @param label A human-readable label used in console messages (e.g. "Planner").
 */
async function callWithFallback<T>(
  fn: (modelName: string) => Promise<T>,
  label: string
): Promise<T> {
  // Try from the current active model through the end of the list
  for (let i = currentModelIndex; i < FALLBACK_MODELS.length; i++) {
    const modelName = FALLBACK_MODELS[i];
    try {
      const result = await fn(modelName);
      // Success — persist this model as the active one for future calls
      if (currentModelIndex !== i) {
        console.info(`[${label}] Now using fallback model: "${modelName}" (index ${i}).`);
        currentModelIndex = i;
      }
      return result;
    } catch (error: any) {
      if (isQuotaError(error) && i < FALLBACK_MODELS.length - 1) {
        console.warn(
          `[${label}] Quota exceeded for "${modelName}". Falling back to "${FALLBACK_MODELS[i + 1]}"...`
        );
        // Continue loop → tries next model
      } else {
        // Non-quota error OR we've exhausted all models — rethrow
        throw error;
      }
    }
  }
  // TypeScript requires a return here (unreachable at runtime)
  throw new Error(`[${label}] All fallback models exhausted.`);
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

export const generatePlan = async (userQuery: string, fileContext: string): Promise<string[]> => {
  try {
    const result = await callWithFallback(async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_INSTRUCTION_PLANNER });
      const prompt = `User Query: "${userQuery}"\n\nAvailable Files: ${fileContext}\n\nCreate a plan.`;
      const res = await model.generateContent(prompt);
      const text = res.response.text() || "[]";
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText) as string[];
    }, "Planner");

    return result;
  } catch (error: any) {
    console.error("Error generating plan:", error);
    if (isQuotaError(error)) {
      return ["All Gemini models have reached their quota limits. Please wait a few minutes before retrying, or check your API billing settings."];
    }
    return [`Error generating plan: ${error.message || error}. Please ensure your API key is correct and you have quota.`];
  }
};

export const generateCode = async (step: string, context: string): Promise<{ code: string; explanation: string }> => {
  try {
    const result = await callWithFallback(async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_INSTRUCTION_CODER });
      const prompt = `Current Step: "${step}"\n\nContext/Previous Steps:\n${context}\n\nWrite the Python code to accomplish this step.`;
      const res = await model.generateContent(prompt);
      const text = res.response.text() || "";
      const codeMatch = text.match(/```python([\s\S]*?)```/);
      const code = codeMatch ? codeMatch[1].trim() : "# No code generated";
      const explanation = text.replace(/```python[\s\S]*?```/g, '').trim();
      return { code, explanation };
    }, "Coder");

    return result;
  } catch (error: any) {
    console.error("Error generating code:", error);
    let errorMsg = `An error occurred while contacting the coding agent: ${error.message || error}`;
    if (isQuotaError(error)) {
      errorMsg = "All Gemini models have reached their quota limits. Please wait a few minutes before retrying.";
    }
    return { code: "# Error generating code", explanation: errorMsg };
  }
};

export const generateSummary = async (executionLog: string, metricsContext: string = "N/A"): Promise<string> => {
  try {
    const result = await callWithFallback(async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_INSTRUCTION_SUMMARY });
      const prompt = `Execution Log:\n${executionLog}\n\nKey Metrics Derived from Analysis:\n${metricsContext}\n\nProvide a final summary report integrating these metrics.`;
      const res = await model.generateContent(prompt);
      return res.response.text() || "No summary generated.";
    }, "Summary");

    return result;
  } catch (error: any) {
    console.error("Error generating summary:", error);
    if (isQuotaError(error)) {
      return "All Gemini models have reached their quota limits. Please wait a moment before retrying.";
    }
    return `Error generating summary: ${error.message || error}`;
  }
};

export const generateDashboardData = async (context: string): Promise<DashboardMetrics> => {
  try {
    const result = await callWithFallback(async (modelName) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION_DASHBOARD,
        generationConfig: { responseMimeType: "application/json" }
      });
      const prompt = `Based on the following analysis context, generate the dashboard metrics JSON:\n${context}`;
      const res = await model.generateContent(prompt);
      const text = res.response.text() || "{}";
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText) as DashboardMetrics;
    }, "Dashboard");

    return result;
  } catch (error: any) {
    console.error("Error generating dashboard data:", error);
    if (isQuotaError(error)) {
      console.warn("All models hit quota limit for dashboard generation. Using fallback data.");
    }
    // Fallback default data
    return {
      accuracy: "N/A",
      accuracyChange: "0%",
      f1Score: "N/A",
      driftScore: "0.00",
      driftStatus: "Normal",
      avgLatency: "0ms",
      modelStatus: "Quota Limited - All models exhausted",
      driftChartLabels: [],
      driftChartValues: [],
      recentBatches: []
    };
  }
};

export const chatWithBot = async (history: { role: 'user' | 'model', content: string }[], message: string): Promise<string> => {
  try {
    const result = await callWithFallback(async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_INSTRUCTION_CHATBOT });
      const parts = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
      const prompt = `${parts}\nUser: ${message}`;
      const res = await model.generateContent(prompt);
      return res.response.text() || "I'm sorry, I couldn't generate a response.";
    }, "Chatbot");

    return result;
  } catch (error: any) {
    console.error("Error in chatbot:", error);
    if (isQuotaError(error)) {
      return "All Gemini models are currently quota-limited. Please wait a few minutes and try again.";
    }
    return `Connection error: ${error.message || error}. Please check your API key and network.`;
  }
};