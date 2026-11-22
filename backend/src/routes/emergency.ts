import { Router, Request, Response } from 'express';
import { db } from '../data/database';
import { NavigationService } from '../services/navigationService';

const router = Router();

// Emergency locations list
router.get('/locations', (_req: Request, res: Response) => {
  const emergencyLocations = [
    {
      id: 'em-health',
      name: 'Campus Health Centre & First Aid Clinic',
      type: 'medical',
      description: 'First aid, nursing, emergency doctor cabin & stretcher dispatch',
      contactPhone: '+91 8172 245082 (Ext. 210)',
      nodeId: 'room-health-clinic',
      coordinates: [76.10220, 13.02335]
    },
    {
      id: 'em-security',
      name: 'Salagame Road Main Security Gate',
      type: 'security',
      description: '24/7 Campus Security Post & Emergency Vehicular Exit',
      contactPhone: '+91 8172 245082 (Main Gate)',
      nodeId: 'node-gate-salagame',
      coordinates: [76.10185, 13.02380]
    },
    {
      id: 'em-assembly',
      name: 'Central Academic Lawn Emergency Assembly Area',
      type: 'assembly_point',
      description: 'Designated safe open-air evacuation zone in event of fire or earthquake',
      nodeId: 'node-emergency-assembly',
      coordinates: [76.10300, 13.02390]
    }
  ];

  res.json({
    success: true,
    emergencyHotlines: [
      { service: 'MCE Security Control', phone: '+91 8172 245082' },
      { service: 'Hassan District Ambulance', phone: '108' },
      { service: 'Hassan City Police Control', phone: '112' }
    ],
    locations: emergencyLocations
  });
});

// Fast route to nearest emergency facility
router.post('/route-nearest', (req: Request, res: Response) => {
  const { currentCoordinates, type = 'medical' } = req.body;
  if (!currentCoordinates || !Array.isArray(currentCoordinates)) {
    return res.status(400).json({ success: false, message: 'Valid [lng, lat] coordinates required.' });
  }

  const startNode = NavigationService.findNearestNode(currentCoordinates as [number, number]);
  if (!startNode) {
    return res.status(400).json({ success: false, message: 'Could not determine your location.' });
  }

  const targetNodeId = type === 'medical' ? 'room-health-clinic' : 'node-emergency-assembly';
  const route = NavigationService.computeRoute(startNode.id, targetNodeId, 'shortest');

  return res.json({
    success: true,
    destination: type === 'medical' ? 'Campus Health Centre' : 'Emergency Assembly Area',
    route
  });
});

export default router;
