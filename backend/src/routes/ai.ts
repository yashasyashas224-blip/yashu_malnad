import { Router, Request, Response } from 'express';
import { AIAssistantService } from '../services/aiAssistantService';

const router = Router();

router.post('/query', (req: Request, res: Response) => {
  const { query, semester } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, message: 'Natural language query string is required.' });
  }

  const result = AIAssistantService.processQuery(query, semester ? Number(semester) : 6);
  return res.json({
    success: true,
    result
  });
});

export default router;
