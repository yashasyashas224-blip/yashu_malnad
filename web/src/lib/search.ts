import {
  CATEGORIES,
  CATEGORY_BY_ID,
  type CampusLocation,
  type CategoryId,
} from '../data/locations';

/**
 * Search is deterministic and local: every result is a verified location from
 * the campus dataset. No language model is used, so a result can never invent
 * a building or a room.
 */

export interface SearchHit {
  location: CampusLocation;
  score: number;
}

export interface SearchOptions {
  category?: CategoryId | 'all';
  limit?: number;
}

const ABBREVIATIONS: Record<string, string> = {
  cse: 'computer science engineering',
  cs: 'computer science',
  csande: 'computer science engineering',
  'cs&e': 'computer science engineering',
  mech: 'mechanical',
  lib: 'library',
  gate: 'entrance main gate',
  canteen: 'food',
  cafe: 'cafeteria food',
  mess: 'canteen food',
  hostel: 'hostel accommodation',
  ground: 'playground sports',
  playground: 'play ground',
  temple: 'divya chaitanya spiritual',
  dept: 'department',
};

const STOP_WORDS = new Set([
  'where',
  'is',
  'the',
  'a',
  'an',
  'to',
  'of',
  'in',
  'on',
  'at',
  'for',
  'my',
  'me',
  'can',
  'i',
  'find',
  'how',
  'do',
  'get',
  'go',
  'nearest',
  'which',
  'what',
  'please',
  'show',
  'take',
  'want',
  'need',
]);

const STOP_PHRASES = [
  'where is the',
  'where is',
  'where can i find the',
  'where can i find',
  'how do i get to the',
  'how do i get to',
  'how do i reach the',
  'how do i reach',
  'take me to the',
  'take me to',
  'navigate to the',
  'navigate to',
  'directions to the',
  'directions to',
  'route to the',
  'route to',
  'show me the',
  'show me',
  'find the',
  'locate the',
  'nearest',
  'the',
  'a',
  'an',
  'please',
];

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[(),.!?]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractDestinationPhrase(raw: string): string {
  let phrase = normalize(raw);
  let changed = true;
  while (changed) {
    changed = false;
    for (const stop of STOP_PHRASES) {
      if (phrase === stop) return '';
      if (phrase.startsWith(`${stop} `)) {
        phrase = phrase.slice(stop.length + 1);
        changed = true;
      }
    }
  }
  return phrase.trim();
}

function tokenize(input: string): string[] {
  const words = normalize(input).split(' ').filter(Boolean);
  const tokens: string[] = [];
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    const expanded = ABBREVIATIONS[word];
    if (expanded) tokens.push(...expanded.split(' '));
    else tokens.push(word);
  }
  return tokens;
}

function levenshtein(a: string, b: string, max = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const previous: number[] = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let current = i;
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current = Math.min(previous[j]! + 1, row[j - 1]! + 1, previous[j - 1]! + cost);
      row.push(current);
    }
    if (current > max) return max + 1;
    for (let j = 0; j <= b.length; j += 1) previous[j] = row[j]!;
  }
  return previous[b.length]!;
}

function fieldScore(token: string, text: string, weight: number): number {
  if (!text) return 0;
  if (text === token) return weight;
  const words = text.split(' ');
  if (words.includes(token)) return weight * 0.94;
  if (text.startsWith(token)) return weight * 0.85;
  if (words.some((word) => word.startsWith(token) && token.length >= 3)) return weight * 0.8;
  if (text.includes(token) && token.length >= 3) return weight * 0.62;
  if (token.length >= 4) {
    const tolerance = token.length <= 5 ? 1 : 2;
    for (const word of words) {
      if (Math.abs(word.length - token.length) > tolerance) continue;
      if (levenshtein(token, word, tolerance) <= tolerance) return weight * 0.55;
    }
    // Common misspellings such as "libery" still share a strong prefix.
    for (const word of words) {
      if (
        word.length >= 4 &&
        word.slice(0, 3) === token.slice(0, 3) &&
        Math.abs(word.length - token.length) <= 2
      ) {
        return weight * 0.45;
      }
    }
  }
  return 0;
}

const categoryText = (category: CategoryId): string => {
  const meta = CATEGORY_BY_ID[category];
  return normalize([meta.label, meta.plural, ...meta.keywords].join(' '));
};

export function searchLocations(
  locations: CampusLocation[],
  rawQuery: string,
  options: SearchOptions = {},
): SearchHit[] {
  const pool =
    options.category && options.category !== 'all'
      ? locations.filter((location) => location.category === options.category)
      : locations;

  const limit = options.limit ?? 20;
  const phrase = extractDestinationPhrase(rawQuery);
  if (!phrase) {
    return pool.slice(0, limit).map((location) => ({ location, score: 0 }));
  }

  const tokens = tokenize(phrase);
  if (tokens.length === 0) return [];

  const hits: SearchHit[] = [];

  for (const location of pool) {
    const fields = [
      { text: normalize(location.name), weight: 1 },
      { text: normalize(location.shortName), weight: 0.98 },
      ...location.aliases.map((alias) => ({ text: normalize(alias), weight: 0.95 })),
      { text: categoryText(location.category), weight: 0.74 },
      { text: normalize(location.description), weight: 0.3 },
    ];

    let total = 0;
    let everyTokenMatched = true;

    for (const token of tokens) {
      let best = 0;
      for (const field of fields) {
        best = Math.max(best, fieldScore(token, field.text, field.weight));
      }
      if (best === 0) {
        everyTokenMatched = false;
        break;
      }
      total += best;
    }

    if (!everyTokenMatched) continue;

    const nameBonus = normalize(location.name).includes(phrase) ? 0.25 : 0;
    hits.push({ location, score: total / tokens.length + nameBonus });
  }

  hits.sort((a, b) => b.score - a.score || a.location.name.localeCompare(b.location.name));
  return hits.slice(0, limit);
}

/** Full category listing used by the Explore panel; preserves data order. */
export function filterByCategory(
  locations: CampusLocation[],
  category: CategoryId | 'all',
): CampusLocation[] {
  if (category === 'all') return locations;
  return locations.filter((location) => location.category === category);
}

export interface CategoryGroup {
  id: CategoryId;
  label: string;
  emoji: string;
  locations: CampusLocation[];
}

export function groupByCategory(locations: CampusLocation[]): CategoryGroup[] {
  return CATEGORIES.map((category) => ({
    id: category.id,
    label: category.plural,
    emoji: category.emoji,
    locations: locations.filter((location) => location.category === category.id),
  })).filter((group) => group.locations.length > 0);
}

export const QUICK_SEARCHES = [
  'Library',
  'Main gate',
  'Canteen',
  'CS&E',
  'Boys hostel',
  'Play ground',
] as const;
