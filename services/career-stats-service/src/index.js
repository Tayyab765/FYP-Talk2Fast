import express from 'express';
import cors from 'cors';
import { getCareers, searchCareersByQuery, getStats } from './controllers/careerController.js';

import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/careers', getCareers);
app.get('/api/careers/search', searchCareersByQuery);
app.get('/api/careers/stats', getStats);

const port = process.env.PORT || 5004;
app.listen(port, () => {
  console.log(`🚀 Career Service listening on port ${port}`);
});