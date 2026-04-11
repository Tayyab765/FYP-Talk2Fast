import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTests } from '../../api/mockTestApi'
import { useNotification } from '../../context/NotificationContext'
import './MockTestList.css'

export default function MockTestList() {
  const navigate = useNavigate()
  const { showError } = useNotification()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('all')

  useEffect(() => {
    loadTests()
  }, [difficultyFilter])

  async function loadTests() {
    setLoading(true)
    setError('')
    try {
      const options = difficultyFilter !== 'all' ? { difficulty: difficultyFilter } : {}
      const data = await getTests(options)
      setTests(data.tests || [])
    } catch (err) {
      const errorMessage = err.message || 'Failed to load tests'
      setError(errorMessage)
      showError(errorMessage, {
        showRetry: true,
        onRetry: loadTests
      })
    } finally {
      setLoading(false)
    }
  }

  function handleStartTest(testId) {
    // MongoDB uses _id, convert to string
    const id = typeof testId === 'object' ? testId.toString() : testId
    navigate(`/dashboard/mock-tests/${id}/take`)
  }

  function getDifficultyColor(difficulty) {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'difficulty-easy'
      case 'medium':
        return 'difficulty-medium'
      case 'hard':
        return 'difficulty-hard'
      default:
        return ''
    }
  }

  return (
    <div className="mock-test-list-page">
      <div className="mock-test-header">
        <div>
          <h1 className="mock-test-title">Mock Tests</h1>
          <p className="mock-test-subtitle">
            Practice with realistic FAST entry test simulations
          </p>
        </div>
        <div className="filter-section">
          <label htmlFor="difficulty-filter" className="filter-label">
            Difficulty:
          </label>
          <select
            id="difficulty-filter"
            className="difficulty-filter"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading tests...</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="empty-state">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3>No tests available</h3>
          <p>Check back later for new practice tests</p>
        </div>
      ) : (
        <div className="test-cards">
          {tests.map((test) => (
            <div key={test._id} className="test-card">
              <div className="test-card-header">
                <h3 className="test-card-title">{test.title}</h3>
                <span className={`difficulty-badge ${getDifficultyColor(test.difficulty)}`}>
                  {test.difficulty}
                </span>
              </div>

              <p className="test-card-description">{test.description}</p>

              <div className="test-card-details">
                <div className="detail-item">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{test.totalQuestions} Questions</span>
                </div>
                <div className="detail-item">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{test.totalDuration} Minutes</span>
                </div>
              </div>

              <div className="test-card-sections">
                <h4 className="sections-title">Sections:</h4>
                <div className="sections-list">
                  {test.sections?.map((section, idx) => (
                    <div key={idx} className="section-item">
                      <span className="section-name">{section.name}</span>
                      <span className="section-meta">
                        {section.questionCount}Q · {section.duration}min
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {test.userAttempts > 0 && (
                <div className="test-card-stats">
                  <div className="stat-item">
                    <span className="stat-label">Attempts:</span>
                    <span className="stat-value">{test.userAttempts}</span>
                  </div>
                  {test.highestScore !== undefined && (
                    <div className="stat-item">
                      <span className="stat-label">Best Score:</span>
                      <span className="stat-value stat-value-highlight">
                        {test.highestScore}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                className="start-test-btn"
                onClick={() => handleStartTest(test._id)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                </svg>
                Start Test
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
