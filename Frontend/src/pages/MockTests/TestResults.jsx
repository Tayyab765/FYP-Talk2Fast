import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getResults } from '../../api/mockTestApi'
import { useNotification } from '../../context/NotificationContext'
import AnswerReview from '../../components/MockTest/AnswerReview'
import './TestResults.css'

/**
 * TestResults Page Component
 * 
 * Displays comprehensive test results including:
 * - Total score and percentage
 * - Section-wise breakdown (correct, incorrect, unattempted, percentage)
 * - Time analysis (total time, time per section)
 * - Review Answers button
 * - Retake Test button
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */
export default function TestResults() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const { showError } = useNotification()

  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showReview, setShowReview] = useState(false)

  // Fetch results on mount
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true)
        const data = await getResults(attemptId)
        setResults(data)
      } catch (err) {
        console.error('Failed to fetch results:', err)
        const errorMessage = err.message || 'Failed to load test results. Please try again.'
        setError(errorMessage)
        showError(errorMessage, {
          showRetry: true,
          onRetry: () => {
            setError(null)
            fetchResults()
          }
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [attemptId, showError])

  // Handle retake test
  const handleRetakeTest = () => {
    if (results && results.testId) {
      navigate(`/dashboard/mock-tests/${results.testId}/take`)
    } else {
      navigate('/dashboard/mock-tests')
    }
  }

  // Handle review answers
  const handleReviewAnswers = () => {
    setShowReview(true)
  }

  // Handle back from review
  const handleBackFromReview = () => {
    setShowReview(false)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="test-results">
        <div className="test-results__loading">
          <div className="spinner-large"></div>
          <p>Loading results...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="test-results">
        <div className="test-results__error">
          <h2>Error</h2>
          <p>{error}</p>
          <button
            className="test-results__error-btn"
            onClick={() => navigate('/dashboard/mock-tests')}
          >
            Back to Tests
          </button>
        </div>
      </div>
    )
  }

  // Show answer review if requested
  if (showReview) {
    return (
      <AnswerReview
        attemptId={attemptId}
        onBack={handleBackFromReview}
      />
    )
  }

  // Main results display
  return (
    <div className="test-results">
      <div className="test-results__container">
        {/* Header */}
        <div className="test-results__header">
          <h1 className="test-results__title">{results.testTitle}</h1>
          <p className="test-results__subtitle">
            Completed on {new Date(results.completedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Overall Score Card */}
        <div className="test-results__score-card">
          <div className="score-card__main">
            <div className="score-card__label">Your Score</div>
            <div className="score-card__value">
              {results.score.total} / {results.totalQuestions}
            </div>
            <div className="score-card__percentage">
              {results.score.percentage.toFixed(2)}%
            </div>
          </div>
          <div className="score-card__status">
            {results.score.percentage >= 80 ? (
              <div className="status-badge status-badge--excellent">Excellent!</div>
            ) : results.score.percentage >= 60 ? (
              <div className="status-badge status-badge--good">Good Job!</div>
            ) : (
              <div className="status-badge status-badge--needs-improvement">Keep Practicing</div>
            )}
          </div>
        </div>

        {/* Section-wise Breakdown */}
        <div className="test-results__section">
          <h2 className="section-title">Section-wise Performance</h2>
          <div className="section-breakdown-table">
            <table>
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Correct</th>
                  <th>Incorrect</th>
                  <th>Unattempted</th>
                  <th>Total</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {results.score.sectionScores.map((section, index) => (
                  <tr key={index}>
                    <td className="section-name">{section.section}</td>
                    <td className="stat-correct">{section.correct}</td>
                    <td className="stat-incorrect">{section.incorrect}</td>
                    <td className="stat-unattempted">{section.unattempted}</td>
                    <td className="stat-total">{section.total}</td>
                    <td className="stat-percentage">
                      <span className={`percentage-badge ${
                        section.percentage >= 80 ? 'percentage-badge--high' :
                        section.percentage >= 60 ? 'percentage-badge--medium' :
                        'percentage-badge--low'
                      }`}>
                        {section.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Time Analysis */}
        <div className="test-results__section">
          <h2 className="section-title">Time Analysis</h2>
          <div className="time-analysis">
            <div className="time-card">
              <div className="time-card__label">Total Time</div>
              <div className="time-card__value">
                {Math.floor(results.timeAnalysis.totalTime)} minutes
              </div>
            </div>
            <div className="time-breakdown">
              <h3 className="time-breakdown__title">Time per Section</h3>
              <div className="time-breakdown__list">
                {results.timeAnalysis.sections.map((section, index) => (
                  <div key={index} className="time-item">
                    <span className="time-item__section">{section.section}</span>
                    <span className="time-item__value">
                      {Math.floor(section.timeSpent)} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="test-results__actions">
          <button
            className="action-btn action-btn--primary"
            onClick={handleReviewAnswers}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Review Answers
          </button>
          <button
            className="action-btn action-btn--secondary"
            onClick={handleRetakeTest}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retake Test
          </button>
          <button
            className="action-btn action-btn--tertiary"
            onClick={() => navigate('/dashboard/mock-tests')}
          >
            Back to Tests
          </button>
        </div>
      </div>
    </div>
  )
}
