import fs from 'node:fs';
import path from 'node:path';

const KNOWLEDGE_FILENAME = 'Nakuru_Urban_Heat_Observatory_Knowledge.md';

export function getKnowledgeFilePath(): string {
  return path.join(process.cwd(), KNOWLEDGE_FILENAME);
}

let cachedContent: string | null = null;
let lastMtime = 0;

export function loadKnowledgeBase(): { content: string; loaded: boolean } {
  const filePath = getKnowledgeFilePath();
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Knowledge base file not found at ${filePath}`);
      return { content: '', loaded: false };
    }
    const stats = fs.statSync(filePath);
    if (!cachedContent || stats.mtimeMs > lastMtime) {
      cachedContent = fs.readFileSync(filePath, 'utf-8');
      lastMtime = stats.mtimeMs;
    }
    return { content: cachedContent, loaded: true };
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return { content: '', loaded: false };
  }
}
