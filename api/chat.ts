import { GoogleGenAI } from "@google/genai";
import { retrieveRelevantKnowledge } from "../server/knowledge/retriever.js";
import {
  answerLocalQuestion,
  getLocalAnswerIfConfident,
} from "../server/knowledge/knowledgeEngine.js";

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
  if (localAnswer) {
    const completedAt = new Date().toISOString();
    return res.json({
      answer: localAnswer,
      mode: "local",
      timestamp: completedAt,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const isGeminiAvailable = Boolean(
    apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim().length > 0,
  );

  if (isGeminiAvailable) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });

      const systemInstruction = `You are Nakuru Heat Intelligence, an AI research assistant for the Nakuru Urban Heat Observatory.\n\nAnswer questions using the supplied Nakuru Urban Heat Observatory knowledge base.\n\nSUPPLIED KNOWLEDGE BASE CONTEXT:\n${contextText}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userQuestion,
        config: { systemInstruction, temperature: 0.2 },
      });

      let answerText = response.text ? response.text.trim() : "";
      if (!answerText) throw new Error("Gemini returned an empty response.");

      const completedAt = new Date().toISOString();
      return res.json({
        answer: answerText,
        mode: "gemini",
        timestamp: completedAt,
      });
    } catch (error) {
      console.warn("Gemini API failed, falling back to local mode:", error);
      const fallbackAnswer = answerLocalQuestion(userQuestion);
      const completedAt = new Date().toISOString();
      return res.json({
        answer: fallbackAnswer,
        mode: "local",
        timestamp: completedAt,
      });
    }
  }

  // Local fallback
  const fallbackAnswer = answerLocalQuestion(userQuestion);
  const completedAt = new Date().toISOString();
  return res.json({
    answer: fallbackAnswer,
    mode: "local",
    timestamp: completedAt,
  });
}
