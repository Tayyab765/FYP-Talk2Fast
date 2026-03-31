import { listCareers, searchCareers, getSalaryStats } from '../services/careerService.js';

export const getCareers = (_req, res) => {
  try {
    const careers = listCareers();
    res.json({
      success: true,
      count: careers.length,
      careers: careers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch careers',
      error: error.message
    });
  }
};

export const searchCareersByQuery = (req, res) => {
  try {
    const { q } = req.query;
    const careers = searchCareers(q);
    res.json({
      success: true,
      count: careers.length,
      careers: careers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search careers',
      error: error.message
    });
  }
};

export const getStats = (_req, res) => {
  try {
    const stats = getSalaryStats();
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};