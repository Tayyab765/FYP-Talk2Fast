import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  testStartLimiter,
  answerSubmissionLimiter,
  generalLimiter
} from './rateLimitMiddleware.js';

describe('Rate Limiting Middleware', () => {
  describe('testStartLimiter', () => {
    it('should allow up to 5 requests per hour per user', async () => {
      const app = express();
      app.use(express.json());
      
      // Mock authentication middleware
      app.use((req, res, next) => {
        req.user = { userId: 'test-user-123' };
        next();
      });
      
      app.post('/test-start', testStartLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });

      // Make 5 requests - all should succeed
      for (let i = 0; i < 5; i++) {
        const response = await request(app).post('/test-start');
        expect(response.status).toBe(200);
      }

      // 6th request should be rate limited
      const response = await request(app).post('/test-start');
      expect(response.status).toBe(429);
      expect(response.body.error).toBe('Too many requests');
    });

    it('should return proper error response when rate limited', async () => {
      const app = express();
      app.use(express.json());
      
      app.use((req, res, next) => {
        req.user = { userId: 'test-user-456' };
        next();
      });
      
      app.post('/test-start', testStartLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });

      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        await request(app).post('/test-start');
      }

      // Check rate limited response
      const response = await request(app).post('/test-start');
      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe('Too many requests');
    });

    it('should include RateLimit headers', async () => {
      const app = express();
      app.use(express.json());
      
      app.use((req, res, next) => {
        req.user = { userId: 'test-user-789' };
        next();
      });
      
      app.post('/test-start', testStartLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app).post('/test-start');
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });
  });

  describe('answerSubmissionLimiter', () => {
    it('should have higher limit for answer submissions', async () => {
      const app = express();
      app.use(express.json());
      
      app.use((req, res, next) => {
        req.user = { userId: 'test-user-answer' };
        next();
      });
      
      app.put('/answer', answerSubmissionLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });

      // Make 10 requests - all should succeed (limit is 200)
      for (let i = 0; i < 10; i++) {
        const response = await request(app).put('/answer');
        expect(response.status).toBe(200);
      }
    });
  });

  describe('generalLimiter', () => {
    it('should allow requests with general rate limit', async () => {
      const app = express();
      app.use(express.json());
      
      app.use((req, res, next) => {
        req.user = { userId: 'test-user-general' };
        next();
      });
      
      app.get('/general', generalLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });

      // Make 10 requests - all should succeed (limit is 100)
      for (let i = 0; i < 10; i++) {
        const response = await request(app).get('/general');
        expect(response.status).toBe(200);
      }
    });

    it('should use guestId for guest users', async () => {
      const app = express();
      app.use(express.json());
      
      app.use((req, res, next) => {
        req.user = { guestId: 'guest-123' };
        next();
      });
      
      app.get('/general', generalLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app).get('/general');
      expect(response.status).toBe(200);
    });

    it('should fall back to IP address when no user info', async () => {
      const app = express();
      app.use(express.json());
      
      app.get('/general', generalLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app).get('/general');
      expect(response.status).toBe(200);
    });
  });
});
