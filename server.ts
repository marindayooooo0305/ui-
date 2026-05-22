import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables (.env.example or runtime secrets)
dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Google GenAI SDK to avoid early initialization crashes if key is omitted
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not defined in the workspace secrets panel or environment variables. Please check Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST API Endpoints
// Health Check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    currentTime: new Date().toISOString(),
    aiFeatureAvailable: !!process.env.GEMINI_API_KEY 
  });
});

/**
 * AI-Assisted Cell value mapping / transformation API.
 * Accepts cell data plus an input prompt, and maps columns to smart transformed outputs using Gemini!
 */
app.post("/api/ai-transform", async (req, res) => {
  try {
    const { rows, column, instruction } = req.body;
    
    if (!rows || !column || !instruction) {
      return res.status(400).json({ error: "Missing required arguments: rows, column or instruction" });
    }

    const ai = getAiClient();
    
    // Formulate a compact prompt with strict JSON outputs for robust mapping
    const prompt = `You are a professional spreadsheet cell formatter and editor.
We are executing a batch command on a column named "${column}".
We need to apply the instruction: "${instruction}" to each cell value in this column.

Here is the sample of rows (JSON format):
${JSON.stringify(rows.map((r: any) => ({ colValue: r[column] })))}

Format each adjusted cell beautifully based on that instruction.
Return your responses as a JSON array of strings in the exact same index order.
Do not add markdown formatting or commentary besides the raw JSON sequence of strings.

Example response:
[
  "first transformed value",
  "second transformed value"
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const aiText = response.text;
    if (!aiText) {
      throw new Error("No response string fetched from the model.");
    }

    const parsedArray = JSON.parse(aiText.trim());
    if (Array.isArray(parsedArray)) {
      // Map the results back into rows
      const modifiedRows = rows.map((row: any, index: number) => {
        const replacement = parsedArray[index];
        return {
          ...row,
          [column]: replacement !== undefined ? String(replacement) : row[column]
        };
      });
      return res.json({ success: true, updatedRows: modifiedRows });
    } else {
      throw new Error("The AI returned a block that was not an array.");
    }
  } catch (error: any) {
    console.error("AI Transform failure:", error);
    res.status(500).json({ 
      error: error.message || "Transformation failed. Ensure your Gemini API Key is configured in settings." 
    });
  }
});

/**
 * Interactive helper endpoint to help users write complex regexes or explain data formatting.
 */
app.post("/api/rule-assistant", async (req, res) => {
  try {
    const { userPrompt } = req.body;
    if (!userPrompt) {
      return res.status(400).json({ error: "No user prompt provided." });
    }

    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `The user wants to formulate a data formatting or modification rule for spreadsheets/Excel.
They said: "${userPrompt}".

Suggest a rule type by responding in JSON with these properties:
{
  "recommendedType": "replace" | "format" | "watermark" | "html" | "ai",
  "name": "recommended generic title",
  "description": "short description of action",
  "targetColHint": "suggested column or *",
  "config": {
    "findText": "suggested fine/replace target if relevant",
    "replaceText": "suggested replacement if relevant",
    "formatType": "suggested formatting scheme like 'date-iso' | 'uppercase' | 'lowercase' if relevant",
    "aiPrompt": "ai instruction if AI"
  },
  "explanation": "Brief explanation of how to configure this on the dashboard"
}`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (text) {
      return res.json(JSON.parse(text));
    }
    return res.status(500).json({ error: "Empty AI response." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Configure Vite middleware in developmental context to serve React
async function mountViteMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets in dist...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

async function boot() {
  await mountViteMiddleware();
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express application serving port ${PORT} at http://localhost:${PORT}`);
  });
}

boot();
