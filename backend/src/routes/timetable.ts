import { Router, Request, Response } from 'express';
import { db } from '../data/database';
import { AuthService } from '../services/authService';

const router = Router();

// Student's Timetable / Schedule (Supports authenticated student or campus visitor demo preview)
router.get('/my', (req: Request, res: Response) => {
  let semester = 6;
  let section = 'A';
  let isGuest = true;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = db.users.get(token) || null;
    // or verify token
    const verified = AuthService.verifyToken(token);
    if (verified && verified.id) {
      const u = db.users.get(verified.id);
      if (u) {
        semester = u.semester || 6;
        section = u.section || 'A';
        isGuest = false;
      }
    }
  }

  const schedule = db.schedules.filter(s => s.semester === semester && s.section === section);

  // Identify next class based on current system time
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[now.getDay()];
  const currentHours = now.getHours().toString().padStart(2, '0');
  const currentMinutes = now.getMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  const todaysClasses = schedule.filter(s => s.dayOfWeek.toLowerCase() === todayName.toLowerCase());
  let nextClass = todaysClasses.find(s => s.startTime >= currentTimeStr);
  if (!nextClass && todaysClasses.length > 0) {
    nextClass = todaysClasses[0]; // loop or show first
  }

  return res.json({
    success: true,
    day: todayName,
    currentTime: currentTimeStr,
    schedule: todaysClasses.length > 0 ? todaysClasses : schedule,
    nextClass: nextClass || schedule[0] || null
  });
});

export default router;
