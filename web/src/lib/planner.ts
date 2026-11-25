import { LOCATION_BY_ID } from '../data/locations';
import { readLocal, writeLocal, type WriteResult } from './localStore';

/**
 * “My Campus Day” planner.
 *
 * A plan is a list of stops for one day: a class or an event, the campus place
 * it happens at, and a start time. Everything is stored on this device — see
 * `localStore.ts`. No account, no upload, no server.
 */

export type PlannerKind = 'class' | 'event';

export interface PlannerEntry {
  id: string;
  title: string;
  kind: PlannerKind;
  /** Place id from locations.ts. */
  locationId: string;
  /** 24-hour "HH:MM" on this device's clock. */
  startTime: string;
  endTime: string | null;
  note: string | null;
}

export const PLANNER_KEY = 'planner.v1';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function minutesFromTime(value: string): number {
  const match = TIME_PATTERN.exec(value);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatClock(value: string, locale = 'en-IN'): string {
  if (!isValidTime(value)) return value;
  const [hours, minutes] = value.split(':').map(Number) as [number, number];
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `stop-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

export function sortEntries(entries: PlannerEntry[]): PlannerEntry[] {
  return [...entries].sort(
    (a, b) => minutesFromTime(a.startTime) - minutesFromTime(b.startTime),
  );
}

export function loadEntries(): PlannerEntry[] {
  const raw = readLocal<PlannerEntry[]>(PLANNER_KEY, []);
  if (!Array.isArray(raw)) return [];
  return sortEntries(
    raw.filter(
      (entry): entry is PlannerEntry =>
        Boolean(entry) &&
        typeof entry.id === 'string' &&
        typeof entry.title === 'string' &&
        typeof entry.startTime === 'string' &&
        typeof entry.locationId === 'string' &&
        LOCATION_BY_ID.has(entry.locationId),
    ),
  );
}

export function saveEntries(entries: PlannerEntry[]): WriteResult {
  return writeLocal(PLANNER_KEY, sortEntries(entries));
}

export interface EntryDraft {
  title: string;
  kind: PlannerKind;
  locationId: string;
  startTime: string;
  endTime: string;
  note: string;
}

export type EntryValidation =
  | { ok: true; entry: PlannerEntry }
  | { ok: false; errors: string[] };

export function validateDraft(
  draft: EntryDraft,
  entryId: string | null,
): EntryValidation {
  const errors: string[] = [];
  const title = draft.title.trim();
  if (title.length < 2) errors.push('Give the class or event a name (at least 2 characters).');
  if (title.length > 80) errors.push('Keep the name under 80 characters.');
  if (!LOCATION_BY_ID.has(draft.locationId)) {
    errors.push('Choose a campus place from the list — only verified places are routable.');
  }
  if (!isValidTime(draft.startTime)) errors.push('Start time must be a time such as 09:15.');
  if (draft.endTime && !isValidTime(draft.endTime)) {
    errors.push('End time must be empty or a time such as 10:10.');
  }
  if (
    draft.endTime &&
    isValidTime(draft.endTime) &&
    isValidTime(draft.startTime) &&
    minutesFromTime(draft.endTime) <= minutesFromTime(draft.startTime)
  ) {
    errors.push('End time must be later than the start time.');
  }
  if (draft.note.trim().length > 160) errors.push('Keep the note under 160 characters.');

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    entry: {
      id: entryId ?? newId(),
      title,
      kind: draft.kind,
      locationId: draft.locationId,
      startTime: draft.startTime,
      endTime: draft.endTime || null,
      note: draft.note.trim() || null,
    },
  };
}

/** Entries that have not started yet today, in order. */
export function remainingEntries(entries: PlannerEntry[], now: Date): PlannerEntry[] {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return sortEntries(entries).filter(
    (entry) => minutesFromTime(entry.startTime) >= nowMinutes,
  );
}

/**
 * The next stop to walk to: either the next entry today, or — when the current
 * time falls inside an entry — that entry.
 */
export function nextEntry(entries: PlannerEntry[], now: Date): PlannerEntry | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const sorted = sortEntries(entries);
  const inProgress = sorted.find((entry) => {
    if (!entry.endTime) return false;
    return (
      minutesFromTime(entry.startTime) <= nowMinutes &&
      minutesFromTime(entry.endTime) > nowMinutes
    );
  });
  if (inProgress) return inProgress;
  return sorted.find((entry) => minutesFromTime(entry.startTime) >= nowMinutes) ?? null;
}

export function minutesUntil(entry: PlannerEntry, now: Date): number {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return minutesFromTime(entry.startTime) - nowMinutes;
}
