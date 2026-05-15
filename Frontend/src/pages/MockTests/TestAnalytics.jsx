import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, getPerformance } from '../../api/mockTestApi'
import { useNotification } from '../../context/NotificationContext'
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './TestAnalytics.css'

/**
 * TestAnalytics Page Component
 * 
 * Displays comprehensive performance analytics including:
 * - Overall statistics (total attempts, average score, highest, lowest)
 * - Score trend line chart
 * - Section-wise performance bar chart
 * - Topic-wise performance table with weak/strong categorization
 * - Personalized recommendations
 * - Past attempts history table
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 15.1, 15.2, 15.3, 15.4, 15.5
 */
export default function TestAnalytics() {
  const navigate = useNavigate()
  const { showError } = useNotification()

  const [history, setHistory] = useState(null)
  const [performance, setPerformance] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('all') // 'week', 'month', '3months', 'all'

  // Fetch analytics data on mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        const [historyData, performanceData] = await Promise.all([
          getHistory(),
          getPerformance()
        ])
        setHistory(historyData)
        setPerformance(performanceData)
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
        const errorMessage = err.message || 'Failed to load analytics data. Please try again.'
        setError(errorMessage)
        showError(errorMessage, {
          showRetry: true,
          onRetry: () => {
            setError(null)
            fetchAnalytics()
          }
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [showError])

  // Loading state
  if (isLoading) {
    return (
      <div className="test-analytics">
        <div className="test-analytics__loading">
          <div className="spinner-large"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="test-analytics">
        <div className="test-analytics__error">
          <h2>Error</h2>
          <p>{error}</p>
          <button
            className="test-analytics__error-btn"
            onClick={() => navigate('/dashboard/mock-tests')}
          >
            Back to Tests
          </button>
        </div>
      </div>
    )
  }

  // No data state
  if (!history?.attempts || history.attempts.length === 0) {
    return (
      <div className="test-analytics">
        <div className="test-analytics__empty">
          <h2>No Test History</h2>
          <p>You haven't completed any tests yet. Take a test to see your analytics!</p>
          <button
            className="test-analytics__empty-btn"
            onClick={() => navigate('/dashboard/mock-tests')}
          >
            Take a Test
          </button>
        </div>
      </div>
    )
  }

  // Safely destructure performance data with defaults
  const overallStats = performance?.overallStats || { totalAttempts: 0, averageScore: 0, highestScore: 0, lowestScore: 0 }
  const sectionStats = performance?.sectionWisePerformance || []
  const topicStats = performance?.topicWisePerformance || []
  const scoreTrend = performance?.scoreTrend || []
  const recommendations = performance?.recommendations || []

  // Filter data based on date range
  const filterDataByDateRange = (data, range) => {
    if (range === 'all') return data
    
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (range) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      default:
        return data
    }
    
    return data.filter(item => new Date(item.completedAt || item.date) >= cutoffDate)
  }

  const filteredAttempts = history?.attempts ? filterDataByDateRange(history.attempts, dateRange) : []
  const filteredScoreTrend = scoreTrend.length > 0 ? filterDataByDateRange(scoreTrend, dateRange) : []

  // Recalculate stats based on filtered attempts
  const calculateFilteredStats = () => {
    if (!filteredAttempts || filteredAttempts.length === 0) {
      return {
        overallStats: { totalAttempts: 0, averageScore: 0, highestScore: 0, lowestScore: 0 },
        sectionStats: [],
        topicStats: []
      }
    }

    // Calculate overall stats
    const scores = filteredAttempts.map(a => a.percentage)
    const filteredOverallStats = {
      totalAttempts: filteredAttempts.length,
      averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores)
    }

    // Calculate section-wise stats
    const sectionMap = {}
    filteredAttempts.forEach(attempt => {
      if (attempt.sectionResults) {
        attempt.sectionResults.forEach(section => {
          if (!sectionMap[section.section]) {
            sectionMap[section.section] = { totalCorrect: 0, totalQuestions: 0 }
          }
          sectionMap[section.section].totalCorrect += section.correct
          sectionMap[section.section].totalQuestions += section.total
        })
      }
    })
    const filteredSectionStats = Object.entries(sectionMap).map(([section, data]) => ({
      section,
      averageAccuracy: (data.totalCorrect / data.totalQuestions) * 100
    }))

    // Calculate topic-wise stats
    const topicMap = {}
    filteredAttempts.forEach(attempt => {
      if (attempt.topicResults) {
        attempt.topicResults.forEach(topic => {
          if (!topicMap[topic.topic]) {
            topicMap[topic.topic] = { totalCorrect: 0, totalQuestions: 0 }
          }
          topicMap[topic.topic].totalCorrect += topic.correct
          topicMap[topic.topic].totalQuestions += topic.total
        })
      }
    })
    const filteredTopicStats = Object.entries(topicMap).map(([topic, data]) => {
      const accuracy = (data.totalCorrect / data.totalQuestions) * 100
      let category = 'weak'
      if (accuracy >= 80) category = 'strong'
      else if (accuracy >= 60) category = 'average'
      
      return {
        topic,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.totalCorrect,
        accuracy,
        category
      }
    }).sort((a, b) => a.accuracy - b.accuracy)

    return {
      overallStats: filteredOverallStats,
      sectionStats: filteredSectionStats,
      topicStats: filteredTopicStats
    }
  }

  const filteredStats = dateRange === 'all' 
    ? { overallStats, sectionStats, topicStats }
    : calculateFilteredStats()

  const displayOverallStats = filteredStats.overallStats
  const displaySectionStats = filteredStats.sectionStats
  const displayTopicStats = filteredStats.topicStats

  // Calculate platform average (mock data - in real app, fetch from backend)
  const platformAverage = 65
  const topPerformers = 92
  const userPercentile = displayOverallStats.averageScore > platformAverage 
    ? Math.min(Math.round(((displayOverallStats.averageScore - platformAverage) / (topPerformers - platformAverage)) * 40 + 50), 99)
    : Math.round((displayOverallStats.averageScore / platformAverage) * 50)

  // Calculate improvement rate
  const calculateImprovementRate = () => {
    if (!scoreTrend || scoreTrend.length < 2) return null
    
    const firstFive = scoreTrend.slice(0, Math.min(5, scoreTrend.length))
    const lastFive = scoreTrend.slice(Math.max(0, scoreTrend.length - 5))
    
    const firstAvg = firstFive.reduce((sum, t) => sum + t.percentage, 0) / firstFive.length
    const lastAvg = lastFive.reduce((sum, t) => sum + t.percentage, 0) / lastFive.length
    
    const improvement = lastAvg - firstAvg
    const improvementPercent = ((improvement / firstAvg) * 100).toFixed(1)
    const perTestRate = (improvement / scoreTrend.length).toFixed(1)
    
    return { firstAvg, lastAvg, improvement, improvementPercent, perTestRate }
  }

  const improvementData = scoreTrend && scoreTrend.length >= 2 ? calculateImprovementRate() : null

  // Calculate time analysis
  const calculateTimeAnalysis = () => {
    if (!filteredAttempts || !filteredAttempts.length) return null
    
    const totalTime = filteredAttempts.reduce((sum, attempt) => {
      const attemptTime = attempt.sectionTimestamps?.reduce((s, ts) => s + (ts.timeSpent || 0), 0) || 0
      return sum + attemptTime
    }, 0)
    
    const avgTime = totalTime / filteredAttempts.length
    
    return {
      totalTests: filteredAttempts.length,
      avgTimePerTest: avgTime.toFixed(0),
      totalTimeSpent: (totalTime / 60).toFixed(1) // in hours
    }
  }

  const timeAnalysis = calculateTimeAnalysis()

  return (
    <div className="test-analytics">
      <div className="test-analytics__container">
        {/* Header */}
        <div className="test-analytics__header">
          <div>
            <h1 className="test-analytics__title">Performance Analytics</h1>
            <p className="test-analytics__subtitle">
              Track your progress and identify areas for improvement
            </p>
          </div>
          
          {/* Date Range Filter */}
          <div className="date-range-filter">
            <button 
              className={`filter-btn ${dateRange === 'week' ? 'active' : ''}`}
              onClick={() => setDateRange('week')}
            >
              Last 7 Days
            </button>
            <button 
              className={`filter-btn ${dateRange === 'month' ? 'active' : ''}`}
              onClick={() => setDateRange('month')}
            >
              Last Month
            </button>
            <button 
              className={`filter-btn ${dateRange === '3months' ? 'active' : ''}`}
              onClick={() => setDateRange('3months')}
            >
              Last 3 Months
            </button>
            <button 
              className={`filter-btn ${dateRange === 'all' ? 'active' : ''}`}
              onClick={() => setDateRange('all')}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Overall Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="stat-card__content">
              <div className="stat-card__label">Total Attempts</div>
              <div className="stat-card__value">{displayOverallStats.totalAttempts}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="stat-card__content">
              <div className="stat-card__label">Average Score</div>
              <div className="stat-card__value">{displayOverallStats.averageScore.toFixed(1)}%</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="stat-card__content">
              <div className="stat-card__label">Highest Score</div>
              <div className="stat-card__value">{displayOverallStats.highestScore}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div className="stat-card__content">
              <div className="stat-card__label">Lowest Score</div>
              <div className="stat-card__value">{displayOverallStats.lowestScore}</div>
            </div>
          </div>
        </div>

        {/* Comparison with Platform Average */}
        <div className="analytics-section comparison-section">
          <h2 className="section-title">How You Compare</h2>
          <div className="comparison-grid">
            <div className="comparison-card">
              <div className="comparison-label">Your Average</div>
              <div className="comparison-value your-score">{displayOverallStats.averageScore.toFixed(1)}%</div>
            </div>
            <div className="comparison-card">
              <div className="comparison-label">Platform Average</div>
              <div className="comparison-value platform-score">{platformAverage}%</div>
            </div>
            <div className="comparison-card">
              <div className="comparison-label">Top 10%</div>
              <div className="comparison-value top-score">{topPerformers}%</div>
            </div>
            <div className="comparison-card">
              <div className="comparison-label">Your Percentile</div>
              <div className="comparison-value percentile-score">{userPercentile}th</div>
            </div>
          </div>
          <div className="comparison-bar-container">
            <div className="comparison-bar">
              <div className="bar-segment platform" style={{ width: `${(platformAverage / 100) * 100}%` }}>
                <span className="bar-label">Platform Avg</span>
              </div>
              <div 
                className="bar-marker your-marker" 
                style={{ left: `${displayOverallStats.averageScore}%` }}
                title={`You: ${displayOverallStats.averageScore.toFixed(1)}%`}
              >
                <div className="marker-dot"></div>
                <span className="marker-label">You</span>
              </div>
              <div 
                className="bar-marker top-marker" 
                style={{ left: `${topPerformers}%` }}
                title={`Top 10%: ${topPerformers}%`}
              >
                <div className="marker-dot"></div>
                <span className="marker-label">Top 10%</span>
              </div>
            </div>
          </div>
          <p className="comparison-message">
            {displayOverallStats.averageScore > platformAverage 
              ? `🎉 You're performing ${((displayOverallStats.averageScore - platformAverage) / platformAverage * 100).toFixed(0)}% better than the platform average!`
              : `Keep practicing! You're ${((platformAverage - displayOverallStats.averageScore) / platformAverage * 100).toFixed(0)}% away from the platform average.`}
          </p>
        </div>

        {/* Improvement Rate */}
        {improvementData && (
          <div className="analytics-section improvement-section">
            <h2 className="section-title">Improvement Rate</h2>
            <div className="improvement-grid">
              <div className="improvement-card">
                <div className="improvement-label">First 5 Tests Average</div>
                <div className="improvement-value">{improvementData.firstAvg.toFixed(1)}%</div>
              </div>
              <div className="improvement-card">
                <div className="improvement-label">Last 5 Tests Average</div>
                <div className="improvement-value">{improvementData.lastAvg.toFixed(1)}%</div>
              </div>
              <div className="improvement-card highlight">
                <div className="improvement-label">Total Improvement</div>
                <div className="improvement-value">
                  {improvementData.improvement > 0 ? '+' : ''}{improvementData.improvement.toFixed(1)}%
                  <span className="improvement-percent">({improvementData.improvementPercent > 0 ? '+' : ''}{improvementData.improvementPercent}%)</span>
                </div>
              </div>
              <div className="improvement-card">
                <div className="improvement-label">Per Test Rate</div>
                <div className="improvement-value">{improvementData.perTestRate > 0 ? '+' : ''}{improvementData.perTestRate}%</div>
              </div>
            </div>
            <p className="improvement-message">
              {improvementData.improvement > 0 
                ? `🚀 You're improving at ${improvementData.perTestRate}% per test! Keep up the great work!`
                : `📚 Your scores are stable. Focus on weak topics to see improvement.`}
            </p>
          </div>
        )}

        {/* Time Analysis */}
        {timeAnalysis && (
          <div className="analytics-section time-analysis-section">
            <h2 className="section-title">Time Analysis</h2>
            <div className="time-analysis-grid">
              <div className="time-card">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <div className="time-info">
                  <div className="time-value">{timeAnalysis.avgTimePerTest} min</div>
                  <div className="time-label">Average per Test</div>
                </div>
              </div>
              <div className="time-card">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                <div className="time-info">
                  <div className="time-value">{timeAnalysis.totalTimeSpent} hrs</div>
                  <div className="time-label">Total Time Spent</div>
                </div>
              </div>
              <div className="time-card">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <div className="time-info">
                  <div className="time-value">{timeAnalysis.totalTests}</div>
                  <div className="time-label">Tests Analyzed</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Score Trend Chart */}
        <div className="analytics-section">
          <h2 className="section-title">Score Trend</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredScoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="attemptNumber" 
                  label={{ value: 'Attempt Number', position: 'insideBottom', offset: -5 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
                  stroke="#6b7280"
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Score']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#a61c31" 
                  strokeWidth={3}
                  dot={{ fill: '#a61c31', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section-wise Performance Chart */}
        <div className="analytics-section">
          <h2 className="section-title">Section-wise Performance</h2>
          {displaySectionStats && displaySectionStats.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={displaySectionStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="section" 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                  stroke="#6b7280"
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Accuracy']}
                />
                <Legend />
                <Bar 
                  dataKey="averageAccuracy" 
                  fill="#a61c31" 
                  name="Average Accuracy"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          ) : (
            <p className="no-data-message">No section data available yet. Complete more tests to see section-wise performance.</p>
          )}
        </div>

        {/* Section Strength Radar Chart */}
        {displaySectionStats && displaySectionStats.length > 0 && (
        <div className="analytics-section">
          <h2 className="section-title">Section Strength Overview</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={displaySectionStats}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="section" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                />
                <Radar 
                  name="Accuracy" 
                  dataKey="averageAccuracy" 
                  stroke="#a61c31" 
                  fill="#a61c31" 
                  fillOpacity={0.6}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Accuracy']}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-note">
            This radar chart shows your performance balance across all sections. 
            A more circular shape indicates balanced performance.
          </p>
        </div>
        )}

        {/* Topic-wise Performance Table */}
        {displayTopicStats && displayTopicStats.length > 0 && (
        <div className="analytics-section">
          <h2 className="section-title">Topic-wise Performance</h2>
          <div className="topic-table-container">
            <table className="topic-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Questions Attempted</th>
                  <th>Correct Answers</th>
                  <th>Accuracy</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {displayTopicStats.map((topic, index) => (
                  <tr key={index}>
                    <td className="topic-name">{topic.topic}</td>
                    <td>{topic.totalQuestions}</td>
                    <td>{topic.correctAnswers}</td>
                    <td>
                      <span className={`accuracy-badge accuracy-badge--${topic.category}`}>
                        {topic.accuracy.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={`category-badge category-badge--${topic.category}`}>
                        {topic.category.charAt(0).toUpperCase() + topic.category.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="analytics-section">
            <h2 className="section-title">Recommendations</h2>
            <div className="recommendations-list">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="recommendation-card">
                  <div className="recommendation-card__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="recommendation-card__text">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Attempts History */}
        {filteredAttempts && filteredAttempts.length > 0 && (
        <div className="analytics-section">
          <h2 className="section-title">Test History</h2>
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.attemptId}>
                    <td className="test-name">{attempt.testTitle}</td>
                    <td>
                      {new Date(attempt.completedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="score-value">{attempt.score}</td>
                    <td>
                      <span className={`percentage-badge ${
                        attempt.percentage >= 80 ? 'percentage-badge--high' :
                        attempt.percentage >= 60 ? 'percentage-badge--medium' :
                        'percentage-badge--low'
                      }`}>
                        {attempt.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-results-btn"
                        onClick={() => navigate(`/dashboard/mock-tests/results/${attempt.attemptId}`)}
                      >
                        View Results
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Back Button */}
        <div className="analytics-actions">
          <button
            className="action-btn action-btn--secondary"
            onClick={() => navigate('/dashboard/mock-tests')}
          >
            Back to Tests
          </button>
        </div>
      </div>
    </div>
  )
}
