import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import campusRoutes from './routes/campus';
import navigationRoutes from './routes/navigation';
import searchRoutes from './routes/search';
import aiRoutes from './routes/ai';
import timetableRoutes from './routes/timetable';
import emergencyRoutes from './routes/emergency';
import locationShareRoutes from './routes/locationshare';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration supporting mobile clients and web dashboards
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Request Logger
app.use((req, _res, next) => {
  console.log(`[MCE Server] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Root Health & System Status
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    system: 'Malnad College of Engineering (MCE) Smart Campus Navigator Backend',
    location: 'Hassan, Karnataka, India',
    coordinates: [76.10354, 13.02365],
    campusAreaAcres: 41.28,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/share', locationShareRoutes);
app.use('/api/admin', adminRoutes);

// Static Asset Serving (Production & Unified Access)
const adminDistPath = path.resolve(__dirname, '../../admin/dist');
const clientDistPath = path.resolve(__dirname, '../../client/dist');

app.use('/admin', express.static(adminDistPath));
app.use('/admin', (_req: Request, res: Response) => {
  res.sendFile(path.join(adminDistPath, 'index.html'));
});

app.use(express.static(clientDistPath));
app.use((req: Request, res: Response, next: any) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('[MCE Server Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error in MCE Navigation backend.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server if directly executed
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`==================================================================`);
    console.log(`🏛️ MALNAD COLLEGE OF ENGINEERING (MCE), HASSAN`);
    console.log(`📍 Intelligent Campus Navigation Platform API Server`);
    console.log(`🚀 Server listening on port: ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`==================================================================`);
  });
}

export default app;
