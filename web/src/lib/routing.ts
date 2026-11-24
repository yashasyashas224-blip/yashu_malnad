import { LOCATIONS, type LatLng } from '../data/locations';
import {
  ROUTE_JUNCTIONS,
  ROUTE_SEGMENTS,
  segmentPath,
  type RouteSegment,
} from '../data/routes';

/**
 * Walking routes are computed on the explicit network in data/routes.ts.
 * Nothing is guessed: if the network has no path between two places, the
 * router reports that instead of drawing a line through a building.
 */

export interface RouteNode {
  id: string;
  lat: number;
  lng: number;
  label: string;
  isPlace: boolean;
}

export const ROUTE_NODES = new Map<string, RouteNode>();
for (const location of LOCATIONS) {
  ROUTE_NODES.set(location.id, {
    id: location.id,
    lat: location.coordinates.lat,
    lng: location.coordinates.lng,
    label: location.name,
    isPlace: true,
  });
}
for (const junction of ROUTE_JUNCTIONS) {
  if (!ROUTE_NODES.has(junction.id)) {
    ROUTE_NODES.set(junction.id, {
      id: junction.id,
      lat: junction.lat,
      lng: junction.lng,
      label: junction.label,
      isPlace: false,
    });
  }
}

const EARTH_RADIUS_M = 6371008.8;
const WALKING_METRES_PER_MINUTE = 73; // ≈ 4.4 km/h, a relaxed campus pace

const toRadians = (value: number): number => (value * Math.PI) / 180;

export function distanceMetres(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

function pathDistance(path: LatLng[]): number {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const current = path[index];
    if (previous && current) total += distanceMetres(previous, current);
  }
  return total;
}

interface Edge {
  to: string;
  segment: RouteSegment;
  length: number;
  path: LatLng[];
  reversed: boolean;
}

const EDGES = new Map<string, Edge[]>();

function addEdge(from: string, to: string, segment: RouteSegment, length: number, path: LatLng[]): void {
  const list = EDGES.get(from) ?? [];
  list.push({ to, segment, length, path, reversed: false });
  EDGES.set(from, list);
}

for (const segment of ROUTE_SEGMENTS) {
  if (!ROUTE_NODES.has(segment.from) || !ROUTE_NODES.has(segment.to)) continue;
  const path = segmentPath(segment);
  const length = pathDistance(path);
  addEdge(segment.from, segment.to, segment, length, path);
  addEdge(
    segment.to,
    segment.from,
    segment,
    length,
    [...path].reverse().map((point) => ({ lat: point.lat, lng: point.lng })),
  );
}

/** A segment is usable for a step-free route only when that is confirmed. */
const stepFreeUsable = (segment: RouteSegment): boolean =>
  segment.stepFree === 'confirmed' && segment.stairs !== 'stepped';

export type CompassPoint = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

const COMPASS_POINTS: CompassPoint[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

export function bearing(from: LatLng, to: LatLng): number {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const dLng = toRadians(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export const toCompass = (degrees: number): CompassPoint =>
  COMPASS_POINTS[Math.round((((degrees % 360) + 360) % 360) / 45) % 8] ?? 'n';

export interface RouteStep {
  kind: 'start' | 'walk' | 'arrive';
  /** Target of this leg, so the interface can name a verified place. */
  toward: string;
  compass: CompassPoint | null;
  distanceMetres: number;
  provisional: boolean;
}

export interface WalkingRoute {
  ok: true;
  path: LatLng[];
  distanceMetres: number;
  durationMinutes: number;
  /** True when at least one segment has not been surveyed. */
  provisional: boolean;
  stepFree: boolean;
  steps: RouteStep[];
  fromLabel: string;
  toLabel: string;
  /** Distance the start point had to move to reach the network, if snapped. */
  snappedFromMetres: number;
}

export type RouteFailureReason =
  | 'same-place'
  | 'unknown-place'
  | 'no-path'
  | 'no-step-free-route';

export interface RouteFailure {
  ok: false;
  reason: RouteFailureReason;
}

export type RouteResult = WalkingRoute | RouteFailure;

export interface RouteOptions {
  stepFree?: boolean;
  /** A free-form start point (for example the visitor's own location). */
  origin?: LatLng | null;
}

function nearestNode(point: LatLng): { node: RouteNode; distance: number } | null {
  let best: { node: RouteNode; distance: number } | null = null;
  for (const node of ROUTE_NODES.values()) {
    const distance = distanceMetres(point, node);
    if (!best || distance < best.distance) best = { node, distance };
  }
  return best;
}

interface DijkstraResult {
  distance: number;
  edges: Edge[];
}

function shortestPath(
  startId: string,
  endId: string,
  stepFree: boolean,
): DijkstraResult | null {
  const distances = new Map<string, number>([[startId, 0]]);
  const previous = new Map<string, { node: string; edge: Edge }>();
  const visited = new Set<string>();

  while (true) {
    let current: string | null = null;
    let currentDistance = Number.POSITIVE_INFINITY;
    for (const [nodeId, distance] of distances) {
      if (visited.has(nodeId)) continue;
      if (distance < currentDistance) {
        current = nodeId;
        currentDistance = distance;
      }
    }
    if (current === null) break;
    if (current === endId) break;
    visited.add(current);

    for (const edge of EDGES.get(current) ?? []) {
      if (stepFree && !stepFreeUsable(edge.segment)) continue;
      const candidate = currentDistance + edge.length;
      const known = distances.get(edge.to);
      if (known === undefined || candidate < known) {
        distances.set(edge.to, candidate);
        previous.set(edge.to, { node: current, edge });
      }
    }
  }

  if (!distances.has(endId)) return null;

  const edges: Edge[] = [];
  let cursor = endId;
  while (cursor !== startId) {
    const step = previous.get(cursor);
    if (!step) return null;
    edges.unshift(step.edge);
    cursor = step.node;
  }
  return { distance: distances.get(endId) ?? 0, edges };
}

export function findRoute(
  fromId: string,
  toId: string,
  options: RouteOptions = {},
): RouteResult {
  if (fromId === toId && !options.origin) return { ok: false, reason: 'same-place' };
  if (!ROUTE_NODES.has(toId)) return { ok: false, reason: 'unknown-place' };
  if (!options.origin && !ROUTE_NODES.has(fromId)) return { ok: false, reason: 'unknown-place' };

  const destination = ROUTE_NODES.get(toId);
  if (!destination) return { ok: false, reason: 'unknown-place' };

  let startId = fromId;
  let snappedFromMetres = 0;
  if (options.origin) {
    const nearest = nearestNode(options.origin);
    if (!nearest) return { ok: false, reason: 'no-path' };
    startId = nearest.node.id;
    snappedFromMetres = nearest.distance;
  }

  const start = ROUTE_NODES.get(startId);
  if (!start) return { ok: false, reason: 'unknown-place' };

  const stepFree = options.stepFree === true;
  const result = shortestPath(startId, toId, stepFree);
  if (!result) {
    return { ok: false, reason: stepFree ? 'no-step-free-route' : 'no-path' };
  }

  const path: LatLng[] = [{ lat: start.lat, lng: start.lng }];
  for (const edge of result.edges) {
    for (const point of edge.path) {
      const last = path[path.length - 1];
      if (last && last.lat === point.lat && last.lng === point.lng) continue;
      path.push({ lat: point.lat, lng: point.lng });
    }
  }

  const steps: RouteStep[] = [
    {
      kind: 'start',
      toward: start.label,
      compass: null,
      distanceMetres: 0,
      provisional: false,
    },
  ];

  for (const edge of result.edges) {
    const first = edge.path[0];
    const last = edge.path[edge.path.length - 1];
    const targetNode = ROUTE_NODES.get(edge.to);
    if (!first || !last || !targetNode) continue;
    steps.push({
      kind: 'walk',
      toward: targetNode.label,
      compass: toCompass(bearing(first, last)),
      distanceMetres: edge.length,
      provisional: edge.segment.survey !== 'surveyed',
    });
  }

  steps.push({
    kind: 'arrive',
    toward: destination.label,
    compass: null,
    distanceMetres: 0,
    provisional: false,
  });

  const total = result.distance;
  return {
    ok: true,
    path,
    distanceMetres: total,
    durationMinutes: Math.max(1, Math.round(total / WALKING_METRES_PER_MINUTE)),
    provisional: result.edges.some((edge) => edge.segment.survey !== 'surveyed'),
    stepFree,
    steps,
    fromLabel: start.label,
    toLabel: destination.label,
    snappedFromMetres,
  };
}

/** Places that are connected to at least one other place on the network. */
export const ROUTABLE_PLACE_IDS = new Set(
  ROUTE_SEGMENTS.flatMap((segment) => [segment.from, segment.to]),
);

export const NETWORK_HAS_SURVEYED_SEGMENTS = ROUTE_SEGMENTS.some(
  (segment) => segment.survey === 'surveyed',
);

export const NETWORK_HAS_STEP_FREE_SEGMENTS = ROUTE_SEGMENTS.some(stepFreeUsable);

export function formatDistance(metres: number, unit: { m: string; km: string }): string {
  if (metres < 950) return `${Math.round(metres / 10) * 10} ${unit.m}`;
  return `${(metres / 1000).toFixed(1)} ${unit.km}`;
}
