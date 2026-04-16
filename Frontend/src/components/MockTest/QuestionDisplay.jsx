import { useState, useEffect, useRef } from 'react'
import { useTest } from '../../context/TestContext'
import './QuestionDisplay.css'

/**
 * QuestionDisplay Component
 * 
 * Displays a single question with:
 * - Question text and four options (A, B, C, D)
 * - Highlighted selected answer
 * - Auto-save with debouncing (500ms)
 * - Loading indicator during save
 * - Success indicator after save
 * - Question number and total questions
 * 
 * Requirements: 4.1, 4.5, 4.6, 5.1, 5.2, 5.3, 24.1, 24.2
 */
export default function QuestionDisplay() {
  const {
    questions,
    answers,
    currentQuestionIndex,
    selectAnswer,
    isSaving,
  } = useTest()

  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false)
  const previousSavingRef = useRef(isSaving)

  // Get current question
  const currentQuestion = questions[currentQuestionIndex]

  // Get selected answer for current question
  const selectedAnswer = currentQuestion ? answers.get(currentQuestion._id) : null

  // Handle answer selection
  const handleAnswerSelect = (option) => {
    if (!currentQuestion) return
    selectAnswer(currentQuestion._id, option)
  }

  // Show success indicator when save completes
  useEffect(() => {
    // Detect transition from saving to not saving
    if (previousSavingRef.current && !isSaving) {
      setShowSuccessIndicator(true)
      
      // Hide success indicator after 1 second
      const timer = setTimeout(() => {
        setShowSuccessIndicator(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
    
    previousSavingRef.current = isSaving
  }, [isSaving])

  // Show loading state if no question available
  if (!currentQuestion) {
    return (
      <div className="question-display">
        <div className="question-display__loading">Loading question...</div>
      </div>
    )
  }

  return (
    <div className="question-display">
      {/* Question Header */}
      <div className="question-display__header">
        <div className="question-display__number">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        
        {/* Save Status Indicators */}
        <div className="question-display__status">
          {isSaving && (
            <div className="question-display__saving">
              <span className="spinner"></span>
              Saving...
            </div>
          )}
          {showSuccessIndicator && !isSaving && (
            <div className="question-display__saved">
              <span className="checkmark">✓</span>
              Saved
            </div>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="question-display__text">
        {currentQuestion.questionText}
      </div>

      {/* Answer Options */}
      <div className="question-display__options">
        {['A', 'B', 'C', 'D'].map((option) => (
          <button
            key={option}
            className={`question-display__option ${
              selectedAnswer === option ? 'question-display__option--selected' : ''
            }`}
            onClick={() => handleAnswerSelect(option)}
            aria-label={`Option ${option}`}
            aria-pressed={selectedAnswer === option}
          >
            <span className="question-display__option-label">{option}</span>
            <span className="question-display__option-text">
              {currentQuestion.options[option]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
