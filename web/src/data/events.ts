/**
 * Campus events.
 *
 * NO VERIFIED EVENTS ARE PUBLISHED YET, so this list is empty and the Events
 * view says so. Events must come from an official MCE notice, a department
 * circular or the organiser's own announcement — never from memory.
 *
 * HOW A MAINTAINER ADDS AN EVENT
 * ------------------------------
 *   {
 *     id: '2026-12-techfest',
 *     title: 'TechFest inauguration',
 *     description: 'Inauguration and project exhibition.',
 *     startsAt: '2026-12-04T10:00:00+05:30',
 *     endsAt: '2026-12-04T16:00:00+05:30',
 *     venueId: 'main-block',           // place id from locations.ts, or null
 *     venueName: 'Main Academic Block',
 *     source: { label: 'MCE notice dated 20 Nov 2026', url: 'https://…' },
 *     verified: true,
 *   }
 *
 * Use +05:30 offsets so times are correct in India. Expired events stay in the
 * file and are moved to the "Past events" section automatically.
 */

export interface CampusEvent {
  id: string;
  title: string;
  description: string | null;
  /** ISO timestamp with offset, e.g. 2026-12-04T10:00:00+05:30 */
  startsAt: string;
  endsAt: string | null;
  /** Place id from locations.ts so directions can be offered. */
  venueId: string | null;
  venueName: string;
  source: { label: string; url: string } | null;
  verified: boolean;
}

export const EVENTS: CampusEvent[] = [];

const startTime = (event: CampusEvent): number => {
  const time = new Date(event.startsAt).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const endTime = (event: CampusEvent): number => {
  const end = event.endsAt ? new Date(event.endsAt).getTime() : Number.NaN;
  return Number.isNaN(end) ? startTime(event) : end;
};

export const isExpired = (event: CampusEvent, now = new Date()): boolean =>
  endTime(event) < now.getTime();

/** Upcoming first, then still-running events; expired ones are excluded. */
export const upcomingEvents = (now = new Date()): CampusEvent[] =>
  EVENTS.filter((event) => !isExpired(event, now)).sort(
    (a, b) => startTime(a) - startTime(b),
  );

/** Most recently finished first. */
export const pastEvents = (now = new Date()): CampusEvent[] =>
  EVENTS.filter((event) => isExpired(event, now)).sort(
    (a, b) => startTime(b) - startTime(a),
  );

export const eventDateLabel = (event: CampusEvent, locale: string): string => {
  const start = new Date(event.startsAt);
  if (Number.isNaN(start.getTime())) return event.startsAt;
  return start.toLocaleString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
};
