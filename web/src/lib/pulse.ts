import {
  REPORT_EXPIRE_AFTER_MS,
  REPORT_POLICY,
  REPORT_STALE_AFTER_MS,
  type PulseReport,
  type ReportKind,
  type ReportVerification,
} from '../data/reports';
import { LOCATION_BY_ID } from '../data/locations';
import { readLocal, writeLocal, type WriteResult } from './localStore';

/**
 * Campus Pulse stored on this device.
 *
 * Everything here operates on `localStorage` only. There is no network call, so
 * nothing is shared and nothing is server-moderated; see `data/reports.ts` for
 * the endpoint contract a shared feed would need.
 */

export const PULSE_KEY = 'pulse.v1';

export type ReportStatus = 'fresh' | 'stale' | 'expired';

export function loadReports(): PulseReport[] {
  const raw = readLocal<PulseReport[]>(PULSE_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (report): report is PulseReport =>
        Boolean(report) &&
        typeof report.id === 'string' &&
        typeof report.message === 'string' &&
        typeof report.createdAt === 'string',
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function persist(reports: PulseReport[]): WriteResult {
  return writeLocal(PULSE_KEY, reports.slice(0, 200));
}

export function reportStatus(report: PulseReport, now = Date.now()): ReportStatus {
  const created = new Date(report.createdAt).getTime();
  if (Number.isNaN(created)) return 'expired';
  const age = now - created;
  if (age > REPORT_EXPIRE_AFTER_MS) return 'expired';
  if (age > REPORT_STALE_AFTER_MS) return 'stale';
  return 'fresh';
}

export function timeAgo(iso: string, now = Date.now()): string {
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return 'unknown time';
  const minutes = Math.max(0, Math.round((now - created) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export interface ReportDraft {
  kind: ReportKind;
  locationId: string | null;
  message: string;
}

export type ReportSubmission =
  | { ok: true; reports: PulseReport[] }
  | { ok: false; errors: string[] };

/**
 * Local spam protection: length bounds, a cooldown window and duplicate
 * detection. A server would additionally need per-account limits; this is only
 * honest device-side hygiene.
 */
export function submitReport(
  draft: ReportDraft,
  existing: PulseReport[],
  now = new Date(),
): ReportSubmission {
  const errors: string[] = [];
  const message = draft.message.trim().replace(/\s+/g, ' ');

  if (message.length < REPORT_POLICY.minLength) {
    errors.push(
      `Write at least ${REPORT_POLICY.minLength} characters so the report is useful (currently ${message.length}).`,
    );
  }
  if (message.length > REPORT_POLICY.maxLength) {
    errors.push(`Keep the report under ${REPORT_POLICY.maxLength} characters.`);
  }
  if (draft.locationId && !LOCATION_BY_ID.has(draft.locationId)) {
    errors.push('Choose a verified campus place, or leave the place empty.');
  }
  if (/\b(https?:\/\/|www\.)/i.test(message)) {
    errors.push('Links are not allowed in campus reports.');
  }
  if (/(.)\1{9,}/.test(message)) {
    errors.push('That message looks like spam (a character repeated many times).');
  }

  const nowMs = now.getTime();
  const recent = existing.filter(
    (report) => nowMs - new Date(report.createdAt).getTime() < REPORT_POLICY.windowMs,
  );
  if (recent.length >= REPORT_POLICY.maxPerWindow) {
    errors.push(
      `You have already sent ${recent.length} reports in the last 30 minutes. Wait a little before adding another.`,
    );
  }
  const duplicate = recent.find(
    (report) =>
      report.message.toLowerCase() === message.toLowerCase() &&
      nowMs - new Date(report.createdAt).getTime() < REPORT_POLICY.duplicateWindowMs,
  );
  if (duplicate) {
    errors.push('You already posted this exact report a few minutes ago.');
  }

  if (errors.length > 0) return { ok: false, errors };

  const report: PulseReport = {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `report-${nowMs}-${Math.round(Math.random() * 1e6)}`,
    kind: draft.kind,
    locationId: draft.locationId,
    message,
    createdAt: now.toISOString(),
    verification: 'unverified',
    hidden: false,
  };

  const next = [report, ...existing];
  const write = persist(next);
  if (!write.ok) return { ok: false, errors: [write.error] };
  return { ok: true, reports: next };
}

export function setReportHidden(
  reports: PulseReport[],
  id: string,
  hidden: boolean,
): { reports: PulseReport[]; result: WriteResult } {
  const next = reports.map((report) => (report.id === id ? { ...report, hidden } : report));
  return { reports: next, result: persist(next) };
}

export function setReportVerification(
  reports: PulseReport[],
  id: string,
  verification: ReportVerification,
): { reports: PulseReport[]; result: WriteResult } {
  const next = reports.map((report) =>
    report.id === id ? { ...report, verification } : report,
  );
  return { reports: next, result: persist(next) };
}

export function deleteReport(
  reports: PulseReport[],
  id: string,
): { reports: PulseReport[]; result: WriteResult } {
  const next = reports.filter((report) => report.id !== id);
  return { reports: next, result: persist(next) };
}

export function clearReports(): WriteResult {
  return persist([]);
}

export function activeReports(reports: PulseReport[], now = Date.now()): PulseReport[] {
  return reports.filter(
    (report) => !report.hidden && reportStatus(report, now) !== 'expired',
  );
}
