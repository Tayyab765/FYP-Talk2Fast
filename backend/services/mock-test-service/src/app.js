import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger.js';
import mockTestRoutes from './routes/mockTestRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - user=${req.user?.userId ?? 'anon'}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) =>
  res.json({ ok: true, service: 'mock-test', timestamp: new Date().toISOString() })
);

// Mock Test API routes
app.use('/api/mock-tests', mockTestRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

export default app;

