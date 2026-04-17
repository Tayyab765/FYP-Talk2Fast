import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '../../context/NotificationContext'
import { getHistory } from '../../api/mockTestApi'
import './MockTestList.css'

export default function MockTestList() {
  const navigate = useNavigate()
  const { showError } = useNotification()
  const [selectedDifficulty, setSelectedDifficulty] = useState(null)
  const [activeTab, setActiveTab] = useState('all-tests') // 'all-tests' or 'previous-tests'
  const [testHistory, setTestHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Fetch test history when switching to previous tests tab
  useEffect(() => {
    if (activeTab === 'previous-tests' && testHistory.length === 0) {
      fetchTestHistory()
    }
  }, [activeTab])

  async function fetchTestHistory() {
    try {
      setIsLoadingHistory(true)
      const data = await getHistory()
      setTestHistory(data.attempts || [])
    } catch (err) {
      console.error('Failed to fetch test history:', err)
      showError('Failed to load test history. Please try again.')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  function handleStartTest(difficulty) {
    // Navigate to test taking page with difficulty parameter
    navigate(`/dashboard/mock-tests/take?difficulty=${difficulty}`)
  }

  function handleViewResults(attemptId) {
    navigate(`/dashboard/mock-tests/results/${attemptId}`)
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

  const testLevels = [
    {
      difficulty: 'easy',
      title: 'Easy Test',
      description: 'Perfect for beginners and first-time test takers. Focus on fundamental concepts with easier questions.',
      distribution: '70 Easy • 40 Medium • 10 Hard',
      icon: '🌱',
      color: 'easy'
    },
    {
      difficulty: 'medium',
      title: 'Medium Test',
      description: 'Balanced difficulty for intermediate students. Good mix of easy, medium, and challenging questions.',
      distribution: '30 Easy • 67 Medium • 23 Hard',
      icon: '📚',
      color: 'medium'
    },
    {
      difficulty: 'hard',
      title: 'Hard Test',
      description: 'Advanced level for final preparation. Majority of questions are challenging to test your mastery.',
      distribution: '10 Easy • 65 Medium • 45 Hard',
      icon: '🎯',
      color: 'hard'
    }
  ]

  return (
    <div className="mock-test-list-page">
      <div className="mock-test-header">
        <h1 className="mock-test-title">Mock Tests</h1>
        <p className="mock-test-subtitle">
          Practice with realistic FAST entry test simulations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'all-tests' ? 'active' : ''}`}
          onClick={() => setActiveTab('all-tests')}
        >
          All Tests
        </button>
        <button
          className={`tab-button ${activeTab === 'previous-tests' ? 'active' : ''}`}
          onClick={() => setActiveTab('previous-tests')}
        >
          Previous Tests
        </button>
      </div>

      {/* All Tests Tab Content */}
      {activeTab === 'all-tests' && (
        <>
          <div className="tab-content-header">
            <h2 className="tab-content-title">Choose Your Test Difficulty</h2>
            <p className="tab-content-subtitle">
              Select a difficulty level to start your FAST entry test practice
            </p>
          </div>
          <div className="test-cards">
        {testLevels.map((level) => (
          <div 
            key={level.difficulty} 
            className={`test-card ${selectedDifficulty === level.difficulty ? 'selected' : ''}`}
            onMouseEnter={() => setSelectedDifficulty(level.difficulty)}
            onMouseLeave={() => setSelectedDifficulty(null)}
          >
            <div className="test-card-icon">{level.icon}</div>
            
            <div className="test-card-header">
              <h3 className="test-card-title">{level.title}</h3>
              <span className={`difficulty-badge ${getDifficultyColor(level.difficulty)}`}>
                {level.difficulty}
              </span>
            </div>

            <p className="test-card-description">{level.description}</p>

            <div className="test-card-details">
              <h4 className="sections-title">Test Structure:</h4>
              <div className="sections-list">
                <div className="section-item">
                  <span className="section-name">Advance Math</span>
                  <span className="section-meta">50Q · 50min</span>
                </div>
                <div className="section-item">
                  <span className="section-name">Basic Math</span>
                  <span className="section-meta">20Q · 20min</span>
                </div>
                <div className="section-item">
                  <span className="section-name">IQ & Logical</span>
                  <span className="section-meta">20Q · 20min</span>
                </div>
                <div className="section-item">
                  <span className="section-name">English</span>
                  <span className="section-meta">30Q · 30min</span>
                </div>
              </div>
            </div>

            <button
              className={`start-test-btn ${getDifficultyColor(level.difficulty)}`}
              onClick={() => handleStartTest(level.difficulty)}
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
              Start {level.title}
            </button>
          </div>
        ))}
          </div>
        </>
      )}

      {/* Previous Tests Tab Content */}
      {activeTab === 'previous-tests' && (
        <div className="previous-tests-content">
          {isLoadingHistory ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading test history...</p>
            </div>
          ) : testHistory.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3>No Test History</h3>
              <p>You haven't completed any tests yet. Take your first test to see your history!</p>
              <button
                className="empty-state-btn"
                onClick={() => setActiveTab('all-tests')}
              >
                Start a Test
              </button>
            </div>
          ) : (
            <>
              <div className="tab-content-header">
                <h2 className="tab-content-title">Your Test History</h2>
                <p className="tab-content-subtitle">
                  Review your previously attempted tests and track your progress
                </p>
              </div>
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Test Name</th>
                      <th>Difficulty</th>
                      <th>Date Completed</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testHistory.map((attempt) => (
                      <tr key={attempt.attemptId}>
                        <td className="test-name-cell">{attempt.testTitle}</td>
                        <td>
                          <span className={`difficulty-badge ${getDifficultyColor(attempt.testDifficulty)}`}>
                            {attempt.testDifficulty || 'N/A'}
                          </span>
                        </td>
                        <td className="date-cell">
                          {new Date(attempt.completedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="score-cell">{attempt.score}/120</td>
                        <td>
                          <span className={`percentage-badge ${
                            attempt.percentage >= 80 ? 'percentage-high' :
                            attempt.percentage >= 60 ? 'percentage-medium' :
                            'percentage-low'
                          }`}>
                            {attempt.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <button
                            className="view-results-btn"
                            onClick={() => handleViewResults(attempt.attemptId)}
                          >
                            View Results
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
