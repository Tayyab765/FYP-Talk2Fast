import { useState, useRef } from 'react'
import './Questionnaire.css'

const questions = [
  {
    id: 1,
    category: 'Interests',
    type: 'mcq',
    text: 'Which subject area excites you the most?',
    options: ['Mathematics & Computing', 'Biological & Life Sciences', 'Social Sciences & Psychology', 'Arts, Design & Media', 'Business & Economics'],
  },
  {
    id: 2,
    category: 'Work Style',
    type: 'likert',
    text: 'I prefer working independently rather than in a team.',
    scale: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'],
  },
  {
    id: 3,
    category: 'Skills',
    type: 'mcq',
    text: 'Which of these best describes your strongest skill?',
    options: ['Problem solving & Logical thinking', 'Communication & Persuasion', 'Creativity & Innovation', 'Data analysis & Research', 'Leadership & Management'],
  },
  {
    id: 4,
    category: 'Environment',
    type: 'likert',
    text: 'I see myself working in a fast-paced, innovative environment.',
    scale: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'],
  },
  {
    id: 5,
    category: 'Goals',
    type: 'mcq',
    text: 'What matters most to you in a career?',
    options: ['High earning potential', 'Work-life balance', 'Making a social impact', 'Creative expression', 'Continuous learning'],
  },
]

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)
const NextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)
const SaveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function Questionnaire() {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [slideClass, setSlideClass] = useState('q-slide-enter')
  const [saved, setSaved] = useState(false)
  const timeoutRef = useRef(null)

  const q = questions[current]
  const pct = Math.round(((Object.keys(answers).length) / questions.length) * 100)

  function navigate(dir) {
    setSlideClass('')
    setTimeout(() => {
      setCurrent((prev) => prev + dir)
      setSlideClass('q-slide-enter')
    }, 20)
  }

  function handleAnswer(val) {
    setAnswers((prev) => ({ ...prev, [q.id]: val }))
    setSaved(false)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setSaved(true), 800)
  }

  const selected = answers[q.id]

  return (
    <div className="questionnaire-page">
      {/* Progress */}
      <div className="q-header">
        <div className="q-meta">
          <span className="q-step-label">Question {current + 1} of {questions.length}</span>
          <span className="q-pct">{pct}% Complete</span>
        </div>
        <div className="q-progress-track">
          <div className="q-progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className={`q-card ${slideClass}`}>
        <div className="q-category-chip">{q.category}</div>
        <p className="q-text">{q.text}</p>

        {q.type === 'mcq' && (
          <div className="q-options">
            {q.options.map((opt) => (
              <label
                key={opt}
                className={`q-option-label${selected === opt ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  className="q-radio"
                  name={`q-${q.id}`}
                  value={opt}
                  checked={selected === opt}
                  onChange={() => handleAnswer(opt)}
                />
                <span className="q-radio-circle"><span className="q-radio-dot" /></span>
                {opt}
              </label>
            ))}
          </div>
        )}

        {q.type === 'likert' && (
          <div className="q-likert">
            <div className="q-likert-labels">
              <span>{q.scale[0]}</span>
              <span>{q.scale[q.scale.length - 1]}</span>
            </div>
            <div className="q-likert-options">
              {q.scale.map((s) => (
                <button
                  key={s}
                  className={`q-likert-btn${selected === s ? ' selected' : ''}`}
                  onClick={() => handleAnswer(s)}
                  type="button"
                >
                  {s.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="q-nav">
        <button
          className="q-btn q-btn-prev"
          onClick={() => navigate(-1)}
          disabled={current === 0}
          type="button"
        >
          <BackIcon /> Previous
        </button>

        {saved && (
          <span className="q-autosave">
            <SaveIcon /> Auto-saved
          </span>
        )}

        {current < questions.length - 1 ? (
          <button
            className="q-btn q-btn-next"
            onClick={() => navigate(1)}
            disabled={!selected}
            type="button"
          >
            Next <NextIcon />
          </button>
        ) : (
          <button
            className="q-btn q-btn-next"
            disabled={!selected}
            type="button"
          >
            Submit <NextIcon />
          </button>
        )}
      </div>
    </div>
  )
}
