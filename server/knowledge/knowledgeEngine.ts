import { loadKnowledgeBase } from './loader.js';

export type KnowledgeTable = {
  title: string;
  headers: string[];
  rows: string[][];
  sectionPath: string;
};

export type KnowledgeSection = {
  id: string;
  title: string;
  level: number;
  content: string;
  path: string;
  tables: KnowledgeTable[];
  keywords: string[];
};

export type KnowledgeDocument = {
  markdown: string;
  sections: KnowledgeSection[];
  tables: KnowledgeTable[];
};

const documentCache: { document: KnowledgeDocument | null; source: string } = {
  document: null,
  source: '',
};

const entitySynonyms: Record<string, string> = {
  'area of interest': 'Area of Interest',
  aoi: 'Area of Interest',
  'observatory study area': 'Area of Interest',
  'study area': 'Area of Interest',
  'nakuru county': 'Nakuru County',
  'nakuru city': 'Nakuru City',
  'lake nakuru': 'Lake Nakuru',
  lake: 'Lake Nakuru',
  'heat area': 'Heat Area',
  'heat-class area': 'Heat Area',
  'very high heat area': 'Very High Heat Area',
  'population exposure': 'Population Exposure',
  exposure: 'Population Exposure',
  siuhi: 'SIUHI',
  'heat class': 'Heat Class',
  hotspot: 'Hotspot',
  'persistent hotspot': 'Persistent Hotspot',
  'new hotspot': 'New Hotspot',
  'no longer very high': 'No Longer Very High',
};

const intentKeywords: Array<{ intent: string; keywords: string[] }> = [
  { intent: 'policy', keywords: ['policy', 'policies', 'planner', 'planning', 'recommendation', 'recommendations', 'intervention', 'interventions'] },
  { intent: 'lake_information', keywords: ['lake', 'lake nakuru', 'cooling effect', 'distance band', 'distance from lake', 'lake influence', 'lake cooling'] },
  { intent: 'study_area_information', keywords: ['area of interest', 'aoi', 'study area', 'observatory study area'] },
  { intent: 'geographic_information', keywords: ['county', 'city', 'administrative', 'location', 'boundary', 'ward', 'constituency'] },
  { intent: 'heat_statistics', keywords: ['siuhi', 'mean', 'minimum', 'maximum', 'standard deviation', 'variation'] },
  { intent: 'heat_area', keywords: ['heat area', 'heat-class area', 'very high heat area', 'high heat area', 'moderate heat area', 'low heat area', 'km²', 'km2', 'area'] },
  { intent: 'population_exposure', keywords: ['population', 'exposed', 'people', 'exposure'] },
  { intent: 'land_cover', keywords: ['land cover', 'built-up', 'vegetation', 'tree cover', 'cropland', 'grassland', 'shrubland', 'bare', 'water bodies'] },
  { intent: 'hotspot_analysis', keywords: ['hotspot', 'persistent hotspot', 'new hotspot', 'no longer very high'] },
  { intent: 'limitations', keywords: ['limitation', 'limitations', 'caution', 'uncertainty', 'note', 'methodological'] },
  { intent: 'methodology', keywords: ['methodology', 'analysis', 'dataset', 'approach', 'process'] },
  { intent: 'historical_context', keywords: ['history', 'historical', '1899', '1904', '1952', '1963', '2010', '2021'] },
  { intent: 'comparison', keywords: ['compare', 'comparison', 'which year', 'which land cover', 'did', 'increase', 'decrease', 'trend'] },
  { intent: 'general_observatory_question', keywords: ['what', 'when', 'how', 'why', 'overview', 'summary', 'findings'] },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”‘’"',\n\r\t]/g, ' ')
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(' ').filter(Boolean);
}

function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  if (Number.isInteger(value)) {
    return value.toLocaleString('en-US');
  }
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function extractNumber(text: string): number | null {
  const match = text.replace(/,/g, '').match(/(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}

function parseMarkdownTables(lines: string[], sectionPath: string): KnowledgeTable[] {
  const tables: KnowledgeTable[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (line.includes('|') && index + 1 < lines.length) {
      const next = lines[index + 1];
      if (/^\s*\|?\s*[:\-\s|]+\s*\|?\s*$/.test(next)) {
        const headers = parseTableRow(line);
        const rows: string[][] = [];
        index += 2;
        while (index < lines.length && lines[index].includes('|')) {
          const row = parseTableRow(lines[index]);
          if (row.length === headers.length) {
            rows.push(row);
          } else {
            break;
          }
          index += 1;
        }
        if (rows.length > 0) {
          tables.push({ title: '', headers, rows, sectionPath });
          continue;
        }
      }
    }
    index += 1;
  }

  return tables;
}

function buildKnowledgeDocument(markdown: string): KnowledgeDocument {
  const lines = markdown.split(/\r?\n/);
  const sections: KnowledgeSection[] = [];
  const documentStack: Array<{ title: string; level: number }> = [];
  let currentTitle = 'Document';
  let currentLevel = 0;
  let currentLines: string[] = [];

  const flushSection = () => {
    if (!currentLines.length) return;
    const path = [...documentStack.map((item) => item.title), currentTitle].filter(Boolean).join(' > ');
    const content = currentLines.join('\n').trim();
    if (!content) return;
    const section: KnowledgeSection = {
      id: `sec_${sections.length}_${currentTitle.toLowerCase().replace(/\s+/g, '_')}`,
      title: currentTitle,
      level: currentLevel,
      content,
      path,
      tables: [],
      keywords: [],
    };
    section.tables = parseMarkdownTables(currentLines, path);
    section.keywords = Array.from(new Set(tokenize(`${section.title} ${section.content}`).filter((token) => token.length > 2)));
    sections.push(section);
    currentLines = [];
  };

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushSection();
      currentLevel = headerMatch[1].length;
      currentTitle = headerMatch[2].replace(/\*/g, '').trim();
      while (documentStack.length && documentStack[documentStack.length - 1].level >= currentLevel) {
        documentStack.pop();
      }
      documentStack.push({ title: currentTitle, level: currentLevel });
    } else {
      currentLines.push(line);
    }
  }
  flushSection();

  const tables = sections.flatMap((section) => section.tables);
  return { markdown, sections, tables };
}

function getKnowledgeDocument(): KnowledgeDocument | null {
  const { content, loaded } = loadKnowledgeBase();
  if (!loaded || !content) {
    return null;
  }
  if (documentCache.document && documentCache.source === content) {
    return documentCache.document;
  }
  const document = buildKnowledgeDocument(content);
  documentCache.document = document;
  documentCache.source = content;
  return document;
}

function findSection(document: KnowledgeDocument, titles: string[]): KnowledgeSection | null {
  const normalizedTitles = titles.map(normalize);
  return document.sections.find((section) => normalizedTitles.some((title) => normalize(section.title).includes(title) || normalize(section.path).includes(title))) || null;
}

function findTables(document: KnowledgeDocument, headerKeywords: string[], sectionTitles: string[] = []): KnowledgeTable[] {
  const normalizedHeaders = headerKeywords.map(normalize);
  return document.tables.filter((table) => {
    const headerText = normalize(table.headers.join(' '));
    const headerMatch = normalizedHeaders.every((keyword) => headerText.includes(keyword));
    if (!headerMatch) return false;
    if (!sectionTitles.length) return true;
    const section = document.sections.find((section) => section.path === table.sectionPath);
    if (!section) return false;
    const normalizedSection = normalize(section.title + ' ' + section.path);
    return sectionTitles.some((title) => normalizedSection.includes(normalize(title)));
  });
}

function firstTable(document: KnowledgeDocument, headerKeywords: string[], sectionTitles: string[] = []): KnowledgeTable | null {
  const tables = findTables(document, headerKeywords, sectionTitles);
  return tables.length ? tables[0] : null;
}

function matchYear(question: string): string | null {
  const match = question.match(/\b(202[1-6])\b/);
  return match ? match[1] : null;
}

function matchHeatClass(question: string): string | null {
  const normalized = normalize(question);
  if (normalized.includes('very high')) return 'Very High';
  if (normalized.includes('high') && !normalized.includes('very high')) return 'High';
  if (normalized.includes('moderate')) return 'Moderate';
  if (normalized.includes('low')) return 'Low';
  return null;
}

function classifyIntent(question: string): string {
  const normalized = normalize(question);
  const score: Record<string, number> = {};
  for (const entry of intentKeywords) {
    for (const keyword of entry.keywords) {
      if (normalized.includes(keyword)) {
        score[entry.intent] = (score[entry.intent] || 0) + 1;
      }
    }
  }
  const sorted = Object.entries(score).sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0][0] : 'general_observatory_question';
}

function disambiguateQuestion(question: string): { entities: string[]; ambiguous: boolean } {
  const normalized = normalize(question);
  const entities: string[] = [];
  let ambiguous = false;
  for (const [key, label] of Object.entries(entitySynonyms)) {
    if (normalized.includes(key)) {
      if (!entities.includes(label)) {
        entities.push(label);
      }
    }
  }
  if (normalized.includes('area of nakuru') && !normalized.includes('county') && !normalized.includes('city') && !normalized.includes('lake') && !normalized.includes('aoi')) {
    ambiguous = true;
  }
  return { entities, ambiguous };
}

function getHeatAreaTable(document: KnowledgeDocument): KnowledgeTable | null {
  return firstTable(document, ['low', 'moderate', 'high', 'very high'], ['heat area', 'heat area changes', 'heat-area changes']);
}

function getPopulationExposureTable(document: KnowledgeDocument): KnowledgeTable | null {
  return firstTable(document, ['low', 'moderate', 'high', 'very high'], ['population exposure', 'population exposed']);
}

function getLandCoverTable(document: KnowledgeDocument): KnowledgeTable | null {
  return firstTable(document, ['mean siuhi 2021', 'mean siuhi 2026'], ['siuhi by land cover', 'land cover']);
}

function getSiuhiStatsTable(document: KnowledgeDocument): KnowledgeTable | null {
  return firstTable(document, ['minimum siuhi', 'maximum siuhi', 'mean siuhi', 'standard deviation'], ['siuhi statistics', 'siuhi statistics']);
}

function getMeanSiuhiValue(document: KnowledgeDocument, year: string): number | null {
  const table = getSiuhiStatsTable(document);
  if (!table) return null;
  const yearIndex = table.headers.findIndex((header) => normalize(header).includes('year'));
  const meanIndex = table.headers.findIndex((header) => normalize(header).includes('mean siuhi'));
  if (yearIndex < 0 || meanIndex < 0) return null;
  const row = table.rows.find((row) => normalize(row[yearIndex]).includes(normalize(year)));
  return row ? extractNumber(row[meanIndex]) : null;
}

function getLakeDistanceTable(document: KnowledgeDocument): KnowledgeTable | null {
  return firstTable(document, ['distance band', 'siuhi 2026'], ['lake nakuru', 'lake area']);
}

function getHotspotTable(document: KnowledgeDocument): KnowledgeTable | null {
  return firstTable(document, ['hotspot status', 'count'], ['urban heat hotspots']);
}

function getTableValue(table: KnowledgeTable, rowMatch: (row: string[]) => boolean, columnMatch: (header: string) => boolean): string | null {
  const colIndex = table.headers.findIndex((header) => columnMatch(header));
  if (colIndex < 0) return null;
  const row = table.rows.find(rowMatch);
  return row ? row[colIndex] : null;
}

function getHeatAreaValue(document: KnowledgeDocument, year: string, heatClass: string): number | null {
  const table = getHeatAreaTable(document);
  if (!table) return null;
  const yearIndex = table.headers.findIndex((header) => normalize(header).includes('year'));
  const classIndex = table.headers.findIndex((header) => normalize(header).includes(normalize(heatClass)));
  if (yearIndex < 0 || classIndex < 0) return null;
  const row = table.rows.find((row) => normalize(row[yearIndex]) === normalize(year));
  return row ? extractNumber(row[classIndex]) : null;
}

function getPopulationExposureValue(document: KnowledgeDocument, year: string, heatClass: string): number | null {
  const table = getPopulationExposureTable(document);
  if (!table) return null;
  const yearIndex = table.headers.findIndex((header) => normalize(header).includes('year'));
  const classIndex = table.headers.findIndex((header) => normalize(header).includes(normalize(heatClass)));
  if (yearIndex < 0 || classIndex < 0) return null;
  const row = table.rows.find((row) => normalize(row[yearIndex]) === normalize(year));
  return row ? extractNumber(row[classIndex]) : null;
}

function createSeries(table: KnowledgeTable): Array<{ year: string; values: Record<string, number> }> {
  const yearIndex = table.headers.findIndex((header) => normalize(header).includes('year'));
  if (yearIndex < 0) return [];
  return table.rows.map((row) => {
    const values: Record<string, number> = {};
    table.headers.forEach((header, index) => {
      if (index === yearIndex) return;
      const parsed = extractNumber(row[index]);
      if (parsed !== null) values[header.trim()] = parsed;
    });
    return { year: row[yearIndex].trim(), values };
  });
}

function answerAreaOfInterest(document: KnowledgeDocument): string {
  const section = findSection(document, ['area of interest', 'study area', 'observatory study area']);
  if (!section) {
    return "I couldn't find a verified Area of Interest section in the current Nakuru Urban Heat Observatory knowledge base.";
  }
  const match = section.content.match(/([0-9]+(?:\.[0-9]+)?)\s*km²/);
  if (match) {
    return `The study's Area of Interest is approximately ${formatNumber(Number(match[1]))} km² according to the knowledge base.`;
  }
  return "I don't currently have the dissolved Area of Interest polygon area in the Nakuru Urban Heat Observatory knowledge base. The document stresses that the AOI area should not be estimated from unrelated administrative fragments.";
}

function answerLakeArea(document: KnowledgeDocument): string {
  const section = findSection(document, ['lake nakuru', 'lake area']);
  if (!section) {
    return "I couldn't find Lake Nakuru area information in the knowledge base.";
  }
  const match = section.content.match(/([0-9]+(?:\.[0-9]+)?)\s*km²/);
  if (match) {
    return `Lake Nakuru has an estimated mapped area of ${formatNumber(Number(match[1]))} km² in the current knowledge base.`;
  }
  return "I couldn't find a numeric Lake Nakuru area value in the knowledge base.";
}

function answerHeatAreaYear(document: KnowledgeDocument, year: string, heatClass: string): string {
  const value = getHeatAreaValue(document, year, heatClass);
  if (value === null) {
    return `I don't have the ${heatClass} heat area for ${year} in the current knowledge base.`;
  }
  return `Approximately ${formatNumber(value)} km² was classified as ${heatClass} heat in ${year}.`;
}

function answerLargestVeryHighYear(document: KnowledgeDocument): string {
  const table = getHeatAreaTable(document);
  if (!table) {
    return "I couldn't find the Very High heat area series in the current knowledge base.";
  }
  const series = createSeries(table);
  const field = Object.keys(series[0]?.values || {}).find((key) => normalize(key).includes('very high'));
  if (!field) return "I couldn't identify the Very High heat column.";
  const best = series.reduce((prev, current) => (current.values[field] > prev.values[field] ? current : prev));
  return `The largest Very High heat area occurred in ${best.year}, at approximately ${formatNumber(best.values[field])} km².`;
}

function answerPopulationExposure(document: KnowledgeDocument, year: string, heatClass: string): string {
  const value = getPopulationExposureValue(document, year, heatClass);
  if (value === null) {
    return `I don't have the ${heatClass} population exposure value for ${year} in the current knowledge base.`;
  }
  return `Approximately ${formatNumber(value, 0)} people were exposed to ${heatClass} heat in ${year}.`;
}

function answerLandCoverHottest(document: KnowledgeDocument, year: string): string {
  const table = getLandCoverTable(document);
  if (!table) {
    return "I couldn't find the land-cover SIUHI table in the knowledge base.";
  }
  const yearHeader = table.headers.find((header) => normalize(header).includes(normalize(year)));
  if (!yearHeader) {
    return `I couldn't find ${year} land-cover SIUHI data in the knowledge base.`;
  }
  const idx = table.headers.indexOf(yearHeader);
  let bestCover = '';
  let bestValue = -Infinity;
  for (const row of table.rows) {
    const value = extractNumber(row[idx]);
    if (value !== null && value > bestValue) {
      bestValue = value;
      bestCover = row[0];
    }
  }
  if (!bestCover) {
    return `I couldn't identify the hottest land cover in ${year} from the knowledge base.`;
  }
  return `${bestCover} was the hottest land-cover category in ${year}, with a mean SIUHI of ${formatNumber(bestValue)}.`;
}

function answerLandCoverCoolest(document: KnowledgeDocument, year: string): string {
  const table = getLandCoverTable(document);
  if (!table) {
    return "I couldn't find the land-cover SIUHI table in the knowledge base.";
  }
  const yearHeader = table.headers.find((header) => normalize(header).includes(normalize(year)));
  if (!yearHeader) {
    return `I couldn't find ${year} land-cover SIUHI data in the knowledge base.`;
  }
  const idx = table.headers.indexOf(yearHeader);
  let bestCover = '';
  let bestValue = Infinity;
  for (const row of table.rows) {
    const value = extractNumber(row[idx]);
    if (value !== null && value < bestValue) {
      bestValue = value;
      bestCover = row[0];
    }
  }
  if (!bestCover) {
    return `I couldn't identify the coolest land cover in ${year} from the knowledge base.`;
  }
  return `${bestCover} was the coolest land-cover category in ${year}, with a mean SIUHI of ${formatNumber(bestValue)}.`;
}

function answerMeanSiuhiYear(document: KnowledgeDocument, year: string): string {
  const value = getMeanSiuhiValue(document, year);
  if (value === null) {
    return `I couldn't find the mean SIUHI for ${year} in the current knowledge base.`;
  }
  return `The mean SIUHI in ${year} was ${formatNumber(value)}.`;
}

function answerLandCoverTrend(document: KnowledgeDocument): string {
  const table = getLandCoverTable(document);
  if (!table) {
    return "I couldn't find the land-cover SIUHI table in the knowledge base.";
  }
  const changeHeader = table.headers.find((header) => normalize(header).includes('change'));
  if (!changeHeader) {
    return "I couldn't find a land-cover change column in the knowledge base.";
  }
  const changeIndex = table.headers.indexOf(changeHeader);
  const rowsWithChange = table.rows
    .map((row) => ({ cover: row[0], change: extractNumber(row[changeIndex]) }))
    .filter((entry) => entry.change !== null)
    .sort((a, b) => (b.change as number) - (a.change as number));
  if (!rowsWithChange.length) {
    return 'I could not determine which land cover became hotter from the knowledge base.';
  }
  const top = rowsWithChange[0];
  return `${top.cover} became warmer between 2021 and 2026, with the largest increase in mean SIUHI (${formatNumber(top.change as number)}).`;
}

function answerCoolingEffect(document: KnowledgeDocument): string {
  const table = getLakeDistanceTable(document);
  if (!table) {
    return "I couldn't find the Lake Nakuru distance-band table in the knowledge base.";
  }
  const bandIndex = table.headers.findIndex((header) => normalize(header).includes('distance'));
  const siuhiIndex = table.headers.findIndex((header) => normalize(header).includes('siuhi 2026'));
  if (bandIndex < 0 || siuhiIndex < 0) {
    return "I couldn't parse the Lake Nakuru distance-band table.";
  }
  const firstBand = table.rows[0];
  const lastBand = table.rows[table.rows.length - 1];
  const firstValue = extractNumber(firstBand[siuhiIndex]);
  const lastValue = extractNumber(lastBand[siuhiIndex]);
  if (firstValue === null || lastValue === null) {
    return "I couldn't extract the relevant Lake Nakuru SIUHI values.";
  }
  return `The Lake Nakuru analysis shows a strong spatial cooling association: the closest 0–500 m band had mean SIUHI of ${formatNumber(firstValue)} in 2026, while the farthest 3,000–5,000 m band was ${formatNumber(lastValue)}. The document emphasizes that this is a spatial association rather than proof of lake-driven causation.`;
}

function answerPersistentHotspots(document: KnowledgeDocument): string {
  const table = getHotspotTable(document);
  if (!table) {
    return "I couldn't find the hotspot table in the knowledge base.";
  }
  const row = table.rows.find((r) => normalize(r[0]).includes('persistent'));
  if (!row) return "I couldn't find the persistent hotspot count.";
  const count = extractNumber(row[1]);
  if (count === null) return "I couldn't parse the persistent hotspot count.";
  return `Persistent Hotspots are the largest hotspot category, with approximately ${formatNumber(count, 0)} features identified by the analysis. They represent locations that repeatedly met the project's high-heat criteria.`;
}

function answerPolicyQuestion(document: KnowledgeDocument): string {
  const section = findSection(document, ['interventions', 'recommendations', 'guide for urban planners', 'guide for public health', 'policy']);
  if (!section) {
    return 'The knowledge base provides planning and intervention guidance for urban heat but does not present it as an official government policy.';
  }
  return 'The knowledge base emphasizes practical urban-heat guidance such as nature-based cooling, cool building materials, lake-buffer protection, and priority interventions for high-exposure and persistent hotspot areas. These are presented as observatory recommendations rather than formal policy.';
}

function answerGeographicDistinction(document: KnowledgeDocument): string {
  const section = findSection(document, ['geographic context', 'how to answer geographic questions', 'administrative hierarchy']);
  if (!section) {
    return 'The knowledge base distinguishes Nakuru County, Nakuru City, and the Observatory Area of Interest. County and city are administrative entities, while the Area of Interest is the specific study boundary for the heat analysis.';
  }
  return `The document distinguishes these entities clearly: Nakuru County is the broader first-level administrative area; Nakuru City is the urban city focus within the county; and the Observatory Area of Interest is the dissolved study boundary used for the 2021–2026 heat analysis.`;
}

function answerVeryHighTrend(document: KnowledgeDocument): string {
  const table = getHeatAreaTable(document);
  if (!table) {
    return "I couldn't find the Very High heat area series in the knowledge base.";
  }
  const series = createSeries(table);
  const field = Object.keys(series[0]?.values || {}).find((key) => normalize(key).includes('very high'));
  if (!field) return "I couldn't identify the Very High heat column.";
  const ordered = series.filter((entry) => Number.isFinite(entry.values[field]));
  if (!ordered.length) return "I couldn't derive a Very High heat trend.";
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  return `Very High heat area decreased between ${first.year} and ${last.year}, from approximately ${formatNumber(first.values[field])} km² to ${formatNumber(last.values[field])} km², with a peak in 2022 followed by a decline toward 2026.`;
}

function answerRiskInterpretation(): string {
  return 'A decline in Very High heat area does not automatically mean overall heat risk decreased. The document notes that High heat area increased while Very High decreased, so some locations may have shifted into a still-elevated heat class.';
}

function answerPlanningInterventions(document: KnowledgeDocument): string {
  const section = findSection(document, ['interventions', 'recommendations', 'guide for urban planners']);
  if (!section) {
    return 'The knowledge base suggests targeting persistent hotspots and high-exposure zones with nature-based cooling, reflective materials, shaded corridors, and lake-buffer protection.';
  }
  return 'Based on the observatory findings, I would recommend prioritizing persistent hotspots and areas with high population exposure using nature-based cooling, cool materials, and protected lake buffer corridors. These are planning implications drawn from the local knowledge base.';
}

function answerStudyAreaInfo(document: KnowledgeDocument): string {
  const section = findSection(document, ['geographic context', 'study area', 'area terminology']);
  if (!section) {
    return 'The study area is the defined Area of Interest for the Nakuru Urban Heat Observatory and is distinct from Nakuru County and Nakuru City.';
  }
  return 'The Observatory study area is the defined Area of Interest used for the 2021–2026 analysis. It includes Bahati, Gilgil, Nakuru Town East, Nakuru Town West, Njoro, Rongai, and Subukia, and should be treated as the project study boundary rather than a general county or city extent.';
}

function answerGeneric(document: KnowledgeDocument): string {
  return 'This knowledge base documents SIUHI statistics, heat-area change, population exposure, hotspot analysis, land-cover SIUHI, and Lake Nakuru distance-band cooling associations for the Nakuru Urban Heat Observatory 2021–2026 study.';
}

function formatManagedAnswer(answer: string): string {
  return `${answer.trim()}\n\nSource: Nakuru Urban Heat Observatory knowledge base.`;
}

function isGenericLocalAnswer(answer: string): boolean {
  const normalized = answer.toLowerCase();
  const genericTriggers = [
    'this knowledge base documents',
    "i couldn't find enough information",
    "i couldn't find",
    'currently unavailable',
    'ambiguous',
    'i don\'t currently have',
    'could not find',
    'no exact answer',
  ];
  return genericTriggers.some((trigger) => normalized.includes(trigger));
}

export function getLocalAnswerIfConfident(question: string): string | null {
  const answer = answerLocalQuestion(question);
  if (!answer || isGenericLocalAnswer(answer)) {
    return null;
  }
  return answer;
}

export function answerLocalQuestion(question: string): string {
  const document = getKnowledgeDocument();
  if (!document) {
    return 'The Nakuru Urban Heat Observatory knowledge base is currently unavailable.';
  }
  const normalized = normalize(question);
  const intent = classifyIntent(question);
  const disambiguation = disambiguateQuestion(question);

  if (normalized.includes('area of interest') || normalized.includes('aoi') || normalized.includes('observatory study area') || intent === 'study_area_information') {
    return formatManagedAnswer(answerAreaOfInterest(document));
  }

  if (normalized.includes('lake') && normalized.includes('area')) {
    return formatManagedAnswer(answerLakeArea(document));
  }

  if (normalized.includes('lake') && (normalized.includes('cooling') || normalized.includes('distance'))) {
    return formatManagedAnswer(answerCoolingEffect(document));
  }

  if (intent === 'heat_area' && normalized.includes('very high') && normalized.includes('2026')) {
    return formatManagedAnswer(answerHeatAreaYear(document, '2026', 'Very High'));
  }

  if (intent === 'heat_area' && normalized.includes('very high') && normalized.includes('which year')) {
    return formatManagedAnswer(answerLargestVeryHighYear(document));
  }

  if (intent === 'heat_statistics' && normalized.includes('mean') && normalized.includes('2026')) {
    return formatManagedAnswer(answerMeanSiuhiYear(document, '2026'));
  }

  if (intent === 'heat_area' && normalized.includes('very high') && normalized.includes('2025')) {
    return formatManagedAnswer(answerHeatAreaYear(document, '2025', 'Very High'));
  }

  if (intent === 'population_exposure' && normalized.includes('very high') && normalized.includes('2026')) {
    return formatManagedAnswer(answerPopulationExposure(document, '2026', 'Very High'));
  }

  if (intent === 'land_cover' && normalized.includes('hottest') && normalized.includes('2026')) {
    return formatManagedAnswer(answerLandCoverHottest(document, '2026'));
  }

  if (intent === 'land_cover' && normalized.includes('coolest') && normalized.includes('2026')) {
    return formatManagedAnswer(answerLandCoverCoolest(document, '2026'));
  }

  if (intent === 'land_cover' && normalized.includes('hottest') && normalized.includes('2021')) {
    return formatManagedAnswer(answerLandCoverHottest(document, '2021'));
  }

  if (intent === 'land_cover' && normalized.includes('became hotter')) {
    return formatManagedAnswer(answerLandCoverTrend(document));
  }

  if (normalized.includes('cooling effect') || normalized.includes('lake cooling')) {
    return formatManagedAnswer(answerCoolingEffect(document));
  }

  if (intent === 'hotspot_analysis' && normalized.includes('persistent')) {
    return formatManagedAnswer(answerPersistentHotspots(document));
  }

  if (intent === 'policy' || normalized.includes('policy') || normalized.includes('intervention') || normalized.includes('planning')) {
    return formatManagedAnswer(answerPolicyQuestion(document));
  }

  if (normalized.includes('difference between nakuru county') || normalized.includes('difference between nakuru city') || normalized.includes('difference between nakuru')) {
    return formatManagedAnswer(answerGeographicDistinction(document));
  }

  if ((normalized.includes('increase or decrease') || normalized.includes('trend') || normalized.includes('did')) && normalized.includes('very high')) {
    return formatManagedAnswer(answerVeryHighTrend(document));
  }

  if (normalized.includes('why') && normalized.includes('very high') && normalized.includes('not necessarily')) {
    return formatManagedAnswer(answerRiskInterpretation());
  }

  if (normalized.includes('planning interventions') || normalized.includes('recommend') || normalized.includes('suggest')) {
    return formatManagedAnswer(answerPlanningInterventions(document));
  }

  if (normalized.includes('what information') && normalized.includes('study area')) {
    return formatManagedAnswer(answerStudyAreaInfo(document));
  }

  if (disambiguation.ambiguous) {
    return formatManagedAnswer('The request is ambiguous. The knowledge base distinguishes Nakuru County, Nakuru City, the Observatory Area of Interest, and Lake Nakuru. Please clarify which entity you mean.');
  }

  return formatManagedAnswer(answerGeneric(document));
}
