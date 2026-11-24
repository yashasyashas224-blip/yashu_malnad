/**
 * Facility status and opening hours.
 *
 * These records are snapshots, not live data, and the interface says so. Each
 * record keeps the source it came from and the date it was checked, so a stale
 * entry is obvious instead of looking authoritative.
 *
 * Only add hours that appear on an official MCE page or on the venue's own
 * listing. When two sources disagree, set `hours: null` and explain the
 * conflict in `note` — do not pick one silently.
 */

export type FacilityStatus = 'open' | 'temporarily-closed' | 'unconfirmed';

export interface OpeningHours {
  /** e.g. "Monday – Saturday" */
  days: string;
  opens: string;
  closes: string;
  note?: string;
}

export interface FacilityInfo {
  locationId: string;
  status: FacilityStatus;
  hours: OpeningHours[] | null;
  note: string | null;
  /** ISO date of the last check. Shown as "last updated". */
  lastUpdated: string;
  source: { label: string; url: string } | null;
}

export const FACILITIES: FacilityInfo[] = [
  {
    locationId: 'central-library',
    status: 'unconfirmed',
    hours: null,
    note: 'The official MCE library page and the Google Maps listing show different opening hours, so no time is published here.',
    lastUpdated: '2026-11-23',
    source: {
      label: 'Official MCE library page',
      url: 'https://www.mcehassan.ac.in/home/Library',
    },
  },
  {
    locationId: 'canteen',
    status: 'temporarily-closed',
    hours: null,
    note: 'The Google Maps listing was marked “temporarily closed” when it was checked in October 2026. No reliable hours are available.',
    lastUpdated: '2026-11-23',
    source: {
      label: 'Google Maps listing',
      url: 'https://www.google.com/maps/place/?q=place_id:ChIJ4d9_mTNIpTsRrTQNJl-tSHo',
    },
  },
  {
    locationId: 'play-ground',
    status: 'unconfirmed',
    hours: null,
    note: 'No official ground timings are published. The ground is normally used for scheduled games and physical education.',
    lastUpdated: '2026-11-23',
    source: {
      label: 'Official MCE sports page',
      url: 'https://www.mcehassan.ac.in/home/Sports',
    },
  },
];

export const FACILITY_BY_LOCATION_ID = new Map(
  FACILITIES.map((facility) => [facility.locationId, facility]),
);

/** A snapshot older than this many days is presented as possibly out of date. */
export const FACILITY_STALE_AFTER_DAYS = 120;

export const facilityIsStale = (facility: FacilityInfo, now = new Date()): boolean => {
  const updated = new Date(`${facility.lastUpdated}T00:00:00`);
  if (Number.isNaN(updated.getTime())) return true;
  const ageMs = now.getTime() - updated.getTime();
  return ageMs > FACILITY_STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
};

export const formatCheckedDate = (isoDate: string): string => {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
