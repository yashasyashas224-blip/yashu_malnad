import { Router, Request, Response } from 'express';
import { db } from '../data/database';
import { MCE_CAMPUS_META, MCE_CAMPUS_BOUNDARY, MCE_DEPARTMENTS } from '../data/mceCampusData';

const router = Router();

// Institutional & Geographic Metadata
router.get('/meta', (_req: Request, res: Response) => {
  res.json({
    success: true,
    meta: MCE_CAMPUS_META,
    boundary: MCE_CAMPUS_BOUNDARY
  });
});

// All Campus Buildings
router.get('/buildings', (_req: Request, res: Response) => {
  const buildings = Array.from(db.buildings.values());
  res.json({
    success: true,
    count: buildings.length,
    buildings
  });
});

// Specific Building by ID
router.get('/buildings/:id', (req: Request, res: Response) => {
  const buildingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const building = db.buildings.get(buildingId);
  if (!building) {
    return res.status(404).json({ success: false, message: 'Building not found.' });
  }

  const rooms = Array.from(db.rooms.values()).filter(r => r.buildingId === building.id);
  const departments = MCE_DEPARTMENTS.filter(d => d.buildingId === building.id);

  return res.json({
    success: true,
    building,
    rooms,
    departments
  });
});

// Departments
router.get('/departments', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: MCE_DEPARTMENTS.length,
    departments: MCE_DEPARTMENTS
  });
});

// Rooms & Facilities
router.get('/rooms', (req: Request, res: Response) => {
  const { buildingId, floor, category } = req.query;
  let rooms = Array.from(db.rooms.values());

  if (buildingId) {
    rooms = rooms.filter(r => r.buildingId === String(buildingId));
  }
  if (floor !== undefined) {
    rooms = rooms.filter(r => r.floor === Number(floor));
  }
  if (category) {
    rooms = rooms.filter(r => r.category === String(category));
  }

  res.json({
    success: true,
    count: rooms.length,
    rooms
  });
});

// Full Campus GeoJSON FeatureCollection for MapLibre
router.get('/geojson', (_req: Request, res: Response) => {
  const features: any[] = [];

  // Campus Boundary
  features.push({
    type: 'Feature',
    properties: {
      type: 'boundary',
      name: 'Malnad College of Engineering Boundary (41.28 Acres)',
      osmWayId: MCE_CAMPUS_META.osmWayId
    },
    geometry: {
      type: 'Polygon',
      coordinates: [MCE_CAMPUS_BOUNDARY]
    }
  });

  // Buildings Points
  for (const b of db.buildings.values()) {
    features.push({
      type: 'Feature',
      properties: {
        type: 'building',
        id: b.id,
        name: b.name,
        shortCode: b.shortCode,
        category: b.category,
        floorsCount: b.floorsCount,
        verificationStatus: b.verificationStatus
      },
      geometry: {
        type: 'Point',
        coordinates: b.coordinates
      }
    });
  }

  // Walking paths (edges)
  for (const edge of db.edges.values()) {
    const from = db.nodes.get(edge.fromNodeId);
    const to = db.nodes.get(edge.toNodeId);
    if (from && to && !edge.isIndoor) {
      features.push({
        type: 'Feature',
        properties: {
          type: 'walkway',
          id: edge.id,
          distanceMeters: edge.distanceMeters,
          isAccessible: edge.isAccessible,
          isBlocked: edge.isBlocked,
          blockedReason: edge.blockedReason
        },
        geometry: {
          type: 'LineString',
          coordinates: [from.coordinates, to.coordinates]
        }
      });
    }
  }

  res.json({
    type: 'FeatureCollection',
    features
  });
});

export default router;
