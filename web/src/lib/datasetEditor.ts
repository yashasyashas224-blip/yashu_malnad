/**
 * Dataset inspection and validation for the maintainer view.
 *
 * This module never writes to the shipped data files. It reads the arrays that
 * are compiled into the app, lets a maintainer paste an edited section, checks
 * it against the same rules the app relies on (unique ids, real place ids,
 * coordinates inside the campus boundary, valid times and dates, connected
 * indoor edges) and keeps the draft on this device.
 *
 * Publishing a validated section is a code change: commit it to the data file
 * and redeploy. There is no authenticated write API, so this tool deliberately
 * cannot publish anything.
 */

import {
  ACCESSIBILITY_FEATURES,
  ACCESSIBILITY_KINDS,
  type AccessibilityFeatureKind,
} from '../data/accessibility';
import { CLASSROOMS } from '../data/classrooms';
import { EVENTS } from '../data/events';
import { FACILITIES, type FacilityStatus } from '../data/facilities';
import { INDOOR_BUILDINGS, type IndoorSurvey } from '../data/indoor';
import {
  CAMPUS,
  CATEGORIES,
  LOCATIONS,
  LOCATION_BY_ID,
  type CategoryId,
} from '../data/locations';
import { SERVICE_NEEDS, SERVICES, type ServiceNeedId } from '../data/services';
import { TOUR_STOPS } from '../data/tour';
import { readLocal, writeLocal, type WriteResult } from './localStore';

export type SectionId =
  | 'places'
  | 'classrooms'
  | 'facilities'
  | 'events'
  | 'accessibility'
  | 'services'
  | 'indoor'
  | 'tour';

type FieldType =
  | 'text'
  | 'optional-text'
  | 'number'
  | 'optional-number'
  | 'boolean'
  | 'list'
  | 'optional-list'
  | 'record'
  | 'optional-record';

interface FieldRule {
  key: string;
  type: FieldType;
  label: string;
}

type Reporter = (index: number, message: string) => void;

interface SectionSpec {
  id: SectionId;
  label: string;
  /** The data file a maintainer edits. */
  file: string;
  description: string;
  idKey: string;
  current: unknown;
  fields: FieldRule[];
  extra?: (items: Record<string, unknown>[], fail: Reporter) => void;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDate(value: string): boolean {
  return DATE_PATTERN.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function isTimestamp(value: string): boolean {
  return /\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(new Date(value).getTime());
}

function campusBounds(): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  for (const point of CAMPUS.boundary) {
    if (point.lat < minLat) minLat = point.lat;
    if (point.lat > maxLat) maxLat = point.lat;
    if (point.lng < minLng) minLng = point.lng;
    if (point.lng > maxLng) maxLng = point.lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

const CAMPUS_BOUNDS = campusBounds();
/** About 400 m of slack, so a gate-side point is not rejected for being outside the fence line. */
const BOUNDS_PADDING = 0.004;

function insideCampus(lat: number, lng: number): boolean {
  return (
    lat >= CAMPUS_BOUNDS.minLat - BOUNDS_PADDING &&
    lat <= CAMPUS_BOUNDS.maxLat + BOUNDS_PADDING &&
    lng >= CAMPUS_BOUNDS.minLng - BOUNDS_PADDING &&
    lng <= CAMPUS_BOUNDS.maxLng + BOUNDS_PADDING
  );
}

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((category) => category.id));
const ACCESSIBILITY_IDS = new Set<string>(ACCESSIBILITY_KINDS.map((kind) => kind.id));
const NEED_IDS = new Set<string>(SERVICE_NEEDS.map((need) => need.id));
const FACILITY_STATUSES = new Set<string>(['open', 'temporarily-closed', 'unconfirmed']);
const SURVEY_VALUES = new Set<string>(['surveyed', 'provisional']);

const sourceRule: FieldRule = {
  key: 'source',
  type: 'optional-record',
  label: 'a { label, url } object, or null',
};

const SECTIONS: SectionSpec[] = [
  {
    id: 'places',
    label: 'Campus places',
    file: 'web/src/data/locations.ts',
    idKey: 'id',
    description:
      'Every pin on the map. A place needs a verified name, a position and the source that verifies it.',
    current: LOCATIONS,
    fields: [
      { key: 'id', type: 'text', label: 'stable id used by routes and QR codes' },
      { key: 'name', type: 'text', label: 'full name' },
      { key: 'shortName', type: 'text', label: 'short label for lists' },
      { key: 'category', type: 'text', label: 'entrance | academic | library | food | hostel | sports | landmark' },
      { key: 'coordinates', type: 'record', label: 'a { lat, lng } object' },
      { key: 'description', type: 'text', label: 'what the source says about the place' },
      { key: 'aliases', type: 'list', label: 'search words, as an array of strings' },
      { key: 'googlePlaceId', type: 'optional-text', label: 'Google place id, or null' },
      { key: 'accessibility', type: 'optional-text', label: 'accessibility note, or null' },
      { key: 'caution', type: 'optional-text', label: 'verified caveat, or null' },
      { key: 'verification', type: 'record', label: 'a { kind, label, checkedOn, url } object' },
      { key: 'officialUrl', type: 'optional-text', label: 'official page, or null' },
    ],
    extra: (items, fail) => {
      items.forEach((item, index) => {
        const category = item.category;
        if (typeof category === 'string' && !CATEGORY_IDS.has(category)) {
          fail(index, `category “${category}” is not one of the categories in locations.ts.`);
        }
        const coordinates = item.coordinates;
        if (isRecord(coordinates)) {
          const lat = coordinates.lat;
          const lng = coordinates.lng;
          if (typeof lat === 'number' && typeof lng === 'number' && !insideCampus(lat, lng)) {
            fail(
              index,
              `coordinates ${lat}, ${lng} are outside the campus boundary — check for a swapped latitude and longitude.`,
            );
          }
        }
        const verification = item.verification;
        if (isRecord(verification)) {
          const checkedOn = verification.checkedOn;
          if (typeof checkedOn === 'string' && !isIsoDate(checkedOn)) {
            fail(index, 'verification.checkedOn must be a date such as 2026-11-23.');
          }
          const url = verification.url;
          if (typeof url === 'string' && !/^https?:\/\//.test(url)) {
            fail(index, 'verification.url must start with https:// so students can check the source.');
          }
        }
        const aliases = item.aliases;
        if (Array.isArray(aliases) && aliases.some((alias) => typeof alias !== 'string')) {
          fail(index, 'aliases must contain only text.');
        }
      });
    },
  },
  {
    id: 'classrooms',
    label: 'Classrooms',
    file: 'web/src/data/classrooms.ts',
    idKey: 'id',
    description:
      'Rooms inside a mapped building. Leave verified false until the department confirms the room.',
    current: CLASSROOMS,
    fields: [
      { key: 'id', type: 'text', label: 'stable id' },
      { key: 'room', type: 'text', label: 'room number as printed on the door' },
      { key: 'label', type: 'text', label: 'room name, e.g. “Computer Networks Laboratory”' },
      { key: 'buildingId', type: 'text', label: 'a place id from locations.ts' },
      { key: 'floor', type: 'optional-text', label: 'floor text, or null' },
      { key: 'department', type: 'text', label: 'owning department' },
      { key: 'courses', type: 'list', label: 'an array of { code, title }' },
      { key: 'capacity', type: 'optional-number', label: 'seats, or null' },
      { key: 'accessibility', type: 'optional-text', label: 'confirmed accessibility note, or null' },
      sourceRule,
      { key: 'verified', type: 'boolean', label: 'true only when the department confirmed it' },
      { key: 'checkedOn', type: 'optional-text', label: 'date checked, or null' },
    ],
    extra: (items, fail) => {
      items.forEach((item, index) => {
        const buildingId = item.buildingId;
        if (typeof buildingId === 'string' && !LOCATION_BY_ID.has(buildingId)) {
          fail(index, `buildingId “${buildingId}” is not a place id, so directions would break.`);
        }
        const checkedOn = item.checkedOn;
        if (typeof checkedOn === 'string' && !isIsoDate(checkedOn)) {
          fail(index, 'checkedOn must be a date such as 2026-11-24, or null.');
        }
      });
    },
  },
  {
    id: 'facilities',
    label: 'Facility status',
    file: 'web/src/data/facilities.ts',
    idKey: 'locationId',
    description:
      'A dated snapshot of opening state and hours. Never publish hours that two sources disagree on.',
    current: FACILITIES,
    fields: [
      { key: 'locationId', type: 'text', label: 'a place id from locations.ts' },
      { key: 'status', type: 'text', label: 'open | temporarily-closed | unconfirmed' },
      { key: 'hours', type: 'optional-list', label: 'an array of { days, opens, closes }, or null' },
      { key: 'note', type: 'optional-text', label: 'why the status is what it is, or null' },
      { key: 'lastUpdated', type: 'text', label: 'the date this snapshot was checked' },
      sourceRule,
    ],
    extra: (items, fail) => {
      items.forEach((item, index) => {
        const status = item.status;
        if (typeof status === 'string' && !FACILITY_STATUSES.has(status)) {
          fail(index, `status “${status}” must be open, temporarily-closed or unconfirmed.`);
        }
        const lastUpdated = item.lastUpdated;
        if (typeof lastUpdated === 'string' && !isIsoDate(lastUpdated)) {
          fail(index, 'lastUpdated must be a date such as 2026-11-23.');
        }
        const hours = item.hours;
        if (Array.isArray(hours)) {
          hours.forEach((slot, slotIndex) => {
            if (!isRecord(slot)) {
              fail(index, `hours entry ${slotIndex + 1} is not an object.`);
              return;
            }
            for (const key of ['days', 'opens', 'closes']) {
              if (typeof slot[key] !== 'string' || !slot[key]) {
                fail(index, `hours entry ${slotIndex + 1} needs a “${key}” string.`);
              }
            }
          });
        }
      });
    },
  },
  {
    id: 'events',
    label: 'Events',
    file: 'web/src/data/events.ts',
    idKey: 'id',
    description:
      'Official notices only, with +05:30 offsets. Expired events move to the past list automatically.',
    current: EVENTS,
    fields: [
      { key: 'id', type: 'text', label: 'stable id' },
      { key: 'title', type: 'text', label: 'event title as announced' },
      { key: 'description', type: 'optional-text', label: 'short description, or null' },
      { key: 'startsAt', type: 'text', label: 'ISO timestamp with offset' },
      { key: 'endsAt', type: 'optional-text', label: 'ISO timestamp with offset, or null' },
      { key: 'venueId', type: 'optional-text', label: 'place id from locations.ts, or null' },
      { key: 'venueName', type: 'text', label: 'venue name as announced' },
      sourceRule,
      { key: 'verified', type: 'boolean', label: 'true only for an official announcement' },
    ],
    extra: (items, fail) => {
      items.forEach((item, index) => {
        const startsAt = item.startsAt;
        if (typeof startsAt === 'string' && !isTimestamp(startsAt)) {
          fail(index, 'startsAt must be an ISO timestamp such as 2026-12-04T10:00:00+05:30.');
        }
        const endsAt = item.endsAt;
        if (typeof endsAt === 'string' && !isTimestamp(endsAt)) {
          fail(index, 'endsAt must be an ISO timestamp or null.');
        }
        const venueId = item.venueId;
        if (typeof venueId === 'string' && !LOCATION_BY_ID.has(venueId)) {
          fail(index, `venueId “${venueId}” is not a place id, so directions cannot be offered.`);
        }
      });
    },
  },
  {
    id: 'accessibility',
    label: 'Accessibility features',
    file: 'web/src/data/accessibility.ts',
    idKey: 'id',
    description:
      'Surveyed ramps, lifts, entrances and step-free paths. Never mark a feature without the survey note.',
    current: ACCESSIBILITY_FEATURES,
    fields: [
      { key: 'id', type: 'text', label: 'stable id' },
      {
        key: 'kind',
        type: 'text',
        label: 'accessible-entrance | ramp | lift | accessible-washroom | stairs | step-free-path',
      },
      { key: 'label', type: 'text', label: 'what the survey calls it' },
      { key: 'locationId', type: 'optional-text', label: 'place id, or null' },
      { key: 'coordinates', type: 'optional-record', label: 'a { lat, lng } object, or null' },
      { key: 'note', type: 'optional-text', label: 'survey note, or null' },
      sourceRule,
      { key: 'checkedOn', type: 'text', label: 'survey date' },
    ],
    extra: (items, fail) => {
      items.forEach((item, index) => {
        const kind = item.kind;
        if (typeof kind === 'string' && !ACCESSIBILITY_IDS.has(kind)) {
          fail(index, `kind “${kind}” is not an accessibility kind.`);
        }
        const locationId = item.locationId;
        if (typeof locationId === 'string' && !LOCATION_BY_ID.has(locationId)) {
          fail(index, `locationId “${locationId}” is not a place id.`);
        }
        const coordinates = item.coordinates;
        if (isRecord(coordinates)) {
          const lat = coordinates.lat;
          const lng = coordinates.lng;
          if (typeof lat === 'number' && typeof lng === 'number' && !insideCampus(lat, lng)) {
            fail(index, 'coordinates are outside the campus boundary.');
          }
        }
        const checkedOn = item.checkedOn;
        if (typeof checkedOn === 'string' && !isIsoDate(checkedOn)) {
          fail(index, 'checkedOn must be a date such as 2026-11-24.');
        }
      });
    },
  },
  {
    id: 'services',
    label: 'Campus services',
    file: 'web/src/data/services.ts',
    idKey: 'id',
    description:
      'A need tied to a verified place. A need without a verified place must stay empty, not guessed.',
    current: SERVICES,
    fields: [
      { key: 'id', type: 'text', label: 'stable id' },
      { key: 'needId', type: 'text', label: 'one of the need ids in services.ts' },
      { key: 'title', type: 'text', label: 'service title' },
      { key: 'locationId', type: 'text', label: 'a place id from locations.ts' },
      { key: 'indoorNodeId', type: 'optional-text', label: 'an indoor node id, or null' },
      { key: 'details', type: 'text', label: 'what is verified, including caveats' },
      { key: 'verified', type: 'boolean', label: 'true only when seen at that place' },
      sourceRule,
      { key: 'checkedOn', type: 'optional-text', label: 'date checked, or null' },
    ],
    extra: (items, fail) => {
      items.forEach((item, index) => {
        const needId = item.needId;
        if (typeof needId === 'string' && !NEED_IDS.has(needId)) {
          fail(index, `needId “${needId}” is not a service need.`);
        }
        const locationId = item.locationId;
        if (typeof locationId === 'string' && !LOCATION_BY_ID.has(locationId)) {
          fail(index, `locationId “${locationId}” is not a place id.`);
        }
        const indoorNodeId = item.indoorNodeId;
        if (typeof indoorNodeId === 'string') {
          const building = INDOOR_BUILDINGS.find(
            (candidate) => candidate.buildingId === item.locationId,
          );
          const hasNode = building?.nodes.some((node) => node.id === indoorNodeId) ?? false;
          if (!hasNode) {
            fail(
              index,
              `indoorNodeId “${indoorNodeId}” does not exist in the indoor survey for this place, so it must be null.`,
            );
          }
        }
        const checkedOn = item.checkedOn;
        if (typeof checkedOn === 'string' && !isIsoDate(checkedOn)) {
          fail(index, 'checkedOn must be a date such as 2026-11-23, or null.');
        }
      });
    },
  },
  {
    id: 'indoor',
    label: 'Indoor surveys',
    file: 'web/src/data/indoor.ts',
    idKey: 'buildingId',
    description:
      'One walked node per entrance, corner, stair head, lift and door, joined by real walked distances.',
    current: INDOOR_BUILDINGS,
    fields: [
      { key: 'buildingId', type: 'text', label: 'a place id from locations.ts' },
      { key: 'name', type: 'text', label: 'building name' },
      { key: 'floors', type: 'number', label: 'how many floors were walked' },
      { key: 'survey', type: 'text', label: 'surveyed | provisional' },
      { key: 'nodes', type: 'list', label: 'an array of { id, label, kind, floor }' },
      { key: 'edges', type: 'list', label: 'an array of { from, to, metres, kind, stepFree }' },
      sourceRule,
      { key: 'checkedOn', type: 'optional-text', label: 'survey date, or null' },
    ],
    extra: (items, fail) => {
      items.forEach((item, index) => {
        const buildingId = item.buildingId;
        if (typeof buildingId === 'string' && !LOCATION_BY_ID.has(buildingId)) {
          fail(index, `buildingId “${buildingId}” is not a place id, so a scanned code cannot open it.`);
        }
        const survey = item.survey;
        if (typeof survey === 'string' && !SURVEY_VALUES.has(survey)) {
          fail(index, 'survey must be “surveyed” or “provisional”.');
        }
        const nodes = Array.isArray(item.nodes) ? item.nodes : [];
        const nodeIds = new Set<string>();
        nodes.forEach((node, nodeIndex) => {
          if (!isRecord(node) || typeof node.id !== 'string' || !node.id) {
            fail(index, `node ${nodeIndex + 1} has no string id.`);
            return;
          }
          if (nodeIds.has(node.id)) fail(index, `node id “${node.id}” is used twice.`);
          nodeIds.add(node.id);
          if (typeof node.floor !== 'number') {
            fail(index, `node “${node.id}” needs a numeric floor (0 = ground floor).`);
          }
          if (typeof node.kind !== 'string') {
            fail(index, `node “${node.id}” needs a kind such as entrance, lobby or stairs.`);
          }
        });
        const edges = Array.isArray(item.edges) ? item.edges : [];
        edges.forEach((edge, edgeIndex) => {
          if (!isRecord(edge)) {
            fail(index, `edge ${edgeIndex + 1} is not an object.`);
            return;
          }
          const from = typeof edge.from === 'string' ? edge.from : '';
          const to = typeof edge.to === 'string' ? edge.to : '';
          if (!nodeIds.has(from)) {
            fail(index, `edge ${edgeIndex + 1} starts at “${from || '?'}”, which is not a node here.`);
          }
          if (!nodeIds.has(to)) {
            fail(index, `edge ${edgeIndex + 1} ends at “${to || '?'}”, which is not a node here.`);
          }
          if (from && from === to) {
            fail(index, `edge ${edgeIndex + 1} starts and ends at the same node.`);
          }
          if (typeof edge.metres !== 'number' || !(edge.metres > 0)) {
            fail(index, `edge ${edgeIndex + 1} needs a walked distance in metres greater than zero.`);
          }
        });
        const checkedOn = item.checkedOn;
        if (typeof checkedOn === 'string' && !isIsoDate(checkedOn)) {
          fail(index, 'checkedOn must be a date such as 2026-11-24, or null.');
        }
      });
    },
  },
  {
    id: 'tour',
    label: 'New-student tour',
    file: 'web/src/data/tour.ts',
    idKey: 'id',
    description: 'Ordered tour stops. Each stop must point at an existing verified place.',
    current: TOUR_STOPS,
    fields: [
      { key: 'id', type: 'text', label: 'stable id' },
      { key: 'locationId', type: 'text', label: 'a place id from locations.ts' },
      { key: 'title', type: 'text', label: 'stop title' },
      { key: 'explanation', type: 'text', label: 'one or two factual sentences' },
    ],
    extra: (items, fail) => {
      items.forEach((item, index) => {
        const locationId = item.locationId;
        if (typeof locationId === 'string' && !LOCATION_BY_ID.has(locationId)) {
          fail(index, `locationId “${locationId}” is not a place id, so the stop cannot be shown.`);
        }
      });
    },
  },
];

export const DATASET_SECTIONS = SECTIONS;

export const SECTION_BY_ID = new Map(SECTIONS.map((section) => [section.id, section] as const));

export const exportSectionValue = (id: SectionId): string => {
  const section = SECTION_BY_ID.get(id);
  if (!section) return '[]';
  return JSON.stringify(section.current, null, 2);
};

export const exportAllSections = (): string => {
  const output: Record<string, unknown> = {};
  for (const section of SECTIONS) output[section.id] = section.current;
  return JSON.stringify(output, null, 2);
};

function fieldProblem(rule: FieldRule, value: unknown): string | null {
  const optional = rule.type.startsWith('optional-');
  const base = (optional ? rule.type.slice('optional-'.length) : rule.type) as FieldType;

  if (value === undefined || value === null) {
    return optional ? null : `“${rule.key}” is required (${rule.label}).`;
  }

  switch (base) {
    case 'text':
      return typeof value === 'string' && value.trim().length > 0
        ? null
        : `“${rule.key}” must be a non-empty string (${rule.label}).`;
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
        ? null
        : `“${rule.key}” must be a number (${rule.label}).`;
    case 'boolean':
      return typeof value === 'boolean'
        ? null
        : `“${rule.key}” must be true or false (${rule.label}).`;
    case 'list':
      return Array.isArray(value) ? null : `“${rule.key}” must be an array (${rule.label}).`;
    case 'record':
      return isRecord(value) ? null : `“${rule.key}” must be an object (${rule.label}).`;
    default:
      return null;
  }
}

export type SectionValidation =
  | { ok: true; value: unknown[]; count: number; warnings: string[] }
  | { ok: false; errors: string[] };

export function validateSectionJson(id: SectionId, text: string): SectionValidation {
  const section = SECTION_BY_ID.get(id);
  if (!section) return { ok: false, errors: ['Unknown dataset section.'] };

  if (!text.trim()) {
    return { ok: false, errors: ['Paste a JSON array first — the editor is empty.'] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      errors: [`That is not valid JSON: ${(error as Error).message}`],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      errors: ['This section must be a JSON array of records, for example [ { "id": "…" } ].'],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const items: Record<string, unknown>[] = [];
  const seen = new Map<string, number>();

  parsed.forEach((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`Entry ${index + 1} is not a JSON object.`);
      return;
    }
    items.push(entry);

    const rawId = entry[section.idKey];
    const id = typeof rawId === 'string' ? rawId.trim() : '';
    const name = id ? `“${id}”` : `entry ${index + 1}`;

    if (!id) {
      errors.push(`Entry ${index + 1} has no “${section.idKey}” string.`);
    } else if (seen.has(id)) {
      errors.push(`“${id}” is used by both entry ${seen.get(id)} and entry ${index + 1}.`);
    } else {
      seen.set(id, index + 1);
    }

    for (const rule of section.fields) {
      const problem = fieldProblem(rule, entry[rule.key]);
      if (problem) errors.push(`${name}: ${problem}`);
    }
  });

  section.extra?.(items, (index, message) => {
    const entry = items[index];
    const rawId = entry ? entry[section.idKey] : undefined;
    const label = typeof rawId === 'string' && rawId ? `“${rawId}”` : `entry ${index + 1}`;
    errors.push(`${label}: ${message}`);
  });

  if (parsed.length === 0) {
    warnings.push(
      'This section is empty. The app will show its honest empty state instead of guessing.',
    );
  } else if (parsed.length > 0) {
    const unverified = items.filter((item) => item.verified === false).length;
    if (unverified > 0) {
      warnings.push(
        `${unverified} record${unverified === 1 ? '' : 's'} use verified: false and will be labelled unverified in the app.`,
      );
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return { ok: true, value: parsed, count: parsed.length, warnings };
}

const DRAFT_PREFIX = 'maintainer-draft:';

export const loadDraft = (id: SectionId): string | null => {
  const value = readLocal<string | null>(`${DRAFT_PREFIX}${id}`, null);
  return typeof value === 'string' && value.trim() ? value : null;
};

export const saveDraft = (id: SectionId, text: string): WriteResult =>
  writeLocal(`${DRAFT_PREFIX}${id}`, text);

/** Everything this tool validates, in the order the app depends on it. */
export const DATASET_RULES = [
  'Every id is unique and stable; routes, QR codes and saved plans point at it.',
  'Every buildingId, locationId and venueId exists in locations.ts, so directions work.',
  'Coordinates sit inside the campus boundary from OpenStreetMap.',
  'Dates are YYYY-MM-DD and event times are ISO timestamps with a +05:30 offset.',
  'Indoor edges join two nodes of the same building with a positive walked distance.',
  'A need or a service with no verified place stays empty rather than being guessed.',
] as const;

/** Counts used by the maintainer overview. */
export const datasetCounts = (): Array<{ label: string; count: number }> => [
  { label: 'Campus places', count: LOCATIONS.length },
  { label: 'Classrooms', count: CLASSROOMS.length },
  { label: 'Facility snapshots', count: FACILITIES.length },
  { label: 'Events', count: EVENTS.length },
  { label: 'Accessibility features', count: ACCESSIBILITY_FEATURES.length },
  { label: 'Services', count: SERVICES.length },
  { label: 'Indoor surveys', count: INDOOR_BUILDINGS.length },
  { label: 'Tour stops', count: TOUR_STOPS.length },
];

/**
 * Type-only re-exports keep the editor honest when a data file changes: the
 * compiler complains here first if an id union gains a member.
 */
export type EditorCategoryId = CategoryId;
export type EditorServiceNeedId = ServiceNeedId;
export type EditorAccessibilityKind = AccessibilityFeatureKind;
export type EditorFacilityStatus = FacilityStatus;
export type EditorIndoorSurvey = IndoorSurvey;
