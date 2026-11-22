import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// Send Phone or Email OTP
router.post('/otp/send', (req: Request, res: Response) => {
  const { target, type } = req.body;
  if (!target || !type || (type !== 'email' && type !== 'phone')) {
    return res.status(400).json({ success: false, message: 'Valid target and type (email|phone) are required.' });
  }

  const result = AuthService.generateOtp(target, type);
  if (!result.success) {
    return res.status(429).json(result);
  }
  return res.json(result);
});

// Verify OTP
router.post('/otp/verify', (req: Request, res: Response) => {
  const { target, code } = req.body;
  if (!target || !code) {
    return res.status(400).json({ success: false, message: 'Target and code are required.' });
  }

  const result = AuthService.verifyOtp(target, code);
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// Strict MCE Registration
router.post('/register', async (req: Request, res: Response) => {
  const { fullName, institutionalId, officialEmail, phone, password } = req.body;

  if (!fullName || !institutionalId || !officialEmail || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Full name, institutional ID (USN/Employee ID), official email, and phone number are required.'
    });
  }

  const result = await AuthService.registerUser({
    fullName,
    institutionalId,
    officialEmail,
    phone,
    password
  });

  if (!result.success) {
    return res.status(403).json(result);
  }

  return res.status(201).json(result);
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Identifier (Email, USN or Phone) is required.' });
  }

  const result = await AuthService.login(identifier, password);
  if (!result.success) {
    return res.status(401).json(result);
  }

  return res.json(result);
});

// Google Sign-In with mandatory MCE verification linkage
router.post('/google', async (req: Request, res: Response) => {
  const { googleId, email, name, institutionalId } = req.body;

  if (!googleId || !email) {
    return res.status(400).json({ success: false, message: 'Google credentials are required.' });
  }

  const result = await AuthService.googleSignIn({
    googleId,
    email,
    name: name || 'Google User',
    institutionalId
  });

  if (!result.success) {
    return res.status(result.needsLinkage ? 200 : 403).json(result);
  }

  return res.json(result);
});

// Current User Profile
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    user: req.user
  });
});

export default router;
