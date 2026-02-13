import 'dotenv/config';
import express from 'express';

import prisma from './lib/prisma.js';

import configRoutes from './routes/config.js';
import memoriesRoutes from './routes/memories.js';
import timelineRoutes from './routes/timeline.js';
import lettersRoutes from './routes/letters.js';
import couponsRoutes from './routes/coupons.js';
import statsRoutes from './routes/stats.js';
import uploadRoutes from './routes/upload.js';
import instagramRoutes from './routes/instagram.js';
import { antibotMiddleware } from './middleware/antibot.js';

const app = express();

/* =========================
   ✅ CORS (Manual Fix)
========================= */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow ALL origins
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

/* =========================
   Body
========================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* =========================
   Logger
========================= */
app.use((req, _res, next) => {
  console.log(req.method, req.path);
  next();
});

/* =========================
   AntiBot (หลัง CORS เท่านั้น)
========================= */
app.use('/api', antibotMiddleware);

/* =========================
   Routes
========================= */
app.use('/api/config', configRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/letters', lettersRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/instagram', instagramRoutes);

/* =========================
   Health
========================= */
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'db error' });
  }
});

/* =========================
   404
========================= */
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = parseInt(process.env.PORT || '4000', 10);

if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    try {
      await prisma.$connect();
      console.log('✅ Database connected');
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
    }
  };
  startServer();
}

export default app;