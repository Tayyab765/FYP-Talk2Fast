import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, getPerformance } from '../../api/mockTestApi'
import { useNotification } from '../../context/NotificationContext'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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

  const { overallStats, sectionStats, topicStats, scoreTrend, recommendations } = performance

  return (
    <div className="test-analytics">
      <div className="test-analytics__container">
        {/* Header */}
        <div className="test-analytics__header">
          <h1 className="test-analytics__title">Performance Analytics</h1>
          <p className="test-analytics__subtitle">
            Track your progress and identify areas for improvement
          </p>
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
              <div className="stat-card__value">{overallStats.totalAttempts}</div>
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
              <div className="stat-card__value">{overallStats.averageScore.toFixed(1)}%</div>
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
              <div className="stat-card__value">{overallStats.highestScore}</div>
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
              <div className="stat-card__value">{overallStats.lowestScore}</div>
            </div>
          </div>
        </div>

        {/* Score Trend Chart */}
        <div className="analytics-section">
          <h2 className="section-title">Score Trend</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scoreTrend}>
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
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectionStats}>
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
        </div>

        {/* Topic-wise Performance Table */}
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
                {topicStats.map((topic, index) => (
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
                {history.attempts.map((attempt) => (
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
