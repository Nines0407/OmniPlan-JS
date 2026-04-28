import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import http from 'http';

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import targetRoutes from './routes/targets';
import taskRoutes from './routes/tasks';
import milestoneRoutes from './routes/milestones';
import statsRoutes from './routes/stats';
import { initWebSocket } from './websocket/index';
import { startBackupScheduler } from './utils/backup';

const app = express();
const PORT = process.env.PORT || 3000;
const isTest = process.env.NODE_ENV === 'test';

app.use(cors());
app.use(express.json());

// Health check (must be before other /api routes)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rate limiting for write operations
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: 'Too many requests, please try again later' },
  skip: () => isTest,
});

app.use('/api/auth', rateLimit({ windowMs: 60 * 1000, max: 20, skip: () => isTest }));
app.use('/api', (req, _res, next) => {
  if (['POST', 'PATCH', 'DELETE'].includes(req.method)) {
    writeLimiter(req, _res, next);
  } else {
    next();
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', targetRoutes);
app.use('/api', taskRoutes);
app.use('/api', milestoneRoutes);
app.use('/api', statsRoutes);

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const server = http.createServer(app);
initWebSocket(server);

// Start backup scheduler only in non-test environment
if (!isTest) {
  startBackupScheduler();
}

server.listen(PORT, () => {
  console.warn(`[OmniPlan Server] running on http://localhost:${PORT}`);
});

export { app, server };
