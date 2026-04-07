import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchQuestions, submitProfile } from '../../api/career'
import './Questionnaire.css'

/* ── Icons ──────────────────────────────────────────────────────────────── */
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
const CheckIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

/* ── Skeleton Loading ────────────────────────────────────────────────────── */
function QuestionSkeleton() {
  return (
    <div className="q-card q-slide-enter">
      <div className="skeleton-line" style={{ width: '30%', height: '22px', marginBottom: '1rem' }} />
      <div className="skeleton-line" style={{ width: '80%', height: '18px', marginBottom: '0.5rem' }} />
      <div className="skeleton-line" style={{ width: '60%', height: '18px', marginBottom: '1.5rem' }} />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-line" style={{ width: '100%', height: '44px', marginBottom: '0.75rem', borderRadius: '10px' }} />
      ))}
    </div>
  )
}

/* ── CATEGORY label map ──────────────────────────────────────────────────── */
const CATEGORY_LABELS = {
  academic_background: 'Academic Background',
  interests: 'Interests',
  skills: 'Skills & Strengths',
  personality: 'Personality Traits',
  work_style: 'Work Style',
  career_inclination: 'Career Inclination',
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function Questionnaire() {
  const navigate = useNavigate()

  // Data state
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Question navigation
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [slideClass, setSlideClass] = useState('q-slide-enter')

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Autosave flash
  const [saved, setSaved] = useState(false)
  const timeoutRef = useRef(null)

  /* Fetch questions on mount */
  useEffect(() => {
    fetchQuestions()
      .then(data => {
        setQuestions(data.data.questions)
        setLoading(false)
      })
      .catch(err => {
        setLoadError(err.message || 'Failed to load questions.')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="questionnaire-page">
        <div className="q-header">
          <div className="q-meta">
            <span className="q-step-label">Loading questions…</span>
            <span className="q-pct">0% Complete</span>
          </div>
          <div className="q-progress-track"><div className="q-progress-fill" style={{ width: '0%' }} /></div>
        </div>
        <QuestionSkeleton />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="questionnaire-page">
        <div className="q-error-state">
          <div className="q-error-icon">⚠️</div>
          <div className="q-error-title">Failed to Load Questions</div>
          <div className="q-error-desc">{loadError}</div>
          <button className="q-btn q-btn-next" onClick={() => window.location.reload()} type="button">
            Retry
          </button>
        </div>
      </div>
    )
  }

  /* ── Success Screen ─────────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="questionnaire-page">
        <div className="q-success-state">
          <div className="q-success-icon"><CheckIcon /></div>
          <div className="q-success-title">Assessment Submitted!</div>
          <div className="q-success-desc">
            Your profile has been saved. Our AI is ready to generate personalised career recommendations.
          </div>
          <div className="q-success-actions">
            <button
              className="q-btn q-btn-next"
              onClick={() => navigate('/dashboard/career/recommendations')}
              type="button"
            >
              View Recommendations <NextIcon />
            </button>
            <button
              className="q-btn q-btn-prev"
              onClick={() => navigate('/dashboard/career')}
              type="button"
              style={{ marginTop: '0.75rem' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[current]
  const totalAnswered = Object.keys(answers).filter(k => {
    const v = answers[k]
    return v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  }).length
  const pct = Math.round((totalAnswered / questions.length) * 100)
  const progressPct = Math.round(((current + 1) / questions.length) * 100)

  /* ── Navigation ─────────────────────────────────────────────────────────── */
  function navigate_(dir) {
    setSlideClass('')
    setTimeout(() => {
      setCurrent(prev => prev + dir)
      setSlideClass('q-slide-enter')
    }, 20)
  }

  /* ── Answer Handlers ─────────────────────────────────────────────────────── */
  function handleSingleSelect(val) {
    setAnswers(prev => ({ ...prev, [q.id]: val }))
    flashSaved()
  }

  function handleMultiSelect(val) {
    setAnswers(prev => {
      const cur = Array.isArray(prev[q.id]) ? prev[q.id] : []
      const max = q.maxSelections || 5
      if (cur.includes(val)) {
        return { ...prev, [q.id]: cur.filter(v => v !== val) }
      }
      if (cur.length >= max) return prev // cap at maxSelections
      return { ...prev, [q.id]: [...cur, val] }
    })
    flashSaved()
  }

  function handleScale(val) {
    setAnswers(prev => ({ ...prev, [q.id]: val }))
    flashSaved()
  }

  function flashSaved() {
    setSaved(false)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setSaved(true), 800)
  }

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitProfile(answers)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selected = answers[q.id]
  const isAnswered = q.required === false
    ? true
    : q.type === 'multi_select'
      ? Array.isArray(selected) && selected.length > 0
      : selected !== undefined && selected !== null && selected !== ''

  const isLast = current === questions.length - 1

  /* ── Current question category label ─────────────────────────────────────── */
  const categoryLabel = CATEGORY_LABELS[q.category] || q.category

  return (
    <div className="questionnaire-page">
      {/* Progress */}
      <div className="q-header">
        <div className="q-meta">
          <span className="q-step-label">Question {current + 1} of {questions.length}</span>
          <span className="q-pct">{pct}% Complete</span>
        </div>
        <div className="q-progress-track">
          <div className="q-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className={`q-card ${slideClass}`}>
        <div className="q-category-chip">
          {categoryLabel}
          {q.required === false && <span className="q-optional-badge"> · Optional</span>}
        </div>
        <p className="q-text">{q.question}</p>

        {/* ── single_select ────────────────────────────────────────────────── */}
        {q.type === 'single_select' && (
          <div className="q-options">
            {q.options.map(opt => (
              <label
                key={opt.value}
                className={`q-option-label${selected === opt.value ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  className="q-radio"
                  name={`q-${q.id}`}
                  value={opt.value}
                  checked={selected === opt.value}
                  onChange={() => handleSingleSelect(opt.value)}
                />
                <span className="q-radio-circle"><span className="q-radio-dot" /></span>
                {opt.label}
              </label>
            ))}
          </div>
        )}

        {/* ── multi_select ─────────────────────────────────────────────────── */}
        {q.type === 'multi_select' && (
          <>
            {q.maxSelections && (
              <p className="q-multi-hint">Select up to {q.maxSelections} options</p>
            )}
            <div className="q-options">
              {q.options.map(opt => {
                const checked = Array.isArray(selected) && selected.includes(opt.value)
                const atMax = Array.isArray(selected) && selected.length >= (q.maxSelections || 5) && !checked
                return (
                  <label
                    key={opt.value}
                    className={`q-option-label${checked ? ' selected' : ''}${atMax ? ' disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="q-radio"
                      name={`q-${q.id}`}
                      value={opt.value}
                      checked={checked}
                      disabled={atMax}
                      onChange={() => handleMultiSelect(opt.value)}
                    />
                    <span className="q-radio-circle">
                      {checked && <span className="q-radio-dot" />}
                    </span>
                    {opt.label}
                  </label>
                )
              })}
            </div>
          </>
        )}

        {/* ── scale (1–5 Likert) ───────────────────────────────────────────── */}
        {q.type === 'scale' && (
          <div className="q-likert">
            <div className="q-likert-labels">
              <span>{q.scaleLabels?.[1] || 'Strongly Disagree'}</span>
              <span>{q.scaleLabels?.[5] || 'Strongly Agree'}</span>
            </div>
            <div className="q-likert-options">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  className={`q-likert-btn${selected === n ? ' selected' : ''}`}
                  onClick={() => handleScale(n)}
                  type="button"
                  title={q.scaleLabels?.[n] || String(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            {selected !== undefined && (
              <p className="q-scale-selected-label">{q.scaleLabels?.[selected]}</p>
            )}
          </div>
        )}
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="q-submit-error">⚠️ {submitError}</div>
      )}

      {/* Navigation */}
      <div className="q-nav">
        <button
          className="q-btn q-btn-prev"
          onClick={() => navigate_(-1)}
          disabled={current === 0}
          type="button"
        >
          <BackIcon /> Previous
        </button>

        {saved && (
          <span className="q-autosave"><SaveIcon /> Auto-saved</span>
        )}

        {!isLast ? (
          <button
            className="q-btn q-btn-next"
            onClick={() => navigate_(1)}
            disabled={!isAnswered}
            type="button"
          >
            Next <NextIcon />
          </button>
        ) : (
          <button
            className="q-btn q-btn-next"
            onClick={handleSubmit}
            disabled={!isAnswered || submitting}
            type="button"
          >
            {submitting ? 'Submitting…' : 'Submit'} {!submitting && <NextIcon />}
          </button>
        )}
      </div>
    </div>
  )
}
