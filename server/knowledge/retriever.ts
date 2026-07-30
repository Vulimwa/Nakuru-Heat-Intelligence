import { loadKnowledgeBase } from './loader.js';
import { parseKnowledgeMarkdown, KnowledgeSection } from './parser.js';

export interface RetrievalResult {
  contextText: string;
  matchedSections: KnowledgeSection[];
  isLoaded: boolean;
}

export function retrieveRelevantKnowledge(query: string, maxSections = 4): RetrievalResult {
  const { content, loaded } = loadKnowledgeBase();
  if (!loaded || !content) {
    return { contextText: '', matchedSections: [], isLoaded: false };
  }

  const sections = parseKnowledgeMarkdown(content);
  if (sections.length === 0) {
    return { contextText: '', matchedSections: [], isLoaded: true };
  }

  const cleanQuery = query.toLowerCase().replace(/[^\w\s-]/g, ' ');
  const queryTokens = Array.from(
    new Set(cleanQuery.split(/\s+/).filter((t) => t.length > 1))
  );

  // Check specific entities or years mentioned in query
  const yearsMentioned = queryTokens.filter((t) => /^202[1-6]$/.test(t));
  const isLakeQuery = queryTokens.some((t) => t.includes('lake') || t.includes('nakuru') || t.includes('cooling') || t.includes('distance') || t.includes('band'));
  const isLandCoverQuery = queryTokens.some((t) => t.includes('cover') || t.includes('land') || t.includes('vegetation') || t.includes('built') || t.includes('cropland') || t.includes('shrub') || t.includes('water'));
  const isExposureQuery = queryTokens.some((t) => t.includes('exposure') || t.includes('population') || t.includes('people'));
  const isHotspotQuery = queryTokens.some((t) => t.includes('hotspot') || t.includes('persistent') || t.includes('new'));
  const isAreaQuery = queryTokens.some((t) => t.includes('area') || t.includes('km') || t.includes('extent'));
  const isAirTempQuery = queryTokens.some((t) => t.includes('air') || t.includes('temperature') || t.includes('comfort'));

  const scoredSections = sections.map((sec) => {
    let score = 0;
    const titleLower = sec.title.toLowerCase();
    const contentLower = sec.content.toLowerCase();

    // Word token overlap
    for (const token of queryTokens) {
      if (titleLower.includes(token)) {
        score += 8;
      }
      if (sec.keywords.includes(token)) {
        score += 3;
      } else if (contentLower.includes(token)) {
        score += 1;
      }
    }

    // Entity boosts
    for (const yr of yearsMentioned) {
      if (contentLower.includes(yr)) {
        score += 5;
      }
    }

    if (isLakeQuery && (titleLower.includes('lake') || titleLower.includes('cooling'))) score += 15;
    if (isLandCoverQuery && titleLower.includes('land cover')) score += 15;
    if (isExposureQuery && titleLower.includes('population')) score += 15;
    if (isHotspotQuery && titleLower.includes('hotspot')) score += 15;
    if (isAreaQuery && (titleLower.includes('area') || titleLower.includes('extent'))) score += 12;
    if (isAirTempQuery && (titleLower.includes('overview') || contentLower.includes('air temperature'))) score += 10;

    // Response rules and key findings section boost if general
    if (titleLower.includes('findings') || titleLower.includes('rules') || titleLower.includes('overview')) {
      score += 2;
    }

    return { section: sec, score };
  });

  // Sort descending by score
  scoredSections.sort((a, b) => b.score - a.score);

  // Take top sections
  const topMatches = scoredSections.slice(0, maxSections).map((s) => s.section);

  // Always include Section 11 (Response Rules) or Section 8 (Key Findings) if score threshold is low
  const contextParts = topMatches.map((sec) => `### ${sec.title}\n${sec.content}`);
  const contextText = contextParts.join('\n\n---\n\n');

  return {
    contextText,
    matchedSections: topMatches,
    isLoaded: true,
  };
}
