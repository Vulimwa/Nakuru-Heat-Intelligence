import express from "express";
import path from "node:path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { loadKnowledgeBase } from "./server/knowledge/loader.js";
import { retrieveRelevantKnowledge } from "./server/knowledge/retriever.js";
import {
  answerLocalQuestion,
  getLocalAnswerIfConfident,
} from "./server/knowledge/knowledgeEngine.js";
import {
  getOpenRouterAnswer,
  getOpenRouterApiKey,
} from "./server/openrouter.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable iframe embedding from any parent application (such as ArcGIS Dashboards)
app.use((_req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

// API status endpoint
app.get("/api/status", (_req, res) => {
  const { loaded } = loadKnowledgeBase();
  const hasOpenRouterKey = Boolean(getOpenRouterApiKey());

  res.json({
    knowledgeConnected: loaded,
    llmEnabled: hasOpenRouterKey,
    mode: hasOpenRouterKey ? "openrouter" : "local",
  });
});

// API chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      error: "Please enter a valid question.",
    });
  }

  const userQuestion = message.trim();
  const { contextText, isLoaded } = retrieveRelevantKnowledge(userQuestion);

  if (!isLoaded) {
    return res.status(500).json({
      error: "Knowledge base is currently unavailable.",
    });
  }

  const localAnswer = getLocalAnswerIfConfident(userQuestion);
  const fallbackAnswer = localAnswer || answerLocalQuestion(userQuestion);

  const isOpenRouterAvailable = Boolean(getOpenRouterApiKey());

  if (isOpenRouterAvailable) {
    try {
      const systemInstruction = `You are Nakuru Heat Intelligence, an AI research assistant for the Nakuru Urban Heat Observatory.

Answer questions using the supplied Nakuru Urban Heat Observatory knowledge base as the primary source. Use the retrieved context to identify and reason over the relevant findings.

The knowledge base contains authoritative project results, including SIUHI statistics (2021-2026), heat class areas, population exposure, land cover thermal relationships, spatial cooling association around Lake Nakuru, urban cooling interventions, and guides & recommendations for heat management.

Do not invent numerical values or unverified facts.

If the supplied context does not answer a question, you may provide a concise, generally accepted explanation. Clearly state that it is general information and is not a finding from the Nakuru Observatory. Never present general knowledge as project data.

If asked for urban cooling interventions, recommendations, or guides, refer to the Nature-Based Solutions, Built-Environment retrofits, and planning guidelines in the knowledge base.

Distinguish SIUHI from air temperature.

When discussing population exposure, do not claim that exposure values represent health outcomes.

When discussing Lake Nakuru, distinguish spatial association from causation. Do not claim that Lake Nakuru is the sole cause of observed cooling.

When comparing years, explicitly identify the years being compared.

When discussing heat classes, clearly distinguish between physical heat area and population exposure.

Give concise, structured answers first, followed by supporting values or bullet points.

Use clean plain text or clean bullet points without any emojis or raw bold stars. Do NOT use emojis anywhere in your response.

SUPPLIED KNOWLEDGE BASE CONTEXT:
${contextText}`;

      const answerText = await getOpenRouterAnswer(systemInstruction, userQuestion);

      // Capture high-precision completion timestamp at the exact moment backend processing completes
      const completedAt = new Date().toISOString();

      return res.json({
        answer: answerText,
        mode: "openrouter",
        timestamp: completedAt,
      });
    } catch (error) {
      console.warn(
        "OpenRouter API request failed, falling back to local mode:",
        error instanceof Error ? error.message : error,
      );
      const completedAt = new Date().toISOString();
      return res.json({
        answer: fallbackAnswer,
        mode: "local",
        timestamp: completedAt,
      });
    }
  } else {
    // Local knowledge mode when the OpenRouter key is missing
    const completedAt = new Date().toISOString();
    return res.json({
      answer: fallbackAnswer,
      mode: "local",
      timestamp: completedAt,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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
    console.log(
      `Nakuru Heat Intelligence server listening on http://localhost:${PORT}`,
    );
  });
}

startServer();
