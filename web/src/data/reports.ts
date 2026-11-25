/**
 * Campus Pulse — short, time-stamped campus reports.
 *
 * WHAT THIS BUILD IS
 * ------------------
 * The deployed app (https://yashu-malnad-xi.vercel.app/) is a static site: there
 * is no API reachable from the browser. So reports created here are stored in
 * this browser only (`localStorage` key `mce-campus:pulse.v1`) and are **not
 * shared, synchronised or moderated by anyone else**. The interface states this
 * on every report. Do not present them as a live campus feed.
 *
 * WHAT A SHARED FEED NEEDS (production)
 * -------------------------------------
 * The repository already contains an Express backend with token auth and
 * `requireAdmin` (`backend/src/`), but it is not hosted for this site. To make
 * Pulse shared and persistent:
 *
 *  1. Host the backend (or replace it) with a real database — `backend` currently
 *     keeps data in a JSON file, which is not safe for multi-user writes.
 *  2. Add these endpoints, all requiring an authenticated MCE session:
 *       POST /api/pulse/reports      {kind, locationId, message}
 *         → server-side rate limit per user AND per IP, max length, and a
 *           duplicate check; store `createdAt` from the server clock only.
 *       GET  /api/pulse/reports?since=…
 *         → only non-expired reports, with `verification` from the server.
 *       POST /api/pulse/reports/:id/flag      (any signed-in member)
 *       POST /api/pulse/reports/:id/verify    (requireAdmin)
 *       DELETE /api/pulse/reports/:id         (requireAdmin, moderation)
 *  3. Serve the site over HTTPS and keep the moderation log in the existing
 *     `db.addAuditLog` pattern, so every removal is attributable.
 *
 * Until that exists, the moderator controls in this app only clear reports from
 * this device, and the interface says exactly that.
 */

export type ReportKind =
  | 'entrance-closed'
  | 'queue'
  | 'water'
  | 'power'
  | 'event'
  | 'other';

export type ReportVerification = 'unverified' | 'confirmed' | 'flagged';

export interface PulseReport {
  id: string;
  kind: ReportKind;
  /** Place id from locations.ts, or null for a campus-wide note. */
  locationId: string | null;
  message: string;
  /** ISO timestamp created on this device. */
  createdAt: string;
  verification: ReportVerification;
  /** Hidden from the list by whoever is using this device. */
  hidden: boolean;
}

export const REPORT_KINDS: Array<{ id: ReportKind; label: string }> = [
  { id: 'entrance-closed', label: 'Entrance or path closed' },
  { id: 'queue', label: 'Long queue' },
  { id: 'water', label: 'Water problem' },
  { id: 'power', label: 'Power or network problem' },
  { id: 'event', label: 'Happening now' },
  { id: 'other', label: 'Other' },
];

/** A report older than this is shown as stale. */
export const REPORT_STALE_AFTER_MS = 6 * 60 * 60 * 1000;
/** A report older than this is expired and hidden from the active list. */
export const REPORT_EXPIRE_AFTER_MS = 24 * 60 * 60 * 1000;

/** Spam limits applied on this device before a report is saved. */
export const REPORT_POLICY = {
  minLength: 12,
  maxLength: 280,
  maxPerWindow: 3,
  windowMs: 30 * 60 * 1000,
  duplicateWindowMs: 10 * 60 * 1000,
} as const;

export const PULSE_DEVICE_NOTICE =
  'Reports on this device only. Nothing is sent to a server, so other students cannot see them and they are not moderated. A shared campus feed needs the backend described in src/data/reports.ts.';
