import { retrieveRelevantKnowledge } from "../server/knowledge/retriever.js";
import {
  answerLocalQuestion,
  getLocalAnswerIfConfident,
} from "../server/knowledge/knowledgeEngine.js";
import {
  getOpenRouterAnswer,
  getOpenRouterApiKey,
} from "../server/openrouter.js";

export default async function handler(req: any, res: any) {
  // CORS preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Please enter a valid question." });
  }

  const userQuestion = message.trim();
  const { contextText, isLoaded } = retrieveRelevantKnowledge(userQuestion);

  if (!isLoaded) {
    return res
      .status(500)
      .json({ error: "Knowledge base is currently unavailable." });
  }

  const localAnswer = getLocalAnswerIfConfident(userQuestion);
  const fallbackAnswer = localAnswer || answerLocalQuestion(userQuestion);

  const isOpenRouterAvailable = Boolean(getOpenRouterApiKey());

  if (isOpenRouterAvailable) {
    try {
      const systemInstruction = `You are Nakuru Heat Intelligence, an AI research assistant for the Nakuru Urban Heat Observatory.

Answer questions using the supplied Nakuru Urban Heat Observatory knowledge base as the primary source. Use the retrieved context to identify and reason over the relevant findings. Do not invent numerical values or unverified facts. If the context does not answer a question, you may provide a concise, generally accepted explanation, clearly labelled as general information rather than a Nakuru Observatory finding. Distinguish SIUHI from air temperature. When discussing population exposure, do not claim that exposure values represent health outcomes. When discussing Lake Nakuru, distinguish spatial association from causation. Give concise, structured answers first, followed by supporting values or bullet points. Use clean plain text or clean bullet points without emojis or raw bold stars.

SUPPLIED KNOWLEDGE BASE CONTEXT:
${contextText}`;
      const answerText = await getOpenRouterAnswer(systemInstruction, userQuestion);

      const completedAt = new Date().toISOString();
      return res.json({
        answer: answerText,
        mode: "openrouter",
        timestamp: completedAt,
      });
    } catch (error) {
      console.warn("OpenRouter API failed, falling back to local mode:", error instanceof Error ? error.message : error);
      const completedAt = new Date().toISOString();
      return res.json({
        answer: fallbackAnswer,
        mode: "local",
        timestamp: completedAt,
      });
    }
  }

  // Local fallback
  const completedAt = new Date().toISOString();
  return res.json({
    answer: fallbackAnswer,
    mode: "local",
    timestamp: completedAt,
  });
}
