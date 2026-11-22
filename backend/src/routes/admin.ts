import { Router, Request, Response } from 'express';
import { db } from '../data/database';
import { requireAdmin, AuthenticatedRequest } from '../middleware/authMiddleware';
import { NavigationNode, NavigationEdge, QRCheckpoint, CampusBuilding, RoomLocation } from '../models/types';

const router = Router();

// 1. Get verification requests & all users
router.get('/users', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = Array.from(db.users.values());
  res.json({
    success: true,
    count: users.length,
    users
  });
});

// Update user status (approve / suspend / activate)
router.post('/users/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = db.users.get(userId);
  const { status, role } = req.body;

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const prevStatus = user.verificationStatus;
  if (status) user.verificationStatus = status;
  if (role) user.role = role;
  user.updatedAt = new Date().toISOString();
  db.saveToFile();

  db.addAuditLog(
    req.user!.id,
    req.user!.name,
    'UPDATE_USER_STATUS',
    'User',
    user.id,
    `Status changed from ${prevStatus} to ${status || prevStatus}. Role: ${user.role}`
  );

  return res.json({
    success: true,
    message: `User ${user.name} status updated to ${user.verificationStatus}.`,
    user
  });
});

// 2. Visual Campus Map Editor - Add/Update Navigation Node
router.post('/map/node', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id, name, type, coordinates, buildingId, floor, isAccessible } = req.body;

  if (!name || !type || !coordinates || coordinates.length !== 2) {
    return res.status(400).json({ success: false, message: 'Node name, type, and [lng, lat] coordinates are required.' });
  }

  const nodeId = id || `node-custom-${Date.now()}`;
  const newNode: NavigationNode = {
    id: nodeId,
    name,
    type,
    coordinates: coordinates as [number, number],
    buildingId,
    floor: floor !== undefined ? Number(floor) : undefined,
    isAccessible: isAccessible !== undefined ? Boolean(isAccessible) : true
  };

  db.nodes.set(nodeId, newNode);
  db.saveToFile();

  db.addAuditLog(
    req.user!.id,
    req.user!.name,
    id ? 'UPDATE_MAP_NODE' : 'ADD_MAP_NODE',
    'NavigationNode',
    nodeId,
    `Node "${name}" at [${coordinates.join(', ')}]`
  );

  return res.json({ success: true, message: 'Navigation node saved.', node: newNode });
});

// Delete Navigation Node
router.delete('/map/node/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const nodeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!db.nodes.has(nodeId)) {
    return res.status(404).json({ success: false, message: 'Node not found.' });
  }

  db.nodes.delete(nodeId);
  // Remove associated edges
  for (const [eId, edge] of db.edges.entries()) {
    if (edge.fromNodeId === nodeId || edge.toNodeId === nodeId) {
      db.edges.delete(eId);
    }
  }
  db.saveToFile();

  db.addAuditLog(req.user!.id, req.user!.name, 'DELETE_MAP_NODE', 'NavigationNode', nodeId, 'Node deleted');
  return res.json({ success: true, message: 'Node and connected edges removed.' });
});

// Visual Campus Map Editor - Add/Update Walking Path (Edge)
router.post('/map/edge', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id, fromNodeId, toNodeId, distanceMeters, isIndoor, isAccessible, isStairs, isElevator } = req.body;

  if (!fromNodeId || !toNodeId || !distanceMeters) {
    return res.status(400).json({ success: false, message: 'FromNode, ToNode, and distanceMeters are required.' });
  }

  const edgeId = id || `edge-custom-${Date.now()}`;
  const newEdge: NavigationEdge = {
    id: edgeId,
    fromNodeId,
    toNodeId,
    distanceMeters: Number(distanceMeters),
    isIndoor: Boolean(isIndoor),
    isAccessible: Boolean(isAccessible),
    isStairs: Boolean(isStairs),
    isElevator: Boolean(isElevator),
    isBlocked: false
  };

  db.edges.set(edgeId, newEdge);
  db.saveToFile();

  db.addAuditLog(
    req.user!.id,
    req.user!.name,
    id ? 'UPDATE_MAP_EDGE' : 'ADD_MAP_EDGE',
    'NavigationEdge',
    edgeId,
    `Edge between ${fromNodeId} and ${toNodeId} (${distanceMeters}m)`
  );

  return res.json({ success: true, message: 'Pathway edge saved.', edge: newEdge });
});

// Toggle Pathway Blocked / Closed status (Construction, Maintenance, Obstacle)
router.post('/map/edge/block', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { edgeId, isBlocked, blockedReason } = req.body;
  const edge = db.edges.get(edgeId);

  if (!edge) {
    return res.status(404).json({ success: false, message: 'Edge not found.' });
  }

  edge.isBlocked = Boolean(isBlocked);
  edge.blockedReason = isBlocked ? (blockedReason || 'Temporarily closed for maintenance') : undefined;
  db.saveToFile();

  db.addAuditLog(
    req.user!.id,
    req.user!.name,
    isBlocked ? 'BLOCK_PATHWAY' : 'UNBLOCK_PATHWAY',
    'NavigationEdge',
    edgeId,
    `Path ${edgeId} blocked=${isBlocked}. Reason: ${edge.blockedReason || 'None'}`
  );

  return res.json({
    success: true,
    message: isBlocked ? 'Pathway marked as blocked. Routing engine will detour around it.' : 'Pathway reopened.',
    edge
  });
});

// Add / Update Campus Building
router.post('/map/building', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id, name, shortCode, category, description, coordinates, floorsCount, verificationStatus, verificationNotes } = req.body;

  if (!name || !shortCode || !coordinates || coordinates.length !== 2) {
    return res.status(400).json({ success: false, message: 'Name, shortCode, and coordinates are required.' });
  }

  const bId = id || `b-${shortCode.toLowerCase()}-${Date.now()}`;
  const building: CampusBuilding = {
    id: bId,
    name,
    shortCode,
    category: category || 'academic',
    description: description || '',
    coordinates: coordinates as [number, number],
    floorsCount: Number(floorsCount) || 1,
    accessibility: {
      wheelchairRamp: true,
      elevators: false,
      tactilePaving: false,
      accessibleWashrooms: true
    },
    verificationStatus: verificationStatus || 'verified',
    verificationNotes
  };

  db.buildings.set(bId, building);
  db.saveToFile();

  db.addAuditLog(req.user!.id, req.user!.name, 'UPDATE_BUILDING', 'CampusBuilding', bId, `Building ${name}`);
  return res.json({ success: true, message: 'Campus building updated.', building });
});

// Publish Verified Map Version
router.post('/map/publish', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { notes } = req.body;
  const newVerNumber = db.mapVersions.length + 1;

  const versionRecord = {
    version: newVerNumber,
    publishedAt: new Date().toISOString(),
    publishedBy: req.user!.name,
    notes: notes || `MCE Hassan campus map update v${newVerNumber}`,
    nodesCount: db.nodes.size,
    edgesCount: db.edges.size
  };

  db.mapVersions.unshift(versionRecord);
  db.saveToFile();

  db.addAuditLog(
    req.user!.id,
    req.user!.name,
    'PUBLISH_MAP_VERSION',
    'MapVersion',
    `v${newVerNumber}`,
    `Published version ${newVerNumber} with ${db.nodes.size} nodes and ${db.edges.size} edges.`
  );

  return res.json({
    success: true,
    message: `Campus map version ${newVerNumber} published successfully.`,
    version: versionRecord
  });
});

// Get Map Revisions
router.get('/map/versions', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, versions: db.mapVersions });
});

// Get Audit Logs
router.get('/audit-logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, count: db.auditLogs.length, logs: db.auditLogs });
});

// Analytics Dashboard
router.get('/analytics', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    analytics: {
      registeredStudents: Array.from(db.users.values()).filter(u => u.role === 'student').length,
      verifiedUsersCount: Array.from(db.users.values()).filter(u => u.verificationStatus === 'verified').length,
      totalBuildings: db.buildings.size,
      verifiedBuildings: Array.from(db.buildings.values()).filter(b => b.verificationStatus === 'verified').length,
      pendingVerificationBuildings: Array.from(db.buildings.values()).filter(b => b.verificationStatus === 'needs_verification').length,
      navigationNodesCount: db.nodes.size,
      navigationEdgesCount: db.edges.size,
      activeBlockedPathsCount: Array.from(db.edges.values()).filter(e => e.isBlocked).length,
      popularDestinations: [
        { name: 'Computer Science & AI Complex', searches: 1420 },
        { name: 'Autonomous Examination Section', searches: 980 },
        { name: 'Central Library & Digital Centre', searches: 890 },
        { name: 'ME-RIISE Foundation', searches: 730 },
        { name: 'Campus Canteen', searches: 640 },
        { name: 'Civil Engineering Testing Labs', searches: 490 }
      ],
      routeCompletionRate: 98.4,
      systemUptimePercent: 99.98
    }
  });
});

// Generate Printable QR Code Checkpoints Manifest
router.get('/qr/manifest', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const checkpoints = Array.from(db.qrCheckpoints.values());
  res.json({
    success: true,
    count: checkpoints.length,
    checkpoints: checkpoints.map(c => ({
      ...c,
      qrPayloadUrl: `mce-nav://checkpoint?code=${encodeURIComponent(c.code)}`,
      printLabel: `MALNAD COLLEGE OF ENGINEERING - CAMPUS CHECKPOINT: ${c.code} (${c.locationName})`
    }))
  });
});

export default router;
