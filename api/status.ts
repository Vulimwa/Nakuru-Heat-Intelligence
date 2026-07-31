import { loadKnowledgeBase } from '../server/knowledge/loader.js';

export default function handler(_req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (_req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (_req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { content, loaded } = loadKnowledgeBase();
  const apiKey = process.env.GEMINI_API_KEY;
  const hasGeminiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0);

  return res.json({ knowledgeConnected: loaded, geminiEnabled: hasGeminiKey, mode: hasGeminiKey ? 'gemini' : 'local' });
}
