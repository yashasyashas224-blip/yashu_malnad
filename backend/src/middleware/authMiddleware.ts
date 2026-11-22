import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { db } from '../data/database';
import { User } from '../models/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Only verified Malnad College of Engineering members may access this resource.'
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = AuthService.verifyToken(token);

  if (!payload || !payload.id) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication session. Please sign in again.'
    });
  }

  const user = db.users.get(payload.id);
  if (!user) {
    return res.status(403).json({
      success: false,
      message: 'User account not found in active MCE registry.'
    });
  }

  if (user.verificationStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Your MCE membership verification status is: ${user.verificationStatus}.`
    });
  }

  req.user = user;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || (req.user.role !== 'campus_admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Administrative privileges required for this action.'
      });
    }
    next();
  });
}
