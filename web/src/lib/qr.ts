import type { CampusLocation } from '../data/locations';

export type QrFailureCode = 'empty' | 'invalid' | 'unknown' | 'unsafe';

export type QrResolution =
  | { ok: true; location: CampusLocation }
  | { ok: false; code: QrFailureCode; message: string };

const CAMPUS_HOSTS = [
  'yashu-malnad-xi.vercel.app',
  'mcehassan.ac.in',
  'www.mcehassan.ac.in',
  'localhost',
  '127.0.0.1',
];

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (CAMPUS_HOSTS.includes(host)) return true;
  try {
    if (host === window.location.hostname.toLowerCase()) return true;
  } catch {
    // window is always present in this browser app; ignore for safety.
  }
  return false;
}

function candidateFromUrl(url: URL): string | null {
  const direct =
    url.searchParams.get('place') ??
    url.searchParams.get('location') ??
    url.searchParams.get('spot');
  if (direct) return direct.trim();

  const pathMatch = url.pathname.match(/\/(?:place|location)\/([^/]+)\/?$/i);
  if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]).trim();

  const hash = url.hash.replace(/^#\/?/, '');
  if (hash) {
    const hashUrl = new URLSearchParams(hash.includes('=') ? hash : `place=${hash}`);
    const fromHash = hashUrl.get('place') ?? hashUrl.get('location');
    if (fromHash) return fromHash.trim();
  }
  return null;
}

/**
 * Accepts either a raw location ID (e.g. "central-library") or a campus URL
 * such as https://yashu-malnad-xi.vercel.app/?place=central-library.
 *
 * It never opens a scanned URL. Anything that is not a known MCE location is
 * rejected with a message the scanner can display.
 */
export function resolveCampusQr(
  raw: string,
  locations: CampusLocation[],
): QrResolution {
  const content = raw.trim();
  if (!content) {
    return { ok: false, code: 'empty', message: 'The QR code was empty. Try another campus code.' };
  }

  const byId = new Map(locations.map((location) => [location.id.toLowerCase(), location]));
  const direct = byId.get(content.toLowerCase());
  if (direct) return { ok: true, location: direct };

  let url: URL;
  try {
    // Only absolute web URLs are considered; arbitrary text is not a link.
    url = new URL(content);
  } catch {
    return {
      ok: false,
      code: 'invalid',
      message:
        'This QR code does not contain a campus location ID or link. Ask at the college office for the correct code, or search for the place instead.',
    };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return {
      ok: false,
      code: 'invalid',
      message:
        'This QR code uses a non-web link. For safety it was not opened. Use campus search to find the place instead.',
    };
  }

  if (!isAllowedHost(url.hostname)) {
    return {
      ok: false,
      code: 'unsafe',
      message:
        'This QR code points to a website that is not part of the MCE campus map, so it was not opened. Use campus search instead.',
    };
  }

  const candidate = candidateFromUrl(url);
  const match = candidate ? byId.get(candidate.toLowerCase()) : null;

  if (match) return { ok: true, location: match };

  if (candidate) {
    return {
      ok: false,
      code: 'unknown',
      message: `This MCE link points to “${candidate}”, which is not a location in the verified campus dataset. Search for the place to see whether it is mapped.`,
    };
  }

  return {
    ok: false,
    code: 'unknown',
    message:
      'This is a campus website link, but it does not identify a mapped location. Search for the place to see whether it is in the verified dataset.',
  };
}

export const QR_FORMAT_HINT =
  'Campus QR codes contain a location ID such as “central-library”, or a campus link such as https://yashu-malnad-xi.vercel.app/?place=central-library.';
