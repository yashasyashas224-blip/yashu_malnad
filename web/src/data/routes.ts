/**
 * Campus walking network.
 *
 * HOW THIS FILE IS USED
 * ---------------------
 * Each segment joins two nodes and carries its own geometry plus an explicit
 * accessibility record. The router (src/lib/routing.ts) only ever answers from
 * these segments, so it cannot invent a corridor, a staircase or an accessible
 * entrance that is not written here.
 *
 * CURRENT STATE: every segment is `survey: 'provisional'`.
 * The geometry is a straight line between two verified pins, so it is an
 * indicative estimate of walking distance — not a surveyed footpath. The
 * interface labels these routes clearly ("Indicative — not surveyed") and the
 * step-free option refuses to answer, because no accessibility survey exists.
 * Nothing here claims a segment is step-free.
 *
 * HOW TO MAKE ROUTES REAL (and enable the step-free option)
 * ---------------------------------------------------------
 * 1. Walk the route with the campus engineer / estate office and record the
 *    footpath corners as `waypoints` (lat/lng, in walking order).
 * 2. Set `survey: 'surveyed'` and fill `source` + `checkedOn` with where the
 *    information came from (survey date, estate office note, campus plan).
 * 3. Set `stairs` to 'none' or 'stepped'. Add `surface` and `widthMetres`
 *    when known.
 * 4. Set `stepFree` to 'confirmed' only when you have personally verified that
 *    the whole segment can be used without stairs and with enough width for a
 *    wheelchair. Use 'possible' when it looks usable but is not confirmed.
 *    A segment joined by stairs must be 'barrier' or have `stairs: 'stepped'`.
 * 5. Add junctions (below) where footpaths meet, so routes can follow the
 *    actual network instead of direct lines.
 *
 * Segment endpoints must be a place id from locations.ts or a junction id.
 */

import { LOCATIONS, type LatLng } from './locations';

export type SurveyStatus = 'surveyed' | 'provisional';
export type StairsStatus = 'none' | 'stepped' | 'unknown';

/**
 * Accessibility of one segment.
 *  - 'confirmed'  surveyed, usable without stairs
 *  - 'possible'   no steps recorded, but not confirmed for wheelchair use
 *  - 'unsurveyed' nobody has checked
 *  - 'barrier'    contains stairs, a kerb or a narrow passage
 */
export type StepFreeStatus = 'confirmed' | 'possible' | 'unsurveyed' | 'barrier';

export interface RouteJunction {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

export interface RouteSegment {
  id: string;
  from: string;
  to: string;
  /** Extra corners between `from` and `to`, in walking order. */
  waypoints: LatLng[];
  survey: SurveyStatus;
  stairs: StairsStatus;
  stepFree: StepFreeStatus;
  surface: string | null;
  widthMetres: number | null;
  source: string | null;
  checkedOn: string | null;
  note: string | null;
}

/** Optional footpath junctions. Empty until the campus network is surveyed. */
export const ROUTE_JUNCTIONS: RouteJunction[] = [];

const coordinateOf = (nodeId: string): LatLng => {
  const location = LOCATIONS.find((item) => item.id === nodeId);
  if (location) return { lat: location.coordinates.lat, lng: location.coordinates.lng };
  const junction = ROUTE_JUNCTIONS.find((item) => item.id === nodeId);
  if (junction) return { lat: junction.lat, lng: junction.lng };
  throw new Error(`Walking network references an unknown node: ${nodeId}`);
};

const provisional = (
  id: string,
  from: string,
  to: string,
  note: string | null = null,
): RouteSegment => ({
  id,
  from,
  to,
  waypoints: [],
  survey: 'provisional',
  stairs: 'unknown',
  stepFree: 'unsurveyed',
  surface: null,
  widthMetres: null,
  source: null,
  checkedOn: null,
  note,
});

/**
 * Explicit connections between verified places. Add or remove entries as the
 * campus network is surveyed; the router builds its graph from this list.
 */
export const ROUTE_SEGMENTS: RouteSegment[] = [
  provisional(
    'gate-to-canteen',
    'main-gate',
    'canteen',
    'Straight-line estimate across the entrance area.',
  ),
  provisional(
    'gate-to-main-block',
    'main-gate',
    'main-block',
    'Straight-line estimate along the entrance approach.',
  ),
  provisional('canteen-to-cse', 'canteen', 'cse-department'),
  provisional('cse-to-main-block', 'cse-department', 'main-block'),
  provisional('main-block-to-library', 'main-block', 'central-library'),
  provisional('library-to-hostel', 'central-library', 'boys-hostel'),
  provisional('hostel-to-ground', 'boys-hostel', 'play-ground'),
  provisional('main-block-to-ground', 'main-block', 'play-ground'),
  provisional('ground-to-divya-chaitanya', 'play-ground', 'divya-chaitanya'),
  provisional('cse-to-divya-chaitanya', 'cse-department', 'divya-chaitanya'),
];

/** Full geometry of a segment, including its verified endpoints. */
export function segmentPath(segment: RouteSegment): LatLng[] {
  return [coordinateOf(segment.from), ...segment.waypoints, coordinateOf(segment.to)];
}

/** True when every segment of a route has been surveyed. */
export const isSurveyed = (segment: RouteSegment): boolean => segment.survey === 'surveyed';
