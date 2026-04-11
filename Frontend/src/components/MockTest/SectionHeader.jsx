import { useTest } from '../../context/TestContext'
import Timer from './Timer'
import './SectionHeader.css'

/**
 * SectionHeader Component
 * 
 * Displays section information:
 * - Section name
 * - Answered count (e.g., "35/50 answered")
 * - Integrated Timer component
 * 
 * Requirements: 8.6, 8.7
 */
export default function SectionHeader() {
  const {
    questions,
    answers,
    currentSection,
  } = useTest()

  // Section names
  const sectionNames = ['Advance Math', 'Basic Math', 'IQ & Logical', 'English']
  const currentSectionName = sectionNames[currentSection] || 'Section'

  // Calculate answered count
  const totalQuestions = questions.length
  const answeredCount = questions.filter((question) => 
    answers.has(question._id)
  ).length

  return (
    <div className="section-header">
      <div className="section-header__info">
        <h2 className="section-header__title">{currentSectionName}</h2>
        <div className="section-header__progress">
          <span className="section-header__progress-count">
            {answeredCount}/{totalQuestions}
          </span>
          <span className="section-header__progress-label">answered</span>
        </div>
      </div>

      <div className="section-header__timer">
        <Timer />
      </div>
    </div>
  )
}
