import { useState } from 'react'
import { useTest } from '../../context/TestContext'
import { useNotification } from '../../context/NotificationContext'
import './NavigationButtons.css'

/**
 * NavigationButtons Component
 * 
 * Provides navigation controls:
 * - Previous and Next buttons for question navigation
 * - Mark for Review button
 * - Submit Section button
 * - Disables Previous on first question, Next on last question
 * 
 * Requirements: 4.2, 4.3, 7.1, 9.1
 */
export default function NavigationButtons() {
  const {
    questions,
    currentQuestionIndex,
    markedForReview,
    previousQuestion,
    nextQuestion,
    toggleMarkForReview,
    submitCurrentSection,
    currentSection,
  } = useTest()

  const { showError } = useNotification()
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get current question
  const currentQuestion = questions[currentQuestionIndex]
  const isMarked = currentQuestion ? markedForReview.includes(currentQuestion._id) : false

  // Navigation boundaries
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  // Handle mark for review toggle
  const handleMarkForReview = () => {
    if (currentQuestion) {
      toggleMarkForReview(currentQuestion._id)
    }
  }

  // Handle submit section click
  const handleSubmitClick = () => {
    setShowSubmitDialog(true)
  }

  // Handle submit confirmation
  const handleSubmitConfirm = async () => {
    setIsSubmitting(true)
    try {
      await submitCurrentSection()
      setShowSubmitDialog(false)
    } catch (error) {
      console.error('Failed to submit section:', error)
      const errorMessage = error.message || 'Failed to submit section. Please try again.'
      showError(errorMessage, {
        showRetry: true,
        onRetry: handleSubmitConfirm
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle submit cancel
  const handleSubmitCancel = () => {
    setShowSubmitDialog(false)
  }

  // Section names for display
  const sectionNames = ['Advance Math', 'Basic Math', 'IQ & Logical', 'English']
  const currentSectionName = sectionNames[currentSection] || 'Section'

  return (
    <>
      <div className="navigation-buttons">
        {/* Previous Button */}
        <button
          className="navigation-buttons__btn navigation-buttons__btn--secondary"
          onClick={previousQuestion}
          disabled={isFirstQuestion || isSubmitting}
          aria-label="Previous question"
        >
          ← Previous
        </button>

        {/* Mark for Review Button */}
        <button
          className={`navigation-buttons__btn navigation-buttons__btn--review ${
            isMarked ? 'navigation-buttons__btn--review-active' : ''
          }`}
          onClick={handleMarkForReview}
          disabled={isSubmitting}
          aria-label={isMarked ? 'Unmark for review' : 'Mark for review'}
          aria-pressed={isMarked}
        >
          {isMarked ? '★ Marked' : '☆ Mark for Review'}
        </button>

        {/* Next Button */}
        <button
          className="navigation-buttons__btn navigation-buttons__btn--primary"
          onClick={nextQuestion}
          disabled={isLastQuestion || isSubmitting}
          aria-label="Next question"
        >
          Next →
        </button>

        {/* Submit Section Button */}
        <button
          className="navigation-buttons__btn navigation-buttons__btn--submit"
          onClick={handleSubmitClick}
          disabled={isSubmitting}
          aria-label="Submit section"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Section'}
        </button>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="navigation-buttons__dialog-overlay" role="dialog" aria-modal="true">
          <div className="navigation-buttons__dialog">
            <h3 className="navigation-buttons__dialog-title">Submit Section?</h3>
            <p className="navigation-buttons__dialog-text">
              Are you sure you want to submit the <strong>{currentSectionName}</strong> section?
              You will not be able to return to this section after submission.
            </p>
            <div className="navigation-buttons__dialog-actions">
              <button
                className="navigation-buttons__dialog-btn navigation-buttons__dialog-btn--cancel"
                onClick={handleSubmitCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="navigation-buttons__dialog-btn navigation-buttons__dialog-btn--confirm"
                onClick={handleSubmitConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Submitting...
                  </>
                ) : (
                  'Yes, Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
