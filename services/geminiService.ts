import { GoogleGenerativeAI } from "@google/generative-ai";
import { MODEL_PLANNER, MODEL_CODER, MODEL_SUMMARY, MODEL_CHATBOT, SYSTEM_INSTRUCTION_PLANNER, SYSTEM_INSTRUCTION_CODER, SYSTEM_INSTRUCTION_SUMMARY, SYSTEM_INSTRUCTION_DASHBOARD, SYSTEM_INSTRUCTION_CHATBOT } from "../constants";
import { DashboardMetrics } from "../types";

// Initialize the API client
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY || process.env.API_KEY : '');

if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing! AI features will not work. Please check your .env file or environment variables.");
} else {
  console.log("Gemini SDK initialized with API key (first 4 chars):", apiKey.substring(0, 4) + "...");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const generatePlan = async (userQuery: string, fileContext: string): Promise<string[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_PLANNER, systemInstruction: SYSTEM_INSTRUCTION_PLANNER });
    const prompt = `User Query: "${userQuery}"\n\nAvailable Files: ${fileContext}\n\nCreate a plan.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text() || "[]";
    // Cleanup markdown if present to ensure JSON parsing works
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error("Error generating plan:", error);
    return [`Error generating plan: ${error.message || error}. Please ensure your API key is correct and you have quota.`];
  }
};

export const generateCode = async (step: string, context: string): Promise<{ code: string; explanation: string }> => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_CODER, systemInstruction: SYSTEM_INSTRUCTION_CODER });
    const prompt = `Current Step: "${step}"\n\nContext/Previous Steps:\n${context}\n\nWrite the Python code to accomplish this step.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text() || "";

    // Simple extraction of code blocks
    const codeMatch = text.match(/```python([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : "# No code generated";
    const explanation = text.replace(/```python[\s\S]*?```/g, '').trim();

    return { code, explanation };
  } catch (error: any) {
    console.error("Error generating code:", error);
    return { code: "# Error generating code", explanation: `An error occurred while contacting the coding agent: ${error.message || error}` };
  }
};

export const generateSummary = async (executionLog: string, metricsContext: string = "N/A"): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_SUMMARY, systemInstruction: SYSTEM_INSTRUCTION_SUMMARY });
    const prompt = `Execution Log:\n${executionLog}\n\nKey Metrics Derived from Analysis:\n${metricsContext}\n\nProvide a final summary report integrating these metrics.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "No summary generated.";
  } catch (error: any) {
    console.error("Error generating summary:", error);
    return `Error generating summary: ${error.message || error}`;
  }
};

export const generateDashboardData = async (context: string): Promise<DashboardMetrics> => {
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_SUMMARY,
      systemInstruction: SYSTEM_INSTRUCTION_DASHBOARD,
      generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = `Based on the following analysis context, generate the dashboard metrics JSON:\n${context}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text() || "{}";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as DashboardMetrics;
  } catch (error) {
    console.error("Error generating dashboard data:", error);
    // Fallback default data
    return {
      accuracy: "N/A",
      accuracyChange: "0%",
      f1Score: "N/A",
      driftScore: "0.00",
      driftStatus: "Normal",
      avgLatency: "0ms",
      modelStatus: "System Operational",
      driftChartLabels: [],
      driftChartValues: [],
      recentBatches: []
    };
  }
};

export const chatWithBot = async (history: { role: 'user' | 'model', content: string }[], message: string): Promise<string> => {
  try {
    // Construct chat history for context
    // Using generateContent with manual history management as specific chat session object isn't strictly necessary for single turn or simple history tracking

    const model = genAI.getGenerativeModel({ model: MODEL_CHATBOT, systemInstruction: SYSTEM_INSTRUCTION_CHATBOT });
    const parts = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
    const prompt = `${parts}\nUser: ${message}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("Error in chatbot:", error);
    return `Connection error: ${error.message || error}. Please check your API key and network.`;
  }
};