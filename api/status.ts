import { loadKnowledgeBase } from '../server/knowledge/loader.js';
import { getOpenRouterApiKey } from '../server/openrouter.js';

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

  const { loaded } = loadKnowledgeBase();
  const hasOpenRouterKey = Boolean(getOpenRouterApiKey());

  return res.json({ knowledgeConnected: loaded, llmEnabled: hasOpenRouterKey, mode: hasOpenRouterKey ? 'openrouter' : 'local' });
}
