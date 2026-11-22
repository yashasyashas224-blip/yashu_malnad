import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../data/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// Create a time-limited location sharing session
router.post('/create', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { coordinates, locationDescription, durationMinutes = 30 } = req.body;

  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return res.status(400).json({ success: false, message: 'Current [lng, lat] coordinates are required.' });
  }

  const shareId = `share-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = Date.now() + Math.min(120, Math.max(5, durationMinutes)) * 60 * 1000;

  db.locationShares.set(shareId, {
    id: shareId,
    userId: req.user!.id,
    userName: req.user!.name,
    currentCoordinates: coordinates as [number, number],
    locationDescription: locationDescription || 'Campus Meeting Spot',
    expiresAt,
    isActive: true
  });

  return res.json({
    success: true,
    shareId,
    shareUrl: `/share/${shareId}`,
    expiresAt: new Date(expiresAt).toISOString(),
    message: `Location sharing active for ${durationMinutes} minutes.`
  });
});

// Get shared location details
router.get('/:id', (req: Request, res: Response) => {
  const shareId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const session = db.locationShares.get(shareId);

  if (!session || !session.isActive || Date.now() > session.expiresAt) {
    return res.status(404).json({
      success: false,
      message: 'This campus location share session has ended or expired.'
    });
  }

  return res.json({
    success: true,
    session: {
      userName: session.userName,
      currentCoordinates: session.currentCoordinates,
      locationDescription: session.locationDescription,
      expiresAt: new Date(session.expiresAt).toISOString()
    }
  });
});

// Stop sharing
router.post('/:id/stop', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const shareId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const session = db.locationShares.get(shareId);
  if (!session || session.userId !== req.user!.id) {
    return res.status(404).json({ success: false, message: 'Sharing session not found or unauthorized.' });
  }

  session.isActive = false;
  return res.json({ success: true, message: 'Location sharing session terminated.' });
});

export default router;
