import { db } from '../data/database';
import { NavigationNode, NavigationEdge, RouteResult, RouteStep } from '../models/types';

interface GraphEdge {
  toNodeId: string;
  weight: number;
  edge: NavigationEdge;
}

export class NavigationService {
  /**
   * Calculate distance between two coordinates in meters using Haversine formula
   */
  public static haversineMeters(coord1: [number, number], coord2: [number, number]): number {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Find nearest navigation node to a geographic coordinate
   */
  public static findNearestNode(
    coord: [number, number],
    filterOptions?: { buildingId?: string; floor?: number; accessibleOnly?: boolean }
  ): NavigationNode | null {
    let nearest: NavigationNode | null = null;
    let minDistance = Infinity;

    for (const node of db.nodes.values()) {
      if (filterOptions?.buildingId && node.buildingId !== filterOptions.buildingId) continue;
      if (filterOptions?.floor !== undefined && node.floor !== filterOptions.floor) continue;
      if (filterOptions?.accessibleOnly && !node.isAccessible) continue;

      const dist = this.haversineMeters(coord, node.coordinates);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = node;
      }
    }

    return nearest;
  }

  /**
   * Build adjacency list considering routing modes (shortest, easiest, accessible) and blockages
   */
  private static buildAdjacencyList(mode: 'shortest' | 'easiest' | 'accessible'): Map<string, GraphEdge[]> {
    const adj = new Map<string, GraphEdge[]>();

    for (const node of db.nodes.values()) {
      adj.set(node.id, []);
    }

    for (const edge of db.edges.values()) {
      // Skip blocked pathways
      if (edge.isBlocked) continue;

      // In accessible mode, skip non-accessible edges and stairs
      if (mode === 'accessible') {
        if (!edge.isAccessible || edge.isStairs) continue;
      }

      let weight = edge.distanceMeters;

      if (mode === 'easiest') {
        // Penalize stairs significantly in easiest mode, prefer elevators and wide corridors
        if (edge.isStairs) weight *= 2.5;
        if (edge.isElevator) weight *= 0.8;
      }

      // Add bi-directional edges for campus walkways
      const listFrom = adj.get(edge.fromNodeId);
      if (listFrom) listFrom.push({ toNodeId: edge.toNodeId, weight, edge });

      const listTo = adj.get(edge.toNodeId);
      if (listTo) listTo.push({ toNodeId: edge.fromNodeId, weight, edge });
    }

    return adj;
  }

  /**
   * Compute route using A* / Dijkstra algorithm
   */
  public static computeRoute(
    fromNodeId: string,
    toNodeId: string,
    mode: 'shortest' | 'easiest' | 'accessible' = 'shortest'
  ): RouteResult | null {
    const startNode = db.nodes.get(fromNodeId);
    const endNode = db.nodes.get(toNodeId);

    if (!startNode || !endNode) return null;
    if (fromNodeId === toNodeId) {
      return {
        routeMode: mode,
        totalDistanceMeters: 0,
        estimatedWalkingMinutes: 0,
        steps: [
          {
            instruction: `You are already at your destination: ${endNode.name}.`,
            distanceMeters: 0,
            durationSeconds: 0,
            fromNodeId,
            toNodeId
          }
        ],
        pathNodes: [startNode],
        pathCoordinates: [startNode.coordinates],
        isAccessible: startNode.isAccessible,
        indoorLegsCount: 0,
        floorTransitions: 0
      };
    }

    const adj = this.buildAdjacencyList(mode);
    const distances = new Map<string, number>();
    const previous = new Map<string, { nodeId: string; edge: NavigationEdge }>();
    const openSet = new Set<string>();

    for (const node of db.nodes.values()) {
      distances.set(node.id, Infinity);
    }

    distances.set(fromNodeId, 0);
    openSet.add(fromNodeId);

    while (openSet.size > 0) {
      // Pick node with lowest f-score (g + heuristic)
      let currentId: string | null = null;
      let minScore = Infinity;

      for (const id of openSet) {
        const g = distances.get(id) ?? Infinity;
        const currentNode = db.nodes.get(id);
        const h = currentNode ? this.haversineMeters(currentNode.coordinates, endNode.coordinates) : 0;
        const f = g + h;

        if (f < minScore) {
          minScore = f;
          currentId = id;
        }
      }

      if (!currentId) break;
      if (currentId === toNodeId) break;

      openSet.delete(currentId);
      const currentDist = distances.get(currentId) ?? 0;
      const neighbors = adj.get(currentId) || [];

      for (const neighbor of neighbors) {
        const tentativeG = currentDist + neighbor.weight;
        if (tentativeG < (distances.get(neighbor.toNodeId) ?? Infinity)) {
          distances.set(neighbor.toNodeId, tentativeG);
          previous.set(neighbor.toNodeId, { nodeId: currentId, edge: neighbor.edge });
          openSet.add(neighbor.toNodeId);
        }
      }
    }

    // Reconstruct path
    const pathNodeIds: string[] = [];
    const usedEdges: NavigationEdge[] = [];
    let curr = toNodeId;

    if (!previous.has(toNodeId)) {
      return null; // No route found (due to blockage or accessibility barrier)
    }

    pathNodeIds.unshift(curr);
    while (previous.has(curr)) {
      const step = previous.get(curr)!;
      usedEdges.unshift(step.edge);
      curr = step.nodeId;
      pathNodeIds.unshift(curr);
    }

    const pathNodes = pathNodeIds.map(id => db.nodes.get(id)!);
    const pathCoordinates = pathNodes.map(n => n.coordinates);

    // Compute detailed turn-by-turn guidance and voice prompts
    const steps: RouteStep[] = [];
    let totalDistance = 0;
    let indoorLegs = 0;
    let floorTransitions = 0;
    let isEntirelyAccessible = true;

    for (let i = 0; i < pathNodes.length - 1; i++) {
      const fromN = pathNodes[i];
      const toN = pathNodes[i + 1];
      const edge = usedEdges[i];

      const dist = edge.distanceMeters;
      totalDistance += dist;
      if (edge.isIndoor) indoorLegs++;
      if (!edge.isAccessible) isEntirelyAccessible = false;

      let instruction = '';
      let floorTransitionInfo: RouteStep['floorTransition'] | undefined;

      if (fromN.floor !== undefined && toN.floor !== undefined && fromN.floor !== toN.floor) {
        floorTransitions++;
        const method = edge.isElevator ? 'elevator' : 'stairs';
        instruction = `Take the ${method} from Floor ${fromN.floor} to Floor ${toN.floor} (${toN.name}).`;
        floorTransitionInfo = {
          fromFloor: fromN.floor,
          toFloor: toN.floor,
          method
        };
      } else if (toN.type === 'building_entrance') {
        instruction = `Enter ${toN.name}. Follow corridor signage.`;
      } else if (toN.type === 'room_entrance') {
        instruction = `Arrived at ${toN.name}. Destination reached on your immediate path.`;
      } else if (fromN.type === 'outdoor_gate') {
        instruction = `Proceed through ${fromN.name} onto the main campus avenue towards ${toN.name} (${dist}m).`;
      } else {
        instruction = `Walk ${dist}m along paved path towards ${toN.name}.`;
      }

      steps.push({
        instruction,
        distanceMeters: dist,
        durationSeconds: Math.round(dist / 1.2), // Standard campus walking speed 1.2 m/s
        fromNodeId: fromN.id,
        toNodeId: toN.id,
        floorTransition: floorTransitionInfo,
        landmark: toN.buildingId ? db.buildings.get(toN.buildingId)?.name : undefined
      });
    }

    // Walking speed: 1.2 m/s (~72 m/min)
    const estimatedMinutes = Math.max(1, Math.round(totalDistance / 72));

    return {
      routeMode: mode,
      totalDistanceMeters: totalDistance,
      estimatedWalkingMinutes: estimatedMinutes,
      steps,
      pathNodes,
      pathCoordinates,
      isAccessible: isEntirelyAccessible,
      indoorLegsCount: indoorLegs,
      floorTransitions
    };
  }
}
