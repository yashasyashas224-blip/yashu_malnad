import { Router, Request, Response } from 'express';
import { db } from '../data/database';
import { NavigationService } from '../services/navigationService';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Get all navigation nodes
router.get('/nodes', (_req: Request, res: Response) => {
  const nodes = Array.from(db.nodes.values());
  res.json({ success: true, count: nodes.length, nodes });
});

// Get all navigation edges
router.get('/edges', (_req: Request, res: Response) => {
  const edges = Array.from(db.edges.values());
  res.json({ success: true, count: edges.length, edges });
});

// Calculate route between nodes, buildings, rooms or coordinates
router.post('/route', (req: Request, res: Response) => {
  const { fromNodeId, toNodeId, fromCoordinates, toCoordinates, mode = 'shortest' } = req.body;

  let startNodeId = fromNodeId;
  let endNodeId = toNodeId;

  // Resolve start node if it's a building or room ID
  if (startNodeId && !db.nodes.has(startNodeId)) {
    const bldg = db.buildings.get(startNodeId);
    const room = db.rooms.get(startNodeId);
    const coords = bldg ? bldg.coordinates : (room ? room.coordinates : undefined);
    if (coords) {
      const nearest = NavigationService.findNearestNode(coords);
      if (nearest) startNodeId = nearest.id;
    }
  }

  // Resolve end node if it's a building or room ID
  if (endNodeId && !db.nodes.has(endNodeId)) {
    const bldg = db.buildings.get(endNodeId);
    const room = db.rooms.get(endNodeId);
    const coords = bldg ? bldg.coordinates : (room ? room.coordinates : undefined);
    if (coords) {
      const nearest = NavigationService.findNearestNode(coords);
      if (nearest) endNodeId = nearest.id;
    }
  }

  if (!startNodeId && fromCoordinates) {
    const nearestStart = NavigationService.findNearestNode(fromCoordinates);
    if (nearestStart) startNodeId = nearestStart.id;
  }

  if (!endNodeId && toCoordinates) {
    const nearestEnd = NavigationService.findNearestNode(toCoordinates);
    if (nearestEnd) endNodeId = nearestEnd.id;
  }

  if (!startNodeId || !endNodeId) {
    return res.status(400).json({
      success: false,
      message: 'Both origin and destination nodes (or valid coordinates/locations) are required.'
    });
  }

  const result = NavigationService.computeRoute(startNodeId, endNodeId, mode);

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'No feasible path found between these locations under current campus constraints (pathway may be blocked or stair-free path unavailable).'
    });
  }

  return res.json({
    success: true,
    route: result
  });
});

// Find nearest node to a given GPS coordinate
router.post('/nearest', (req: Request, res: Response) => {
  const { coordinates, accessibleOnly } = req.body;
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return res.status(400).json({ success: false, message: 'Valid [lng, lat] coordinate array required.' });
  }

  const nearest = NavigationService.findNearestNode(coordinates as [number, number], { accessibleOnly });
  if (!nearest) {
    return res.status(404).json({ success: false, message: 'No campus navigation node found in range.' });
  }

  const distMeters = NavigationService.haversineMeters(coordinates as [number, number], nearest.coordinates);

  return res.json({
    success: true,
    node: nearest,
    distanceMeters: distMeters
  });
});

// Resolve QR Checkpoint code (for indoor positioning)
router.post('/qr/scan', (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'QR Checkpoint code is required.' });
  }

  const checkpoint = Array.from(db.qrCheckpoints.values()).find(
    q => q.code.toUpperCase() === code.trim().toUpperCase() || q.id === code.trim()
  );

  if (!checkpoint) {
    return res.status(404).json({
      success: false,
      message: 'Unrecognized MCE checkpoint code. Please scan an authorized campus marker.'
    });
  }

  const node = db.nodes.get(checkpoint.nodeId);
  const building = db.buildings.get(checkpoint.buildingId);

  return res.json({
    success: true,
    checkpoint,
    node,
    building,
    floor: checkpoint.floor,
    locationName: checkpoint.locationName
  });
});

export default router;
