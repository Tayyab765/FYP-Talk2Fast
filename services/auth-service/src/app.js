import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import { logger } from './utils/logger.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes - mounted at root because gateway forwards with /api/auth prefix
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => res.json({ ok: true, service: 'auth' }));

export default app;
