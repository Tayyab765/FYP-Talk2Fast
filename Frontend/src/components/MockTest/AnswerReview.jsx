import { useEffect, useState } from 'react'
import { getReview } from '../../api/mockTestApi'
import './AnswerReview.css'

/**
 * AnswerReview Component
 * 
 * Displays all questions with user answers and correct answers for review.
 * Features:
 * - All questions organized by section
 * - User's answer and correct answer for each question
 * - Color coding: green (correct), red (incorrect), gray (unattempted)
 * - Navigation between questions
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8
 */
export default function AnswerReview({ attemptId, onBack }) {
  const [reviewData, setReviewData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Fetch review data on mount
  useEffect(() => {
    const fetchReview = async () => {
      try {
        setIsLoading(true)
        const data = await getReview(attemptId)
        setReviewData(data)
      } catch (err) {
        console.error('Failed to fetch review data:', err)
        setError('Failed to load answer review. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReview()
  }, [attemptId])

  // Get current section and question
  const currentSection = reviewData?.sections?.[currentSectionIndex]
  const currentQuestion = currentSection?.questions?.[currentQuestionIndex]
  const totalSections = reviewData?.sections?.length || 0
  const totalQuestionsInSection = currentSection?.questions?.length || 0

  // Navigation handlers
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (currentSectionIndex > 0) {
      // Move to previous section, last question
      setCurrentSectionIndex(currentSectionIndex - 1)
      setCurrentQuestionIndex(reviewData.sections[currentSectionIndex - 1].questions.length - 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestionsInSection - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (currentSectionIndex < totalSections - 1) {
      // Move to next section, first question
      setCurrentSectionIndex(currentSectionIndex + 1)
      setCurrentQuestionIndex(0)
    }
  }

  const handleSectionChange = (sectionIndex) => {
    setCurrentSectionIndex(sectionIndex)
    setCurrentQuestionIndex(0)
  }

  const handleQuestionJump = (questionIndex) => {
    setCurrentQuestionIndex(questionIndex)
  }

  // Check if navigation is possible
  const canGoPrevious = currentSectionIndex > 0 || currentQuestionIndex > 0
  const canGoNext = 
    currentSectionIndex < totalSections - 1 || 
    currentQuestionIndex < totalQuestionsInSection - 1

  // Get question status class
  const getQuestionStatusClass = (question) => {
    if (!question.userAnswer) {
      return 'question-status--unattempted'
    }
    return question.isCorrect ? 'question-status--correct' : 'question-status--incorrect'
  }

  // Get option class
  const getOptionClass = (optionKey, question) => {
    const isUserAnswer = question.userAnswer === optionKey
    const isCorrectAnswer = question.correctAnswer === optionKey
    
    if (isCorrectAnswer) {
      return 'option--correct'
    }
    if (isUserAnswer && !isCorrectAnswer) {
      return 'option--incorrect'
    }
    return ''
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="answer-review">
        <div className="answer-review__loading">
          <div className="spinner-large"></div>
          <p>Loading answer review...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="answer-review">
        <div className="answer-review__error">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn-back" onClick={onBack}>
            Back to Results
          </button>
        </div>
      </div>
    )
  }

  // No data state
  if (!reviewData || !currentSection || !currentQuestion) {
    return (
      <div className="answer-review">
        <div className="answer-review__error">
          <h2>No Data</h2>
          <p>No review data available.</p>
          <button className="btn-back" onClick={onBack}>
            Back to Results
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="answer-review">
      <div className="answer-review__container">
        {/* Header */}
        <div className="answer-review__header">
          <button className="btn-back" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Results
          </button>
          <h1 className="answer-review__title">Answer Review</h1>
        </div>

        {/* Section Tabs */}
        <div className="answer-review__sections">
          {reviewData.sections.map((section, index) => (
            <button
              key={index}
              className={`section-tab ${currentSectionIndex === index ? 'section-tab--active' : ''}`}
              onClick={() => handleSectionChange(index)}
            >
              {section.name}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="answer-review__content">
          {/* Question Display */}
          <div className="answer-review__question-area">
            {/* Question Header */}
            <div className="question-header">
              <div className="question-number">
                Question {currentQuestionIndex + 1} of {totalQuestionsInSection}
              </div>
              <div className={`question-status ${getQuestionStatusClass(currentQuestion)}`}>
                {!currentQuestion.userAnswer ? 'Unattempted' : 
                 currentQuestion.isCorrect ? 'Correct' : 'Incorrect'}
              </div>
            </div>

            {/* Question Text */}
            <div className="question-text">
              {currentQuestion.questionText}
            </div>

            {/* Options */}
            <div className="question-options">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <div
                  key={key}
                  className={`option ${getOptionClass(key, currentQuestion)}`}
                >
                  <div className="option-key">{key}</div>
                  <div className="option-text">{value}</div>
                  {currentQuestion.userAnswer === key && (
                    <div className="option-badge option-badge--user">Your Answer</div>
                  )}
                  {currentQuestion.correctAnswer === key && (
                    <div className="option-badge option-badge--correct">Correct Answer</div>
                  )}
                </div>
              ))}
            </div>

            {/* Topic Info */}
            {currentQuestion.topic && (
              <div className="question-topic">
                <strong>Topic:</strong> {currentQuestion.topic}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="question-navigation">
              <button
                className="nav-btn nav-btn--prev"
                onClick={handlePreviousQuestion}
                disabled={!canGoPrevious}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Previous
              </button>
              <button
                className="nav-btn nav-btn--next"
                onClick={handleNextQuestion}
                disabled={!canGoNext}
              >
                Next
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Question Palette */}
          <div className="answer-review__palette">
            <h3 className="palette-title">Questions</h3>
            <div className="palette-grid">
              {currentSection.questions.map((question, index) => (
                <button
                  key={index}
                  className={`palette-item ${getQuestionStatusClass(question)} ${
                    currentQuestionIndex === index ? 'palette-item--active' : ''
                  }`}
                  onClick={() => handleQuestionJump(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="palette-legend">
              <div className="legend-item">
                <div className="legend-color legend-color--correct"></div>
                <span>Correct</span>
              </div>
              <div className="legend-item">
                <div className="legend-color legend-color--incorrect"></div>
                <span>Incorrect</span>
              </div>
              <div className="legend-item">
                <div className="legend-color legend-color--unattempted"></div>
                <span>Unattempted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
