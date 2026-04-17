import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTest } from '../../context/TestContext'
import { useNotification } from '../../context/NotificationContext'
import SectionHeader from '../../components/MockTest/SectionHeader'
import QuestionDisplay from '../../components/MockTest/QuestionDisplay'
import QuestionPalette from '../../components/MockTest/QuestionPalette'
import NavigationButtons from '../../components/MockTest/NavigationButtons'
import './TestTaking.css'

/**
 * TestTaking Page Component
 * 
 * Main test-taking interface that:
 * - Starts a new test or resumes an existing attempt
 * - Integrates all test components (header, question, palette, navigation)
 * - Handles section submission and navigation
 * - Handles auto-submit on timer expiration
 * - Prevents accidental navigation away
 * - Navigates to results page after completion
 * 
 * Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 7.1, 
 *               9.1, 9.2, 9.4, 9.5, 9.6, 10.7, 22.3, 22.4, 22.5, 24.4
 */
export default function TestTaking() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showError, showWarning } = useNotification()
  const {
    currentAttempt,
    startNewTest,
    resumeTest,
    submitFinalTest,
    clearTestState,
    isLoading,
    timeRemaining,
    currentSection,
  } = useTest()

  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize test on mount
  useEffect(() => {
    const initializeTest = async () => {
      try {
        // Check if we have an attemptId in URL params (for resuming)
        const attemptId = searchParams.get('attemptId')
        const difficulty = searchParams.get('difficulty')

        if (attemptId) {
          // Resume existing attempt
          await resumeTest(attemptId)
        } else if (difficulty) {
          // Start new test with difficulty
          await startNewTest(difficulty)
        } else {
          throw new Error('No difficulty or attemptId provided')
        }

        setIsInitialized(true)
      } catch (err) {
        console.error('Failed to initialize test:', err)
        const errorMessage = err.message || 'Failed to load test. Please try again.'
        setError(errorMessage)
        showError(errorMessage, {
          showRetry: true,
          onRetry: () => {
            setError(null)
            setIsInitialized(false)
          }
        })
      }
    }

    if (!isInitialized) {
      initializeTest()
    }
  }, [searchParams, startNewTest, resumeTest, isInitialized, showError])

  // Handle auto-submit when timer expires
  useEffect(() => {
    if (timeRemaining === 0 && isInitialized && currentAttempt) {
      handleAutoSubmit()
    }
  }, [timeRemaining, isInitialized, currentAttempt])

  // Handle auto-submit on timer expiration
  const handleAutoSubmit = async () => {
    try {
      showWarning('Time expired! Submitting section automatically...')
      // Check if this is the final section
      if (currentSection === 3) {
        // Submit final test
        const result = await submitFinalTest()
        // Navigate to results page
        navigate(`/dashboard/mock-tests/results/${result.attemptId}`)
      }
      // If not final section, NavigationButtons component handles section submission
    } catch (err) {
      console.error('Auto-submit failed:', err)
      const errorMessage = err.message || 'Failed to submit section automatically. Please try again.'
      showError(errorMessage, {
        showRetry: true,
        onRetry: handleAutoSubmit
      })
    }
  }

  // Prevent navigation away with confirmation dialog
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (currentAttempt && isInitialized) {
        e.preventDefault()
        e.returnValue = 'Your test progress will be saved. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [currentAttempt, isInitialized])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear state on unmount - allow resuming
      // clearTestState()
    }
  }, [])

  // Handle section submission completion (called from NavigationButtons via context)
  useEffect(() => {
    // Listen for section submission completion
    // If final section was submitted, navigate to results
    if (currentAttempt && currentAttempt.status === 'completed') {
      navigate(`/dashboard/mock-tests/results/${currentAttempt.attemptId}`)
    }
  }, [currentAttempt, navigate])

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="test-taking">
        <div className="test-taking__loading">
          <div className="spinner-large"></div>
          <p>Loading test...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="test-taking">
        <div className="test-taking__error">
          <h2>Error</h2>
          <p>{error}</p>
          <button
            className="test-taking__error-btn"
            onClick={() => navigate('/dashboard/mock-tests')}
          >
            Back to Tests
          </button>
        </div>
      </div>
    )
  }

  // Main test interface
  return (
    <div className="test-taking">
      {/* Section Header with Timer */}
      <div className="test-taking__header">
        <SectionHeader />
      </div>

      {/* Main Content Area */}
      <div className="test-taking__content">
        {/* Question Display */}
        <div className="test-taking__question">
          <QuestionDisplay />
          
          {/* Navigation Buttons */}
          <div className="test-taking__navigation">
            <NavigationButtons />
          </div>
        </div>

        {/* Question Palette */}
        <div className="test-taking__palette">
          <QuestionPalette />
        </div>
      </div>
    </div>
  )
}
