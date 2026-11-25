import { LOCATION_BY_ID } from '../data/locations';
import {
  SERVICE_NEEDS,
  SERVICES,
  type CampusService,
  type ServiceNeedId,
} from '../data/services';
import { normalize } from './search';

/**
 * “Find a service” search: matches needs (printing, drinking water, first aid,
 * student services…) as well as service titles, then resolves the verified
 * place behind each hit. A need with no verified location returns no result —
 * the panel explains that instead of offering a guess.
 */

export interface ServiceHit {
  service: CampusService;
  score: number;
}

const NEED_TEXT = new Map(
  SERVICE_NEEDS.map((need) => [
    need.id,
    normalize([need.label, ...need.keywords, need.description].join(' ')),
  ] as const),
);

const NEED_LABELS = new Map(SERVICE_NEEDS.map((need) => [need.id, need.label] as const));

export const NEED_BY_ID = NEED_LABELS;

function matchScore(query: string, service: CampusService): number {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return 0;

  const location = LOCATION_BY_ID.get(service.locationId);
  const needText = NEED_TEXT.get(service.needId) ?? '';
  const fields = [
    { text: normalize(service.title), weight: 1 },
    { text: needText, weight: 0.95 },
    { text: normalize(location?.name ?? ''), weight: 0.9 },
    { text: normalize(location?.shortName ?? ''), weight: 0.86 },
    { text: normalize(service.details), weight: 0.4 },
  ];

  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of fields) {
      if (!field.text) continue;
      if (field.text.split(' ').includes(token)) best = Math.max(best, field.weight);
      else if (field.text.includes(token) && token.length >= 3) {
        best = Math.max(best, field.weight * 0.6);
      }
    }
    if (best === 0) return 0;
    total += best;
  }
  return total / tokens.length;
}

export function searchServices(rawQuery: string): ServiceHit[] {
  const query = rawQuery.trim();
  if (!query) return [];

  return SERVICES.map((service) => ({ service, score: matchScore(query, service) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.service.title.localeCompare(b.service.title))
    .slice(0, 6);
}

export function servicesForNeedId(needId: ServiceNeedId): CampusService[] {
  return SERVICES.filter((service) => service.needId === needId);
}

/** True when no need in this query has a verified location at all. */
export function allNeedsUnverified(): boolean {
  return SERVICE_NEEDS.every((need) => servicesForNeedId(need.id).length === 0);
}

export const UNVERIFIED_NEEDS = SERVICE_NEEDS.filter(
  (need) => servicesForNeedId(need.id).length === 0,
).map((need) => need.id);
