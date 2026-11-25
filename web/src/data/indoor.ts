/**
 * Indoor waypoints — the "last mile" inside a building.
 *
 * THERE IS NO VERIFIED INDOOR DATA FOR MCE HASSAN IN THIS PROJECT. This array is
 * empty on purpose: room numbers, floors and corridor layouts change every term
 * and are not published in a machine-readable form, so a floor plan here would
 * be invented. When the dataset is empty the app explains that indoor guidance
 * is unavailable for the building and falls back to the verified outdoor route
 * to the building entrance.
 *
 * HOW A MAINTAINER ADDS A BUILDING
 * --------------------------------
 * 1. Walk the building with the department and record one node per entrance,
 *    lobby, corridor corner, stair head, lift and door you can stand at.
 * 2. Connect nodes with edges and note the real walked distance in metres.
 * 3. Mark `stepFree` only when the edge is genuinely usable without stairs.
 *    Stairs become `kind: 'stairs'`, lifts `kind: 'lift'`.
 * 4. Keep `survey: 'provisional'` until another person has walked the same
 *    sequence; the interface labels provisional guidance as indicative.
 * 5. Print a QR code whose payload is `mce-indoor:<buildingId>` or
 *    `mce-indoor:<buildingId>:<nodeId>` and place it at that node.
 *
 * Room labels must be copied from the door sign, never guessed from a timetable.
 */

import { LOCATIONS } from './locations';

export type IndoorNodeKind =
  | 'entrance'
  | 'lobby'
  | 'corridor'
  | 'stairs'
  | 'lift'
  | 'room'
  | 'service'
  | 'floor';

export type IndoorSurvey = 'surveyed' | 'provisional';

export interface IndoorNode {
  id: string;
  label: string;
  kind: IndoorNodeKind;
  /** 0 = ground floor. */
  floor: number;
  /** Optional free-text note such as "left of the notice board". */
  note?: string;
}

export interface IndoorEdge {
  from: string;
  to: string;
  /** Walked distance in metres. */
  metres: number;
  kind: 'corridor' | 'stairs' | 'lift';
  /** Only 'confirmed' when verified usable without stairs. */
  stepFree: 'confirmed' | 'unsurveyed' | 'barrier';
  note?: string;
}

export interface IndoorBuilding {
  /** Must match a place id in locations.ts. */
  buildingId: string;
  name: string;
  floors: number;
  survey: IndoorSurvey;
  nodes: IndoorNode[];
  edges: IndoorEdge[];
  source: { label: string; url: string } | null;
  checkedOn: string | null;
}

export const INDOOR_BUILDINGS: IndoorBuilding[] = [];

export const INDOOR_BUILDING_BY_ID = new Map(
  INDOOR_BUILDINGS.map((building) => [building.buildingId, building] as const),
);

/** Buildings that exist on the outdoor map but have no indoor survey yet. */
export const INDOOR_PENDING_BUILDING_IDS = LOCATIONS.filter(
  (location) => location.category === 'academic' || location.category === 'library',
).map((location) => location.id);

export const INDOOR_LAST_CHECKED = 'Not surveyed yet';

export const INDOOR_QR_PREFIX = 'mce-indoor:';

export const INDOOR_QR_HINT =
  'Indoor codes look like “mce-indoor:main-block:mb-entrance”, or a link such as https://yashu-malnad-xi.vercel.app/?indoor=main-block:mb-entrance.';
