export interface KnowledgeSection {
  id: string;
  title: string;
  level: number;
  content: string;
  keywords: string[];
}

export function parseKnowledgeMarkdown(markdown: string): KnowledgeSection[] {
  if (!markdown || !markdown.trim()) {
    return [];
  }

  const lines = markdown.split(/\r?\n/);
  const sections: KnowledgeSection[] = [];

  let currentTitle = 'Overview';
  let currentLevel = 1;
  let currentLines: string[] = [];
  let sectionIndex = 0;

  const flushSection = () => {
    if (currentLines.length > 0) {
      const fullText = currentLines.join('\n').trim();
      if (fullText) {
        // Extract keywords from title and content
        const words = (currentTitle + ' ' + fullText)
          .toLowerCase()
          .replace(/[^\w\s-]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 2);
        
        const uniqueKeywords = Array.from(new Set(words));

        sections.push({
          id: `sec_${sectionIndex++}_${currentTitle.toLowerCase().replace(/\s+/g, '_')}`,
          title: currentTitle,
          level: currentLevel,
          content: fullText,
          keywords: uniqueKeywords,
        });
      }
      currentLines = [];
    }
  };

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      flushSection();
      currentLevel = headerMatch[1].length;
      currentTitle = headerMatch[2].replace(/\*/g, '').trim();
    } else {
      currentLines.push(line);
    }
  }

  flushSection();

  return sections;
}
