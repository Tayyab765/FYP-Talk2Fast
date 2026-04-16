import { useTest } from '../../context/TestContext'
import './QuestionPalette.css'

/**
 * QuestionPalette Component
 * 
 * Displays a grid of all questions in the current section with:
 * - Color coding: green (answered), gray (unanswered), orange (marked for review)
 * - Blue border for current question
 * - Clickable questions for navigation
 * - Real-time updates as answers are saved
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export default function QuestionPalette() {
  const {
    questions,
    answers,
    markedForReview,
    currentQuestionIndex,
    navigateToQuestion,
  } = useTest()

  // Determine status for a question
  const getQuestionStatus = (question, index) => {
    const isAnswered = answers.has(question._id)
    const isMarked = markedForReview.includes(question._id)
    const isCurrent = index === currentQuestionIndex

    if (isMarked) {
      return 'marked'
    } else if (isAnswered) {
      return 'answered'
    } else {
      return 'unanswered'
    }
  }

  // Handle question click
  const handleQuestionClick = (index) => {
    navigateToQuestion(index)
  }

  return (
    <div className="question-palette">
      <div className="question-palette__header">
        <h3 className="question-palette__title">Question Palette</h3>
        <div className="question-palette__legend">
          <div className="question-palette__legend-item">
            <span className="question-palette__legend-indicator question-palette__legend-indicator--answered"></span>
            <span className="question-palette__legend-text">Answered</span>
          </div>
          <div className="question-palette__legend-item">
            <span className="question-palette__legend-indicator question-palette__legend-indicator--unanswered"></span>
            <span className="question-palette__legend-text">Unanswered</span>
          </div>
          <div className="question-palette__legend-item">
            <span className="question-palette__legend-indicator question-palette__legend-indicator--marked"></span>
            <span className="question-palette__legend-text">Review</span>
          </div>
        </div>
      </div>

      <div className="question-palette__grid">
        {questions.map((question, index) => {
          const status = getQuestionStatus(question, index)
          const isCurrent = index === currentQuestionIndex

          return (
            <button
              key={question._id}
              className={`question-palette__item question-palette__item--${status} ${
                isCurrent ? 'question-palette__item--current' : ''
              }`}
              onClick={() => handleQuestionClick(index)}
              aria-label={`Question ${index + 1}, ${status}${isCurrent ? ', current' : ''}`}
              aria-current={isCurrent ? 'true' : 'false'}
            >
              {index + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
