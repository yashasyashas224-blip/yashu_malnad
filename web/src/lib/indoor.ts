import {
  INDOOR_BUILDING_BY_ID,
  INDOOR_QR_PREFIX,
  type IndoorBuilding,
  type IndoorEdge,
  type IndoorNode,
} from '../data/indoor';
import { LOCATION_BY_ID } from '../data/locations';
import { distanceMetres } from './routing';

/**
 * Indoor code handling and indoor routing.
 *
 * The router only walks the edges written in `data/indoor.ts`. When a building
 * has no survey, `guidance()` returns `{ ok: false, reason: 'no-indoor-data' }`
 * and the interface falls back to the verified outdoor route, never a made-up
 * corridor.
 */

export interface IndoorCodeTarget {
  buildingId: string;
  nodeId: string | null;
  raw: string;
}

function splitCode(value: string): IndoorCodeTarget | null {
  const body = value.trim();
  if (!body.toLowerCase().startsWith(INDOOR_QR_PREFIX)) return null;
  const rest = body.slice(INDOOR_QR_PREFIX.length);
  const [buildingId, nodeId] = rest.split(':');
  if (!buildingId) return null;
  return {
    buildingId: buildingId.trim(),
    nodeId: nodeId?.trim() || null,
    raw: body,
  };
}

/**
 * Accepts `mce-indoor:<building>` / `mce-indoor:<building>:<node>` or a campus
 * link with `?indoor=<building>[:<node>]`. Returns null when the payload is not
 * an indoor code at all, so the scanner can fall through to location codes.
 */
export function parseIndoorCode(raw: string): IndoorCodeTarget | null {
  const direct = splitCode(raw);
  if (direct) return direct;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const value =
    url.searchParams.get('indoor') ??
    url.searchParams.get('inside') ??
    (url.hash.includes('indoor=') ? new URLSearchParams(url.hash.replace(/^#\/?/, '')).get('indoor') : null);
  if (!value) return null;

  const [buildingId, nodeId] = value.split(':');
  if (!buildingId) return null;
  return { buildingId: buildingId.trim(), nodeId: nodeId?.trim() || null, raw: raw.trim() };
}

export function buildingForTarget(target: IndoorCodeTarget): IndoorBuilding | null {
  return INDOOR_BUILDING_BY_ID.get(target.buildingId) ?? null;
}

export function nodeById(building: IndoorBuilding, nodeId: string): IndoorNode | null {
  return building.nodes.find((node) => node.id === nodeId) ?? null;
}

/** The node a bare building code lands on: its entrance, or its first node. */
export function entryNode(building: IndoorBuilding): IndoorNode | null {
  return (
    building.nodes.find((node) => node.kind === 'entrance') ??
    building.nodes.find((node) => node.floor === 0) ??
    building.nodes[0] ??
    null
  );
}

export interface IndoorLeg {
  from: IndoorNode;
  to: IndoorNode;
  edge: IndoorEdge;
}

export type IndoorGuidance =
  | {
      ok: true;
      building: IndoorBuilding;
      from: IndoorNode;
      to: IndoorNode;
      legs: IndoorLeg[];
      metres: number;
      floorsChanged: boolean;
      provisional: boolean;
    }
  | {
      ok: false;
      reason: 'no-indoor-data' | 'unknown-node' | 'same-node' | 'no-path';
      buildingId: string;
    };

export function findIndoorRoute(
  buildingId: string,
  fromNodeId: string,
  toNodeId: string,
): IndoorGuidance {
  const building = INDOOR_BUILDING_BY_ID.get(buildingId);
  if (!building) return { ok: false, reason: 'no-indoor-data', buildingId };
  if (fromNodeId === toNodeId) return { ok: false, reason: 'same-node', buildingId };

  const from = nodeById(building, fromNodeId);
  const to = nodeById(building, toNodeId);
  if (!from || !to) return { ok: false, reason: 'unknown-node', buildingId };

  const edges = building.edges.flatMap((edge) => {
    const forward = { ...edge };
    const backward: IndoorEdge = { ...edge, from: edge.to, to: edge.from };
    return [forward, backward];
  });

  const distances = new Map<string, number>([[from.id, 0]]);
  const previous = new Map<string, { nodeId: string; edge: IndoorEdge }>();
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
    if (current === null || current === to.id) break;
    visited.add(current);

    for (const edge of edges) {
      if (edge.from !== current) continue;
      const candidate = currentDistance + edge.metres;
      const known = distances.get(edge.to);
      if (known === undefined || candidate < known) {
        distances.set(edge.to, candidate);
        previous.set(edge.to, { nodeId: current, edge });
      }
    }
  }

  if (!distances.has(to.id)) return { ok: false, reason: 'no-path', buildingId };

  const legs: IndoorLeg[] = [];
  let cursor = to.id;
  while (cursor !== from.id) {
    const step = previous.get(cursor);
    if (!step) return { ok: false, reason: 'no-path', buildingId };
    const legFrom = nodeById(building, step.nodeId);
    const legTo = nodeById(building, cursor);
    if (!legFrom || !legTo) return { ok: false, reason: 'unknown-node', buildingId };
    legs.unshift({ from: legFrom, to: legTo, edge: step.edge });
    cursor = step.nodeId;
  }

  return {
    ok: true,
    building,
    from,
    to,
    legs,
    metres: distances.get(to.id) ?? 0,
    floorsChanged: from.floor !== to.floor,
    provisional: building.survey !== 'surveyed',
  };
}

/** Human step for one leg, phrased from the edited dataset only. */
export function describeLeg(leg: IndoorLeg): string {
  const target = leg.to.label;
  if (leg.edge.kind === 'stairs') return `Take the stairs to ${target}`;
  if (leg.edge.kind === 'lift') return `Take the lift to ${target}`;
  if (leg.to.floor !== leg.from.floor) {
    return `Continue on floor ${leg.to.floor} to ${target}`;
  }
  return `Walk ${Math.round(leg.edge.metres)} m to ${target}`;
}

export const OUTDOOR_FALLBACK_NOTE =
  'Indoor waypoints are not surveyed for this building, so the app can only guide you to the building itself. Use the verified campus route, then follow the signs inside.';

/** Street distance between two places, used only to say how far the fallback is. */
export function approximateOutdoorMetres(fromId: string | null, toId: string): number | null {
  if (!fromId) return null;
  const from = LOCATION_BY_ID.get(fromId);
  const to = LOCATION_BY_ID.get(toId);
  if (!from || !to) return null;
  return distanceMetres(from.coordinates, to.coordinates);
}
