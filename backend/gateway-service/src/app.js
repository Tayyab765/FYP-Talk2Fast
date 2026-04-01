import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from './utils/logger.js';

const app = express();

// Middlewares
app.use(cors());

// Serve static assets (test page)
app.use(express.static('public'));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL || 'http://localhost:5002';
const CAREER_SERVICE_URL = process.env.CAREER_SERVICE_URL || 'http://localhost:5003';

// Proxy configuration
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    logger.error(`Proxy error: ${err.message}`);
    if (!res.headersSent) {
      res.status(503).json({ 
        error: 'Service unavailable', 
        message: 'The requested service is currently unavailable. Please try again later.' 
      });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying ${req.method} ${req.originalUrl} to ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`Proxy response: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
  }
};

// Route proxies - DO NOT parse body before proxying
// When mounted at /api/auth, the proxy sees only the remaining path
// e.g., /api/auth/signup becomes /signup, so we need to add /api/auth back
app.use('/api/auth', createProxyMiddleware({
  ...proxyOptions,
  target: AUTH_SERVICE_URL,
}));

// Mount strips /api/chatbot; some setups pass "/message", others full "/api/chatbot/message".
// Never double-prefix or we get 404 on the target service.
function rewriteServicePath(prefix) {
  return (path) => {
    if (path.startsWith(prefix)) return path;
    return prefix + (path.startsWith('/') ? path : `/${path}`);
  };
}

app.use('/api/chatbot', createProxyMiddleware({
  ...proxyOptions,
  target: CHATBOT_SERVICE_URL,
  pathRewrite: rewriteServicePath('/api/chatbot'),
}));

app.use('/api/career', createProxyMiddleware({
  ...proxyOptions,
  target: CAREER_SERVICE_URL,
  pathRewrite: rewriteServicePath('/api/career'),
}));

// Body parsing only for non-proxied routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Keep existing routes for backwards compatibility (transcription, mock tests, etc.)
// These will remain in the monolith until migrated

// Health check
app.get('/', (req, res) => res.json({ 
  ok: true, 
  service: 'gateway',
  routes: {
    auth: '/api/auth',
    chatbot: '/api/chatbot',
    career: '/api/career'
  }
}));

app.get('/health', (req, res) => res.json({ 
  ok: true, 
  service: 'gateway',
  services: {
    auth: AUTH_SERVICE_URL,
    chatbot: CHATBOT_SERVICE_URL,
    career: CAREER_SERVICE_URL
  }
}));

export default app;
