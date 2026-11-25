/**
 * Device-local storage for anything personal.
 *
 * WHERE THE DATA LIVES
 * --------------------
 * Everything written through this module stays in this browser on this device,
 * in `window.localStorage` under the `mce-campus:` prefix. Nothing is uploaded:
 * this build is a static site with no authenticated API, so a schedule, a tour
 * position or a report never leaves the device.
 *
 * Consequences a student should know:
 *  - Clearing site data, using private browsing, or switching browser/device
 *    loses the data.
 *  - A schedule saved here is not visible to any other device or person.
 *  - Reports created in Campus Pulse are visible only on this device; see
 *    `src/data/reports.ts` for what a shared backend would require.
 */

export const STORAGE_PREFIX = 'mce-campus:';

export const STORAGE_EXPLANATION =
  'Saved in this browser on this device only (localStorage). Nothing is uploaded to a server, and clearing site data removes it.';

export function storageKey(name: string): string {
  return `${STORAGE_PREFIX}${name}`;
}

export function isStorageAvailable(): boolean {
  try {
    const probe = storageKey('__probe');
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readLocal<T>(name: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(storageKey(name));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export type WriteResult = { ok: true } | { ok: false; error: string };

export function writeLocal(name: string, value: unknown): WriteResult {
  try {
    window.localStorage.setItem(storageKey(name), JSON.stringify(value));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        'This browser could not save to local storage (it may be full, or storage may be blocked in private mode). The change works for this visit but will not be remembered.',
    };
  }
}

export function removeLocal(name: string): WriteResult {
  try {
    window.localStorage.removeItem(storageKey(name));
    return { ok: true };
  } catch {
    return { ok: false, error: 'This browser blocked removing saved data.' };
  }
}
