const express = require('express');
const careerRoutes = require('./career.routes');

/**
 * API Routes Index
 * Central routing configuration
 */

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Career Counseling API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount career routes
router.use('/career', careerRoutes);

module.exports = router;
